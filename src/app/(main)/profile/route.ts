import { NextRequest, NextResponse } from 'next/server'
import { API_ENDPOINTS } from '@/constants'
import { getServerBackendUrl } from '@/lib/server-backend-url'

export const dynamic = 'force-dynamic'

type RefreshResponse = {
	data?: {
		accessToken?: string
	}
}

type MeResponse = {
	data?: {
		userId?: string
	}
}

const buildBackendUrl = (path: string) => `${getServerBackendUrl()}${path}`

function createSignInRedirect(request: NextRequest) {
	return NextResponse.redirect(
		new URL('/auth/sign-in?returnTo=%2Fprofile', request.url),
	)
}

function forwardRefreshCookie(source: Response, target: NextResponse) {
	const refreshCookie = source.headers.get('set-cookie')

	if (refreshCookie) {
		target.headers.set('set-cookie', refreshCookie)
	}

	return target
}

export async function GET(request: NextRequest) {
	const cookieHeader = request.headers.get('cookie')

	if (!cookieHeader) {
		return createSignInRedirect(request)
	}

	let refreshResponse: Response

	try {
		refreshResponse = await fetch(
			buildBackendUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN),
			{
				method: 'POST',
				headers: {
					cookie: cookieHeader,
				},
				cache: 'no-store',
			},
		)
	} catch {
		return createSignInRedirect(request)
	}

	if (!refreshResponse.ok) {
		return forwardRefreshCookie(refreshResponse, createSignInRedirect(request))
	}

	const refreshBody = (await refreshResponse
		.json()
		.catch(() => null)) as RefreshResponse | null
	const accessToken = refreshBody?.data?.accessToken

	if (!accessToken) {
		return forwardRefreshCookie(refreshResponse, createSignInRedirect(request))
	}

	let meResponse: Response

	try {
		meResponse = await fetch(buildBackendUrl(API_ENDPOINTS.AUTH.ME), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				cookie: cookieHeader,
			},
			cache: 'no-store',
		})
	} catch {
		return forwardRefreshCookie(refreshResponse, createSignInRedirect(request))
	}

	if (!meResponse.ok) {
		return forwardRefreshCookie(refreshResponse, createSignInRedirect(request))
	}

	const meBody = (await meResponse
		.json()
		.catch(() => null)) as MeResponse | null
	const userId = meBody?.data?.userId

	if (!userId) {
		return forwardRefreshCookie(refreshResponse, createSignInRedirect(request))
	}

	const redirectResponse = NextResponse.redirect(
		new URL(`/${userId}`, request.url),
	)

	return forwardRefreshCookie(refreshResponse, redirectResponse)
}
