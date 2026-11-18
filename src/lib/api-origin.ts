const DEVELOPMENT_API_ORIGIN = 'http://localhost:8080'

/**
 * Resolve the browser-visible API base. Keep BACKEND_URL server-only: it may
 * name an internal Docker service and must never become a browser URL.
 * An explicit `/` selects same-origin routing; an absolute URL keeps the
 * separately-hosted API deployment contract.
 */
export function resolveApiBaseUrl(
	publicApiBaseUrl: string | undefined,
	nodeEnvironment: string | undefined,
): string {
	const configured = publicApiBaseUrl?.trim()
	if (configured === '/') return ''
	if (configured) {
		if (nodeEnvironment === 'production' && !isPublicProductionOrigin(configured)) {
			return ''
		}
		return configured.replace(/\/$/, '')
	}

	return nodeEnvironment === 'production' ? '' : DEVELOPMENT_API_ORIGIN
}

function isPublicProductionOrigin(value: string): boolean {
	try {
		const url = new URL(value)
		const hostname = url.hostname.toLowerCase()
		const reservedSuffixes = [
			'.localhost',
			'.local',
			'.internal',
			'.invalid',
			'.test',
			'.example',
		]
		const isLoopback =
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname === '[::1]' ||
			/^127(?:\.\d{1,3}){3}$/.test(hostname)

		return (
			url.protocol === 'https:' &&
			!url.username &&
			!url.password &&
			hostname.includes('.') &&
			!isLoopback &&
			!reservedSuffixes.some(suffix => hostname.endsWith(suffix))
		)
	} catch {
		return false
	}
}

/** Build a browser WebSocket URL from the public API origin or page origin. */
export function buildWebSocketUrl(
	path: string,
	apiBaseUrl: string,
	pageOrigin?: string,
): string {
	const configuredBase = apiBaseUrl.trim()
	const origin = configuredBase && configuredBase !== '/' ? configuredBase : pageOrigin
	if (!origin) {
		throw new Error('A page origin is required for same-origin WebSocket URLs')
	}

	const base = new URL(origin)
	if (base.protocol !== 'http:' && base.protocol !== 'https:') {
		throw new Error('The API origin must use HTTP or HTTPS')
	}

	const socketUrl = new URL(path, base.origin)
	socketUrl.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
	return socketUrl.toString()
}
