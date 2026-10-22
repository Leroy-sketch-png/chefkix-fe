/** @jest-environment node */

import { POST as postIngredientMatches } from '@/app/api/photo-intelligence/ingredient-recipes/route'
import { POST as postDishRetrieval } from '@/app/api/photo-intelligence/dish-retrieval/route'
import { authenticateAiProxyCaller } from '@/lib/ai-proxy-auth'

jest.mock('@/lib/ai-proxy-auth', () => ({
	authenticateAiProxyCaller: jest.fn(),
}))

describe('Epic 8 photo intelligence adapters', () => {
	const originalHgat = process.env.HGAT_RECIPE_MATCH_BACKEND_URL
	const originalClip = process.env.CROSS_MODAL_RETRIEVAL_BACKEND_URL

	afterEach(() => {
		if (originalHgat === undefined)
			delete process.env.HGAT_RECIPE_MATCH_BACKEND_URL
		else process.env.HGAT_RECIPE_MATCH_BACKEND_URL = originalHgat
		if (originalClip === undefined)
			delete process.env.CROSS_MODAL_RETRIEVAL_BACKEND_URL
		else process.env.CROSS_MODAL_RETRIEVAL_BACKEND_URL = originalClip
		jest.restoreAllMocks()
	})

	beforeEach(() => {
		jest.mocked(authenticateAiProxyCaller).mockResolvedValue({
			authenticated: true,
			userId: 'test-user',
		})
	})

	it('reports HGAT integration pending instead of returning fabricated matches', async () => {
		delete process.env.HGAT_RECIPE_MATCH_BACKEND_URL
		const response = await postIngredientMatches(
			new Request(
				'http://localhost/api/photo-intelligence/ingredient-recipes',
				{
					method: 'POST',
					body: JSON.stringify({ ingredients: ['tomato'] }),
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer user-token',
					},
				},
			),
		)

		expect(response.status).toBe(503)
		expect(await response.json()).toEqual(
			expect.objectContaining({ code: 'INTEGRATION_PENDING' }),
		)
	})

	it('normalizes the HGAT match contract and preserves ingredient context', async () => {
		process.env.HGAT_RECIPE_MATCH_BACKEND_URL = 'http://hgat.test/match'
		jest.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				results: [
					{
						recipe_id: 'recipe-1',
						title: 'Tomato Rice',
						match_score: 87,
						matched_ingredients: ['Tomato'],
						missing_ingredients: ['Rice'],
					},
				],
			}),
		} as Response)

		const response = await postIngredientMatches(
			new Request(
				'http://localhost/api/photo-intelligence/ingredient-recipes',
				{
					method: 'POST',
					body: JSON.stringify({ ingredients: ['tomato', 'rice'] }),
					headers: { Authorization: 'Bearer user-token' },
				},
			),
		)
		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(
			expect.objectContaining({
				success: true,
				data: expect.objectContaining({
					queryIngredients: ['tomato', 'rice'],
					matches: [
						expect.objectContaining({ recipeId: 'recipe-1', matchScore: 0.87 }),
					],
				}),
			}),
		)
	})

	it('reports CLIP integration pending instead of returning fabricated dish matches', async () => {
		delete process.env.CROSS_MODAL_RETRIEVAL_BACKEND_URL
		const formData = new FormData()
		formData.append(
			'image',
			new File(['dish'], 'dish.jpg', { type: 'image/jpeg' }),
		)
		const response = await postDishRetrieval(
			new Request('http://localhost/api/photo-intelligence/dish-retrieval', {
				method: 'POST',
				body: formData,
				headers: { Authorization: 'Bearer user-token' },
			}),
		)
		expect(response.status).toBe(503)
		expect(await response.json()).toEqual(
			expect.objectContaining({ code: 'INTEGRATION_PENDING' }),
		)
	})

	it('requires an authenticated caller before photo matching', async () => {
		jest.mocked(authenticateAiProxyCaller).mockResolvedValue({
			authenticated: false,
			status: 401,
			message: 'Authentication required for AI features.',
		})
		const fetchMock = jest.spyOn(global, 'fetch')
		const response = await postIngredientMatches(
			new Request(
				'http://localhost/api/photo-intelligence/ingredient-recipes',
				{
					method: 'POST',
					body: JSON.stringify({ ingredients: ['tomato'] }),
				},
			),
		)

		expect(response.status).toBe(401)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('rejects invalid ingredient lists instead of forwarding them', async () => {
		process.env.HGAT_RECIPE_MATCH_BACKEND_URL = 'http://hgat.test/match'
		const fetchMock = jest.spyOn(global, 'fetch')
		const response = await postIngredientMatches(
			new Request(
				'http://localhost/api/photo-intelligence/ingredient-recipes',
				{
					method: 'POST',
					body: JSON.stringify({ ingredients: ['   '] }),
					headers: { Authorization: 'Bearer user-token' },
				},
			),
		)

		expect(response.status).toBe(400)
		expect(fetchMock).not.toHaveBeenCalled()
	})
})
