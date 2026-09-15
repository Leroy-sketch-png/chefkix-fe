export type AiProxyCallerAuth =
	| { authenticated: true; userId: string }
	| { authenticated: false; status: 401 | 503; message: string }

type FetchCaller = (
	input: string | URL | Request,
	init?: RequestInit,
) => Promise<Response>

const AUTH_REQUIRED: AiProxyCallerAuth = {
	authenticated: false,
	status: 401,
	message: 'Authentication required for AI features.',
}

const AUTH_UNAVAILABLE: AiProxyCallerAuth = {
	authenticated: false,
	status: 503,
	message: 'AI caller authentication is temporarily unavailable.',
}

export async function authenticateAiProxyCaller(
	authorization: string | null,
	backendUrl: string,
	request: FetchCaller = fetch,
): Promise<AiProxyCallerAuth> {
	const normalized = authorization?.trim()
	if (!normalized || !/^Bearer\s+\S+$/i.test(normalized)) {
		return AUTH_REQUIRED
	}

	try {
		const response = await request(`${backendUrl}/api/v1/auth/me`, {
			headers: { Authorization: normalized },
			cache: 'no-store',
		})
		if (response.status === 401 || response.status === 403) {
			return AUTH_REQUIRED
		}
		if (!response.ok) {
			return AUTH_UNAVAILABLE
		}

		const payload: unknown = await response.json()
		const userId =
			typeof payload === 'object' &&
			payload !== null &&
			'data' in payload &&
			typeof payload.data === 'object' &&
			payload.data !== null &&
			'userId' in payload.data &&
			typeof payload.data.userId === 'string'
				? payload.data.userId.trim()
				: ''

		return userId ? { authenticated: true, userId } : AUTH_UNAVAILABLE
	} catch {
		return AUTH_UNAVAILABLE
	}
}
