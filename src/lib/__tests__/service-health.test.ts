import {
	assessHealthResponse,
	getDevDashboardProbe,
	probeHttpService,
} from '../service-health'

describe('semantic service health', () => {
	const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch')

	afterEach(() => {
		jest.restoreAllMocks()
		if (originalFetch) {
			Object.defineProperty(globalThis, 'fetch', originalFetch)
		} else {
			Reflect.deleteProperty(globalThis, 'fetch')
		}
	})

	it.each([
		['monolith', 200, { status: 'UP' }],
		['ai-service', 200, { status: 'healthy' }],
		['keycloak', 200, { realm: 'nottisn' }],
		['typesense', 200, { ok: true }],
		['frontend', 200, null],
	] as const)(
		'%s accepts its healthy response contract',
		(service, status, body) => {
			expect(assessHealthResponse(service, status, body)).toMatchObject({
				healthy: true,
				statusCode: 200,
			})
		},
	)

	it.each([
		['monolith', { status: 'DOWN' }, 'Reported DOWN'],
		['ai-service', { status: 'degraded' }, 'Reported degraded'],
		['ai-service', { status: 'unhealthy' }, 'Reported unhealthy'],
		['keycloak', { realm: 'other-realm' }, 'Reported other-realm'],
		['typesense', { ok: false }, 'Reported false'],
		['ai-service', {}, 'Missing expected health identity/status'],
	] as const)(
		'rejects HTTP 200 with an unhealthy %s payload',
		(service, body, detail) => {
			expect(assessHealthResponse(service, 200, body)).toMatchObject({
				healthy: false,
				statusCode: 200,
				detail,
			})
		},
	)

	it('rejects non-success responses even when their body looks healthy', () => {
		expect(
			assessHealthResponse('ai-service', 401, { status: 'healthy' }),
		).toMatchObject({
			healthy: false,
			statusCode: 401,
			detail: 'HTTP 401',
		})
	})

	it('parses HTTP 200 AI health payloads instead of trusting status alone', async () => {
		Object.defineProperty(globalThis, 'fetch', {
			configurable: true,
			value: jest.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ status: 'degraded' }),
			} as Response),
		})

		expect(
			await probeHttpService('ai-service', 'http://localhost:8000/health'),
		).toMatchObject({
			healthy: false,
			statusCode: 200,
			detail: 'Reported degraded',
		})
	})

	it('does not invent browser probes for TCP-only services', () => {
		expect(getDevDashboardProbe(27017, 'http://localhost:8080')).toBeNull()
		expect(getDevDashboardProbe(6380, 'http://localhost:8080')).toBeNull()
		expect(getDevDashboardProbe(9094, 'http://localhost:8080')).toBeNull()
		expect(getDevDashboardProbe(8080, 'http://localhost:8080')).toEqual({
			service: 'monolith',
			url: 'http://localhost:8080/api/v1/actuator/health',
		})
	})
})
