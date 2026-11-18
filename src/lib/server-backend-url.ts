const LOCAL_BACKEND_URL = 'http://localhost:8080'

/** Resolve the server-to-server API origin without using browser-public config. */
export function resolveServerBackendUrl(
	backendUrl: string | undefined,
	nodeEnvironment: string | undefined,
): string {
	const configured = backendUrl?.trim()
	if (!configured) {
		if (nodeEnvironment === 'production') {
			throw new Error('BACKEND_URL is required for server-side API requests')
		}
		return LOCAL_BACKEND_URL
	}

	const url = new URL(configured)
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('BACKEND_URL must use HTTP or HTTPS')
	}
	if (url.username || url.password) {
		throw new Error('BACKEND_URL must not contain credentials')
	}
	return configured.replace(/\/+$/, '')
}

export function getServerBackendUrl(): string {
	return resolveServerBackendUrl(process.env.BACKEND_URL, process.env.NODE_ENV)
}
