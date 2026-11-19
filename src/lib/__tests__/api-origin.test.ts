import { buildWebSocketUrl, resolveApiBaseUrl } from '@/lib/api-origin'

describe('public API origin contract', () => {
	it('keeps local development pointed at the separate local API by default', () => {
		expect(resolveApiBaseUrl(undefined, 'development')).toBe(
			'http://localhost:8080',
		)
	})

	it('defaults production browser traffic to same-origin instead of localhost', () => {
		expect(resolveApiBaseUrl(undefined, 'production')).toBe('')
	})

	it('keeps Docker service names and localhost out of production browser URLs', () => {
		expect(resolveApiBaseUrl('http://chefkix:8080', 'production')).toBe('')
		expect(resolveApiBaseUrl('https://keycloak', 'production')).toBe('')
		expect(resolveApiBaseUrl('http://localhost:8080', 'production')).toBe('')
		expect(resolveApiBaseUrl('https://127.0.0.1:8080', 'production')).toBe('')
		expect(resolveApiBaseUrl('https://api.example.invalid', 'production')).toBe('')
		expect(resolveApiBaseUrl('http://localhost:8080', 'development')).toBe(
			'http://localhost:8080',
		)
	})

	it('accepts the explicit same-origin marker and trims absolute origins', () => {
		expect(resolveApiBaseUrl('/', 'production')).toBe('')
		expect(resolveApiBaseUrl(' https://api.chefkix.com/ ', 'production')).toBe(
			'https://api.chefkix.com',
		)
	})

	it('uses page scheme and host for same-origin WebSockets', () => {
		expect(
			buildWebSocketUrl('/api/v1/ws', '', 'https://app.chefkix.com'),
		).toBe('wss://app.chefkix.com/api/v1/ws')
		expect(
			buildWebSocketUrl('/api/v1/ws/video-signaling', '/', 'http://localhost:3000'),
		).toBe('ws://localhost:3000/api/v1/ws/video-signaling')
	})

	it('keeps an explicit API host authoritative in split-origin deployments', () => {
		expect(
			buildWebSocketUrl(
				'/api/v1/ws',
				'https://api.chefkix.com',
				'https://app.chefkix.com',
			),
		).toBe('wss://api.chefkix.com/api/v1/ws')
	})

	it('rejects unsupported schemes and missing page origin for same-origin mode', () => {
		expect(() => buildWebSocketUrl('/api/v1/ws', 'ftp://api.chefkix.com')).toThrow(
			'HTTP or HTTPS',
		)
		expect(() => buildWebSocketUrl('/api/v1/ws', '')).toThrow(
			'page origin is required',
		)
	})
})
