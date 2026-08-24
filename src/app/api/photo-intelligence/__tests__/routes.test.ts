/** @jest-environment node */

import { POST as postIngredientMatches } from '@/app/api/photo-intelligence/ingredient-recipes/route'
import { POST as postDishRetrieval } from '@/app/api/photo-intelligence/dish-retrieval/route'

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

	it('reports HGAT integration pending instead of returning fabricated matches', async () => {
		delete process.env.HGAT_RECIPE_MATCH_BACKEND_URL
		const response = await postIngredientMatches(
			new Request(
				'http://localhost/api/photo-intelligence/ingredient-recipes',
				{
					method: 'POST',
					body: JSON.stringify({ ingredients: ['tomato'] }),
					headers: { 'Content-Type': 'application/json' },
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
		const response = await postDishRetrieval({
			formData: async () => formData,
		} as Request)
		expect(response.status).toBe(503)
		expect(await response.json()).toEqual(
			expect.objectContaining({ code: 'INTEGRATION_PENDING' }),
		)
	})
})
