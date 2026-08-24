import { NextResponse } from 'next/server'
import { normalizePhotoRecipeMatches } from '@/lib/photo-intelligence-contract'

const getEndpoint = () => process.env.CROSS_MODAL_RETRIEVAL_BACKEND_URL?.trim()

/** Proxy the stable FE contract to the Lead's CLIP/cross-modal retrieval endpoint. */
export async function POST(request: Request) {
	const endpoint = getEndpoint()
	if (!endpoint) {
		return NextResponse.json(
			{
				success: false,
				message: 'Dish photo retrieval is waiting for the CLIP endpoint.',
				code: 'INTEGRATION_PENDING',
			},
			{ status: 503 },
		)
	}

	const formData = await request.formData()
	const image = formData.get('image')
	if (
		!(image instanceof File) ||
		!image.type.startsWith('image/') ||
		image.size === 0
	) {
		return NextResponse.json(
			{
				success: false,
				message: 'Please provide a non-empty dish image.',
				code: 'INVALID_REQUEST',
			},
			{ status: 400 },
		)
	}

	const body = new FormData()
	body.append('image', image, image.name || 'dish-photo.jpg')
	try {
		const upstreamResponse = await fetch(endpoint, {
			method: 'POST',
			body,
			headers: { Accept: 'application/json' },
			cache: 'no-store',
		})
		const upstreamPayload = await upstreamResponse.json().catch(() => null)
		if (!upstreamResponse.ok) {
			return NextResponse.json(
				{
					success: false,
					message:
						(upstreamPayload as { message?: string } | null)?.message ||
						'Cross-modal retrieval is unavailable.',
				},
				{ status: upstreamResponse.status },
			)
		}
		const matches = normalizePhotoRecipeMatches(upstreamPayload)
		if (!matches) {
			return NextResponse.json(
				{
					success: false,
					message: 'CLIP returned an invalid recipe match response.',
				},
				{ status: 502 },
			)
		}
		return NextResponse.json({
			success: true,
			data: { matches, source: 'backend' },
			meta: { source: 'backend' },
		})
	} catch {
		return NextResponse.json(
			{ success: false, message: 'Cross-modal retrieval is unavailable.' },
			{ status: 502 },
		)
	}
}
