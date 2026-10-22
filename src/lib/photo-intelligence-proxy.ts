import { NextResponse } from 'next/server'
import app from '@/configs/app'
import { authenticateAiProxyCaller } from '@/lib/ai-proxy-auth'

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const MAX_PHOTO_REQUEST_BYTES = MAX_PHOTO_BYTES + 64 * 1024
export const MAX_RECIPE_MATCH_REQUEST_BYTES = 32 * 1024
export const PHOTO_UPSTREAM_TIMEOUT_MS = 30_000

export function photoProxyError(message: string, status: number, code: string) {
	return NextResponse.json(
		{ success: false, message, code },
		{ status, headers: { 'Cache-Control': 'no-store' } },
	)
}

export async function getPhotoProxyAuthFailure(request: Request) {
	const backendUrl = (
		process.env.BACKEND_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		app.API_BASE_URL
	)
		.trim()
		.replace(/\/+$/, '')
	const caller = await authenticateAiProxyCaller(
		request.headers.get('authorization'),
		backendUrl,
	)
	if (caller.authenticated === true) return null

	return photoProxyError(
		caller.message,
		caller.status,
		caller.status === 401 ? 'UNAUTHENTICATED' : 'AUTH_UNAVAILABLE',
	)
}

export function isRequestBodyTooLarge(request: Request, maximumBytes: number) {
	const length = request.headers.get('content-length')
	return (
		length !== null && /^\d+$/.test(length) && Number(length) > maximumBytes
	)
}

export function createPhotoUpstreamSignal(request: Request) {
	const timeoutSignal = AbortSignal.timeout(PHOTO_UPSTREAM_TIMEOUT_MS)
	return {
		signal: AbortSignal.any([request.signal, timeoutSignal]),
		timeoutSignal,
	}
}

export function photoUpstreamError(
	timeoutSignal: AbortSignal,
	message: string,
) {
	return timeoutSignal.aborted
		? photoProxyError(message + ' Timed out.', 504, 'UPSTREAM_TIMEOUT')
		: photoProxyError(message, 502, 'UPSTREAM_UNAVAILABLE')
}
