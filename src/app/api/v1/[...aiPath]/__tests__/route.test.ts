/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { authenticateAiProxyCaller } from '@/lib/ai-proxy-auth'

jest.mock('@/lib/ai-proxy-auth', () => ({
	authenticateAiProxyCaller: jest.fn(),
}))
jest.mock('@/lib/ai-rate-limit-subject', () => ({
	AI_RATE_LIMIT_SUBJECT_HEADER: 'X-ChefKix-Rate-Limit-Subject',
	createAiRateLimitSubject: jest.fn(() => 'subject-123'),
	isAiRateLimitSubjectSecretConfigured: jest.fn(() => true),
}))

const context = (aiPath: string[]) => ({ params: Promise.resolve({ aiPath }) })
const request = (
	path: string,
	method = 'GET',
	body?: string,
	extraHeaders: Record<string, string> = {},
) =>
	new NextRequest(`http://localhost/api/v1/${path}`, {
		method,
		headers: {
			Authorization: 'Bearer user-token',
			'Content-Type': 'application/json',
			...extraHeaders,
		},
		body,
	})

describe('compound AI proxy routes', () => {
	const originalEnvironment = { ...process.env }

	beforeEach(() => {
		jest.clearAllMocks()
		delete process.env.IRON_CHEF_RESEARCH_ROUTE_ENABLED
		delete process.env.IRON_CHEF_RESEARCH_API_KEY
		process.env.AI_SERVICE_API_KEY = 'server-secret'
		process.env.AI_SERVICE_URL = 'http://ai.internal:8000'
		process.env.BACKEND_URL = 'http://backend.internal:8080'
		jest.mocked(authenticateAiProxyCaller).mockResolvedValue({
			authenticated: true,
			userId: 'user-123',
		})
	})

	afterEach(() => jest.restoreAllMocks())
	afterAll(() => {
		process.env = originalEnvironment
	})

	it('rejects other GET paths before authentication', async () => {
		const response = await GET(
			request('copilot/query'),
			context(['copilot', 'query']),
		)
		expect(response.status).toBe(404)
		expect(authenticateAiProxyCaller).not.toHaveBeenCalled()
	})

	it('rejects a profile path that escapes its single ingredient segment', async () => {
		const response = await GET(
			request('compound/profile/butter'),
			context(['compound', 'profile', '../admin']),
		)
		expect(response.status).toBe(404)
		expect(authenticateAiProxyCaller).not.toHaveBeenCalled()
	})

	it('requires caller authentication before proxying compound profiles', async () => {
		jest.mocked(authenticateAiProxyCaller).mockResolvedValueOnce({
			authenticated: false,
			status: 401,
			message: 'Authentication required for AI features.',
		})
		const upstream = jest.spyOn(global, 'fetch')
		const response = await GET(
			request('compound/profile/butter'),
			context(['compound', 'profile', 'butter']),
		)
		expect(response.status).toBe(401)
		expect(upstream).not.toHaveBeenCalled()
	})

	it('proxies authenticated compound profiles without leaking the service key', async () => {
		const upstream = jest.spyOn(global, 'fetch').mockResolvedValue(
			new Response('{"is_grounded":true,"compounds":[]}', {
				status: 200,
				headers: { 'content-type': 'application/json' },
			}),
		)
		const response = await GET(
			request('compound/profile/coconut%20oil'),
			context(['compound', 'profile', 'coconut oil']),
		)
		expect(response.status).toBe(200)
		expect(upstream).toHaveBeenCalledWith(
			'http://ai.internal:8000/api/v1/compound/profile/coconut%20oil',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'X-AI-Service-Key': 'server-secret',
					'X-ChefKix-Rate-Limit-Subject': 'subject-123',
				}),
			}),
		)
		expect(response.headers.get('X-AI-Service-Key')).toBeNull()
	})

	it('proxies authenticated pair analysis with its request body', async () => {
		const upstream = jest
			.spyOn(global, 'fetch')
			.mockResolvedValue(
				new Response('{"is_compound_grounded":false}', { status: 200 }),
			)
		const body = JSON.stringify({
			original: 'butter',
			substitute: 'coconut oil',
		})
		const response = await POST(
			request('compound/analyze-pair', 'POST', body),
			context(['compound', 'analyze-pair']),
		)
		expect(response.status).toBe(200)
		expect(upstream).toHaveBeenCalledWith(
			'http://ai.internal:8000/api/v1/compound/analyze-pair',
			expect.objectContaining({ method: 'POST', body }),
		)
	})

	it('keeps the research substitution route disabled without server opt-in', async () => {
		process.env.IRON_CHEF_RESEARCH_API_KEY = 'research-secret'
		const upstream = jest.spyOn(global, 'fetch')
		const response = await POST(
			request(
				'research/suggest_substitutions',
				'POST',
				JSON.stringify({ ingredient: 'butter' }),
			),
			context(['research', 'suggest_substitutions']),
		)

		expect(response.status).toBe(503)
		expect(upstream).not.toHaveBeenCalled()
	})

	it('requires the purpose key before proxying an opted-in research request', async () => {
		process.env.IRON_CHEF_RESEARCH_ROUTE_ENABLED = 'true'
		const upstream = jest.spyOn(global, 'fetch')
		const response = await POST(
			request(
				'research/suggest_substitutions',
				'POST',
				JSON.stringify({ ingredient: 'butter' }),
			),
			context(['research', 'suggest_substitutions']),
		)

		expect(response.status).toBe(503)
		expect(upstream).not.toHaveBeenCalled()
	})

	it('requires an authenticated caller for the research substitution route', async () => {
		process.env.IRON_CHEF_RESEARCH_ROUTE_ENABLED = 'true'
		process.env.IRON_CHEF_RESEARCH_API_KEY =
			'research-secret-that-is-more-than-thirty-two-characters'
		jest.mocked(authenticateAiProxyCaller).mockResolvedValueOnce({
			authenticated: false,
			status: 401,
			message: 'Authentication required for AI features.',
		})
		const upstream = jest.spyOn(global, 'fetch')
		const response = await POST(
			request(
				'research/suggest_substitutions',
				'POST',
				JSON.stringify({ ingredient: 'butter' }),
			),
			context(['research', 'suggest_substitutions']),
		)

		expect(response.status).toBe(401)
		expect(upstream).not.toHaveBeenCalled()
	})

	it('forwards only the source ingredient with a server-held research credential', async () => {
		process.env.IRON_CHEF_RESEARCH_ROUTE_ENABLED = 'true'
		process.env.IRON_CHEF_RESEARCH_API_KEY =
			'research-secret-that-is-more-than-thirty-two-characters'
		const upstream = jest.spyOn(global, 'fetch').mockResolvedValue(
			new Response('{"contractVersion":"graph-preflight-v2"}', {
				status: 200,
				headers: { 'content-type': 'application/json' },
			}),
		)
		const response = await POST(
			request(
				'research/suggest_substitutions',
				'POST',
				JSON.stringify({ ingredient: 'butter' }),
				{ 'X-ChefKix-Allergen-Flags': 'peanut' },
			),
			context(['research', 'suggest_substitutions']),
		)

		expect(response.status).toBe(200)
		expect(upstream).toHaveBeenCalledWith(
			'http://ai.internal:8000/api/v1/suggest_substitutions',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ ingredient: 'butter', reason: 'unavailable' }),
				headers: expect.objectContaining({
					'X-AI-Service-Key': 'server-secret',
					'X-Iron-Chef-Research-Key':
						'research-secret-that-is-more-than-thirty-two-characters',
					'X-ChefKix-Rate-Limit-Subject': 'subject-123',
				}),
			}),
		)
		expect(upstream.mock.calls[0][1]?.headers).not.toHaveProperty(
			'X-ChefKix-Allergen-Flags',
		)
		expect(response.headers.get('X-Iron-Chef-Research-Key')).toBeNull()
		expect(await response.text()).not.toContain(
			'research-secret-that-is-more-than-thirty-two-characters',
		)
	})

	it('rejects research payloads that contain recipe, session, or profile context', async () => {
		process.env.IRON_CHEF_RESEARCH_ROUTE_ENABLED = 'true'
		process.env.IRON_CHEF_RESEARCH_API_KEY =
			'research-secret-that-is-more-than-thirty-two-characters'
		const upstream = jest.spyOn(global, 'fetch')
		const response = await POST(
			request(
				'research/suggest_substitutions',
				'POST',
				JSON.stringify({
					ingredient: 'butter',
					recipeContext: 'private recipe',
					dietaryTags: ['vegan'],
					sessionId: 'session-1',
				}),
			),
			context(['research', 'suggest_substitutions']),
		)

		expect(response.status).toBe(400)
		expect(upstream).not.toHaveBeenCalled()
	})

	it('rejects an overlong research ingredient before calling the AI service', async () => {
		process.env.IRON_CHEF_RESEARCH_ROUTE_ENABLED = 'true'
		process.env.IRON_CHEF_RESEARCH_API_KEY =
			'research-secret-that-is-more-than-thirty-two-characters'
		const upstream = jest.spyOn(global, 'fetch')
		const response = await POST(
			request(
				'research/suggest_substitutions',
				'POST',
				JSON.stringify({ ingredient: 'x'.repeat(201) }),
			),
			context(['research', 'suggest_substitutions']),
		)

		expect(response.status).toBe(400)
		expect(upstream).not.toHaveBeenCalled()
	})
})
