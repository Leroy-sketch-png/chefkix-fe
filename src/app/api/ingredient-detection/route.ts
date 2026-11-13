import { NextResponse } from 'next/server'
import {
	createPhotoUpstreamSignal,
	getPhotoProxyAuthFailure,
	isRequestBodyTooLarge,
	MAX_PHOTO_BYTES,
	MAX_PHOTO_REQUEST_BYTES,
	photoProxyError,
	photoUpstreamError,
} from '@/lib/photo-intelligence-proxy'

const getRealDetectionEndpoint = () =>
	process.env.INGREDIENT_DETECTION_BACKEND_URL?.trim()

const isMockDetectionsEnabled = () =>
	process.env.NEXT_PUBLIC_INGREDIENT_DETECTION_MOCK === 'true'

// Provider handoff contract:
// - request: multipart/form-data with an `image` field
// - response: either { detections } or { data: { detections } }
// - each bounding box uses normalized x/y/width/height values from 0 to 1

const MOCK_DETECTIONS = [
	{
		id: 'tomato-1',
		name: 'Tomato',
		confidence: 0.97,
		boundingBox: { x: 0.12, y: 0.2, width: 0.24, height: 0.28 },
	},
	{
		id: 'onion-1',
		name: 'Onion',
		confidence: 0.94,
		boundingBox: { x: 0.58, y: 0.16, width: 0.24, height: 0.3 },
	},
	{
		id: 'olive-oil-1',
		name: 'Olive oil',
		confidence: 0.91,
		boundingBox: { x: 0.34, y: 0.54, width: 0.2, height: 0.3 },
	},
	{
		id: 'basil-1',
		name: 'Basil',
		confidence: 0.88,
		boundingBox: { x: 0.7, y: 0.58, width: 0.18, height: 0.2 },
	},
] as const

const getUpstreamDetections = (payload: unknown) => {
	if (!payload || typeof payload !== 'object') return null

	const record = payload as Record<string, unknown>
	const nestedData = record.data
	if (nestedData && typeof nestedData === 'object') {
		const detections = (nestedData as Record<string, unknown>).detections
		if (Array.isArray(detections)) return detections
	}

	return Array.isArray(record.detections) ? record.detections : null
}

async function proxyToRealDetector(request: Request, image: File) {
	const endpoint = getRealDetectionEndpoint()
	if (!endpoint) return null

	const requestUrl = new URL(request.url)
	const confidenceThreshold = requestUrl.searchParams.get(
		'confidence_threshold',
	)
	if (
		confidenceThreshold !== null &&
		(confidenceThreshold.trim() === '' ||
			!Number.isFinite(Number(confidenceThreshold)) ||
			Number(confidenceThreshold) < 0 ||
			Number(confidenceThreshold) > 1)
	) {
		return photoProxyError(
			'Detection threshold must be between 0 and 1.',
			400,
			'INVALID_REQUEST',
		)
	}
	const targetUrl = new URL(endpoint)
	if (confidenceThreshold) {
		targetUrl.searchParams.set('confidence_threshold', confidenceThreshold)
	}

	const body = new FormData()
	body.append('image', image, image.name || 'ingredient-scan.jpg')
	const { signal, timeoutSignal } = createPhotoUpstreamSignal(request)

	try {
		const apiKey = process.env.AI_SERVICE_API_KEY?.trim()
		const upstreamResponse = await fetch(targetUrl.toString(), {
			method: 'POST',
			body,
			headers: {
				Accept: 'application/json',
				...(apiKey ? { 'X-AI-Service-Key': apiKey } : {}),
			},
			cache: 'no-store',
			signal,
		})
		const upstreamPayload = await upstreamResponse.json().catch(() => null)

		if (!upstreamResponse.ok) {
			return NextResponse.json(
				{
					success: false,
					message:
						(upstreamPayload as { message?: string } | null)?.message ||
						'Detection service is unavailable.',
				},
				{
					status: upstreamResponse.status,
					headers: { 'Cache-Control': 'no-store' },
				},
			)
		}

		const detections = getUpstreamDetections(upstreamPayload)
		if (!detections) {
			return NextResponse.json(
				{
					success: false,
					message: 'Detection service returned an invalid response.',
				},
				{ status: 502, headers: { 'Cache-Control': 'no-store' } },
			)
		}

		const rawMeta = (upstreamPayload as Record<string, unknown>).meta
		const upstreamMeta =
			rawMeta && typeof rawMeta === 'object'
				? (rawMeta as Record<string, unknown>)
				: {}
		const speed = upstreamMeta.speed
		const validSpeed =
			speed &&
			typeof speed === 'object' &&
			['preprocess_ms', 'inference_ms', 'postprocess_ms', 'total_ms'].every(
				key => {
					const value = (speed as Record<string, unknown>)[key]
					return (
						typeof value === 'number' && Number.isFinite(value) && value >= 0
					)
				},
			)

		return NextResponse.json(
			{
				success: true,
				data: { detections },
				meta: {
					source: 'real',
					...(typeof upstreamMeta.model === 'string'
						? { model: upstreamMeta.model }
						: {}),
					...(typeof upstreamMeta.device === 'string'
						? { device: upstreamMeta.device }
						: {}),
					...(validSpeed
						? {
								speed: Object.fromEntries(
									[
										'preprocess_ms',
										'inference_ms',
										'postprocess_ms',
										'total_ms',
									].map(key => [key, (speed as Record<string, unknown>)[key]]),
								),
							}
						: {}),
				},
			},
			{ headers: { 'Cache-Control': 'no-store' } },
		)
	} catch {
		return photoUpstreamError(
			timeoutSignal,
			'Detection service is unavailable.',
		)
	}
}

export async function POST(request: Request) {
	const authFailure = await getPhotoProxyAuthFailure(request)
	if (authFailure) return authFailure
	if (isRequestBodyTooLarge(request, MAX_PHOTO_REQUEST_BYTES)) {
		return photoProxyError(
			'The image is too large to scan.',
			413,
			'IMAGE_TOO_LARGE',
		)
	}

	const formData = await request.formData().catch(() => null)
	if (!formData) {
		return photoProxyError(
			'Please provide a valid image upload.',
			400,
			'INVALID_REQUEST',
		)
	}
	const image = formData.get('image')

	if (!(image instanceof File) || !image.type.startsWith('image/')) {
		return photoProxyError(
			'Please provide an image to scan.',
			400,
			'INVALID_REQUEST',
		)
	}

	if (image.size === 0) {
		return photoProxyError(
			'The selected image is empty.',
			400,
			'INVALID_REQUEST',
		)
	}
	if (image.size > MAX_PHOTO_BYTES) {
		return photoProxyError(
			'The image is too large to scan.',
			413,
			'IMAGE_TOO_LARGE',
		)
	}

	const realResponse = await proxyToRealDetector(request, image)
	if (realResponse) return realResponse

	if (!isMockDetectionsEnabled()) {
		return photoProxyError(
			'Ingredient detection is waiting for the configured YOLOv8 service.',
			503,
			'INTEGRATION_PENDING',
		)
	}

	return NextResponse.json(
		{
			success: true,
			data: { detections: MOCK_DETECTIONS },
			meta: { source: 'mock', replaceWith: 'YOLOv8 ingredient detector' },
		},
		{ headers: { 'Cache-Control': 'no-store' } },
	)
}
