import { NextResponse } from 'next/server'
import { normalizePhotoRecipeMatches } from '@/lib/photo-intelligence-contract'

const getEndpoint = () => process.env.HGAT_RECIPE_MATCH_BACKEND_URL?.trim()

/** Proxy the stable FE contract to the Lead's HGAT ingredient-to-recipe endpoint. */
export async function POST(request: Request) {
	const endpoint = getEndpoint()
	if (!endpoint) {
		return NextResponse.json(
			{
				success: false,
				message: 'Ingredient recipe matching is waiting for the HGAT endpoint.',
				code: 'INTEGRATION_PENDING',
			},
			{ status: 503 },
		)
	}

	const body = await request.json().catch(() => null)
	if (
		!body ||
		typeof body !== 'object' ||
		!Array.isArray((body as { ingredients?: unknown }).ingredients)
	) {
		return NextResponse.json(
			{
				success: false,
				message: 'Provide an ingredients array.',
				code: 'INVALID_REQUEST',
			},
			{ status: 400 },
		)
	}

	try {
		const upstreamResponse = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
			cache: 'no-store',
		})
		const upstreamPayload = await upstreamResponse.json().catch(() => null)
		if (!upstreamResponse.ok) {
			return NextResponse.json(
				{
					success: false,
					message:
						(upstreamPayload as { message?: string } | null)?.message ||
						'HGAT recipe matching is unavailable.',
				},
				{ status: upstreamResponse.status },
			)
		}

		const matches = normalizePhotoRecipeMatches(upstreamPayload)
		if (!matches) {
			return NextResponse.json(
				{
					success: false,
					message: 'HGAT returned an invalid recipe match response.',
				},
				{ status: 502 },
			)
		}
		const requestIngredients = (
			body as { ingredients: unknown[] }
		).ingredients.filter((item): item is string => typeof item === 'string')
		return NextResponse.json({
			success: true,
			data: {
				matches,
				queryIngredients: requestIngredients,
				source: 'backend',
			},
			meta: { source: 'backend' },
		})
	} catch {
		return NextResponse.json(
			{ success: false, message: 'HGAT recipe matching is unavailable.' },
			{ status: 502 },
		)
	}
}
