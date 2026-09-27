/** @jest-environment node */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { authenticateAiProxyCaller } from '@/lib/ai-proxy-auth'

const routeSource = readFileSync(
	join(process.cwd(), 'src/app/api/v1/[...aiPath]/route.ts'),
	'utf8',
)
const axiosSource = readFileSync(
	join(process.cwd(), 'src/lib/axios.ts'),
	'utf8',
)
describe('AI proxy authentication and credential custody', () => {
	const originalEnvironment = { ...process.env }

	beforeEach(() => {
		jest.restoreAllMocks()
		process.env.AI_SERVICE_API_KEY = 'server-service-secret'
		process.env.AI_SERVICE_URL = 'http://ai.internal:8000'
		process.env.BACKEND_URL = 'http://backend.internal:8080'
		process.env.AI_RATE_LIMIT_SUBJECT_SECRET =
			'rate-limit-subject-secret-at-least-32-characters'
		process.env.AI_RATE_LIMIT_PSEUDONYM_SECRET =
			'stable-pseudonym-secret-at-least-32-characters'
	})

	afterAll(() => {
		process.env = originalEnvironment
	})

	it('has no public-key or cross-project dotenv credential fallback', () => {
		expect(routeSource).not.toContain('NEXT_PUBLIC_AI_SERVICE_API_KEY')
		expect(routeSource).not.toContain("from 'node:fs/promises'")
		expect(routeSource).not.toContain("../chefkix-ai-service/.env")
		expect(routeSource).not.toContain("../chefkix-monolith/.env")
		expect(routeSource).toContain('process.env.AI_SERVICE_API_KEY')
	})

	it('makes the browser client present its user bearer token', () => {
		expect(axiosSource).toContain('aiApi.interceptors.request.use')
		expect(axiosSource).toContain("config.headers.set('Authorization', `Bearer ${token}`)")
	})

	it('rejects an anonymous caller without spending an auth request', async () => {
		const requestMock = jest.fn()

		const result = await authenticateAiProxyCaller(
			null,
			'http://backend.internal:8080',
			requestMock,
		)

		expect(result).toEqual({
			authenticated: false,
			status: 401,
			message: 'Authentication required for AI features.',
		})
		expect(requestMock).not.toHaveBeenCalled()
	})

	it('rejects a forged user bearer token', async () => {
		const requestMock = jest
			.fn()
			.mockResolvedValue(new Response(null, { status: 401 }))

		const result = await authenticateAiProxyCaller(
			'Bearer forged-user-token',
			'http://backend.internal:8080',
			requestMock,
		)

		expect(result).toMatchObject({ authenticated: false, status: 401 })
		expect(requestMock).toHaveBeenCalledTimes(1)
		expect(requestMock).toHaveBeenCalledWith(
			'http://backend.internal:8080/api/v1/auth/me',
			expect.objectContaining({
				headers: { Authorization: 'Bearer forged-user-token' },
			}),
		)
	})

	it('fails closed when caller verification is unavailable', async () => {
		const requestMock = jest.fn().mockRejectedValue(new Error('offline'))

		const result = await authenticateAiProxyCaller(
			'Bearer user-token',
			'http://backend.internal:8080',
			requestMock,
		)

		expect(result).toEqual({
			authenticated: false,
			status: 503,
			message: 'AI caller authentication is temporarily unavailable.',
		})
	})

	it('accepts only a backend-validated user token', async () => {
		const requestMock = jest
			.fn()
			.mockResolvedValue(
				new Response('{"data":{"userId":"user-123"}}', { status: 200 }),
			)

		const result = await authenticateAiProxyCaller(
			'Bearer valid-user-token',
			'http://backend.internal:8080',
			requestMock,
		)

		expect(result).toEqual({ authenticated: true, userId: 'user-123' })
		expect(requestMock).toHaveBeenCalledWith(
			'http://backend.internal:8080/api/v1/auth/me',
			expect.objectContaining({
				headers: { Authorization: 'Bearer valid-user-token' },
			}),
		)
	})

	it('fails closed when auth succeeds without a stable user ID', async () => {
		const requestMock = jest
			.fn()
			.mockResolvedValue(new Response('{"data":{}}', { status: 200 }))

		await expect(
			authenticateAiProxyCaller(
				'Bearer valid-user-token',
				'http://backend.internal:8080',
				requestMock,
			),
		).resolves.toMatchObject({ authenticated: false, status: 503 })
	})

	it('keeps caller validation before service-secret forwarding and hides upstream errors', () => {
		const authIndex = routeSource.indexOf('authenticateAiProxyCaller(')
		const serviceHeaderIndex = routeSource.indexOf("'X-AI-Service-Key': apiKey")
		expect(authIndex).toBeGreaterThan(0)
		expect(serviceHeaderIndex).toBeGreaterThan(authIndex)
		expect(routeSource).not.toContain('${AI_PROXY_ERROR}: ${error.message}')
		expect(routeSource).toContain('return jsonFailure(AI_PROXY_ERROR, 503)')
		expect(routeSource).toContain('[AI_RATE_LIMIT_SUBJECT_HEADER]: rateLimitSubject')
		expect(routeSource).toContain('isAiRateLimitSubjectSecretConfigured')
		expect(routeSource).not.toContain("request.headers.get('x-chefkix-rate-limit-subject')")
	})
})
