import { NextResponse } from 'next/server'
import { normalizePhotoRecipeMatches } from '@/lib/photo-intelligence-contract'
import {
	createPhotoUpstreamSignal,
	getPhotoProxyAuthFailure,
	isRequestBodyTooLarge,
	MAX_PHOTO_BYTES,
	MAX_PHOTO_REQUEST_BYTES,
	photoProxyError,
	photoUpstreamError,
} from '@/lib/photo-intelligence-proxy'

const getEndpoint = () => process.env.CROSS_MODAL_RETRIEVAL_BACKEND_URL?.trim()

/** Proxy the stable FE contract to the Lead's CLIP/cross-modal retrieval endpoint. */
export async function POST(request: Request) {
	const authFailure = await getPhotoProxyAuthFailure(request)
	if (authFailure) return authFailure
	if (isRequestBodyTooLarge(request, MAX_PHOTO_REQUEST_BYTES)) {
		return photoProxyError(
			'The image is too large to search.',
			413,
			'IMAGE_TOO_LARGE',
		)
	}

	const endpoint = getEndpoint()
	if (!endpoint) {
		return photoProxyError(
			'Dish photo retrieval is waiting for the CLIP endpoint.',
			503,
			'INTEGRATION_PENDING',
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
	if (
		!(image instanceof File) ||
		!image.type.startsWith('image/') ||
		image.size === 0
	) {
		return photoProxyError(
			'Please provide a non-empty dish image.',
			400,
			'INVALID_REQUEST',
		)
	}
	if (image.size > MAX_PHOTO_BYTES) {
		return photoProxyError(
			'The image is too large to search.',
			413,
			'IMAGE_TOO_LARGE',
		)
	}

	const body = new FormData()
	body.append('image', image, image.name || 'dish-photo.jpg')
	const { signal, timeoutSignal } = createPhotoUpstreamSignal(request)
	try {
		const upstreamResponse = await fetch(endpoint, {
			method: 'POST',
			body,
			headers: { Accept: 'application/json' },
			cache: 'no-store',
			signal,
		})
		const upstreamPayload = await upstreamResponse.json().catch(() => null)
		if (!upstreamResponse.ok) {
			return photoProxyError(
				(upstreamPayload as { message?: string } | null)?.message ||
					'Cross-modal retrieval is unavailable.',
				upstreamResponse.status,
				'UPSTREAM_UNAVAILABLE',
			)
		}
		const matches = normalizePhotoRecipeMatches(upstreamPayload)
		if (!matches) {
			return photoProxyError(
				'CLIP returned an invalid recipe match response.',
				502,
				'INVALID_UPSTREAM_RESPONSE',
			)
		}
		return NextResponse.json(
			{
				success: true,
				data: { matches, source: 'backend' },
				meta: { source: 'backend' },
			},
			{ headers: { 'Cache-Control': 'no-store' } },
		)
	} catch {
		return photoUpstreamError(
			timeoutSignal,
			'Cross-modal retrieval is unavailable.',
		)
	}
}
