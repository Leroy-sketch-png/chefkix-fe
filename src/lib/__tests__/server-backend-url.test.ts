import { resolveServerBackendUrl } from '@/lib/server-backend-url'

describe('server backend origin contract', () => {
	it('uses localhost for local development when no server origin is configured', () => {
		expect(resolveServerBackendUrl(undefined, 'development')).toBe(
			'http://localhost:8080',
		)
	})

	it('requires an explicit server origin in production', () => {
		expect(() => resolveServerBackendUrl(undefined, 'production')).toThrow(
			'BACKEND_URL is required',
		)
	})

	it('keeps internal Docker service names server-side and strips trailing slashes', () => {
		expect(resolveServerBackendUrl(' http://chefkix:8080/// ', 'production')).toBe(
			'http://chefkix:8080',
		)
	})

	it('rejects unsupported schemes and embedded credentials', () => {
		expect(() => resolveServerBackendUrl('ftp://chefkix:8080', 'production')).toThrow(
			'HTTP or HTTPS',
		)
		expect(() => resolveServerBackendUrl('http://user:pass@chefkix:8080', 'production')).toThrow(
			'credentials',
		)
	})
})
