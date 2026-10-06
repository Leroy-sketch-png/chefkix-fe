import { NextResponse } from 'next/server'
import { normalizePhotoRecipeMatches } from '@/lib/photo-intelligence-contract'
import {
	createPhotoUpstreamSignal,
	getPhotoProxyAuthFailure,
	isRequestBodyTooLarge,
	MAX_RECIPE_MATCH_REQUEST_BYTES,
	photoProxyError,
	photoUpstreamError,
} from '@/lib/photo-intelligence-proxy'

const getEndpoint = () => process.env.HGAT_RECIPE_MATCH_BACKEND_URL?.trim()

/** Proxy the stable FE contract to the Lead's HGAT ingredient-to-recipe endpoint. */
export async function POST(request: Request) {
	const authFailure = await getPhotoProxyAuthFailure(request)
	if (authFailure) return authFailure
	if (isRequestBodyTooLarge(request, MAX_RECIPE_MATCH_REQUEST_BYTES)) {
		return photoProxyError(
			'The ingredient list is too large.',
			413,
			'REQUEST_TOO_LARGE',
		)
	}

	const endpoint = getEndpoint()
	if (!endpoint) {
		return photoProxyError(
			'Ingredient recipe matching is waiting for the HGAT endpoint.',
			503,
			'INTEGRATION_PENDING',
		)
	}

	const rawBody = await request.text().catch(() => '')
	if (
		new TextEncoder().encode(rawBody).byteLength >
		MAX_RECIPE_MATCH_REQUEST_BYTES
	) {
		return photoProxyError(
			'The ingredient list is too large.',
			413,
			'REQUEST_TOO_LARGE',
		)
	}
	let body: unknown
	try {
		body = JSON.parse(rawBody)
	} catch {
		body = null
	}
	if (
		!body ||
		typeof body !== 'object' ||
		!Array.isArray((body as { ingredients?: unknown }).ingredients) ||
		(body as { ingredients: unknown[] }).ingredients.length === 0 ||
		(body as { ingredients: unknown[] }).ingredients.length > 100 ||
		!(body as { ingredients: unknown[] }).ingredients.every(
			ingredient =>
				typeof ingredient === 'string' &&
				ingredient.trim().length > 0 &&
				ingredient.trim().length <= 120,
		)
	) {
		return photoProxyError(
			'Provide between 1 and 100 ingredient names, each no longer than 120 characters.',
			400,
			'INVALID_REQUEST',
		)
	}
	const ingredients = Array.from(
		new Set(
			(body as { ingredients: string[] }).ingredients.map(value =>
				value.trim(),
			),
		),
	)
	const { signal, timeoutSignal } = createPhotoUpstreamSignal(request)

	try {
		const upstreamResponse = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ ingredients }),
			cache: 'no-store',
			signal,
		})
		const upstreamPayload = await upstreamResponse.json().catch(() => null)
		if (!upstreamResponse.ok) {
			return photoProxyError(
				(upstreamPayload as { message?: string } | null)?.message ||
					'HGAT recipe matching is unavailable.',
				upstreamResponse.status,
				'UPSTREAM_UNAVAILABLE',
			)
		}

		const matches = normalizePhotoRecipeMatches(upstreamPayload)
		if (!matches) {
			return photoProxyError(
				'HGAT returned an invalid recipe match response.',
				502,
				'INVALID_UPSTREAM_RESPONSE',
			)
		}
		return NextResponse.json(
			{
				success: true,
				data: {
					matches,
					queryIngredients: ingredients,
					source: 'backend',
				},
				meta: { source: 'backend' },
			},
			{
				headers: { 'Cache-Control': 'no-store' },
			},
		)
	} catch {
		return photoUpstreamError(
			timeoutSignal,
			'HGAT recipe matching is unavailable.',
		)
	}
}
