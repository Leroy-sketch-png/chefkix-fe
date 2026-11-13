import axios from 'axios'
import { aiApi } from '@/lib/axios'
import { getAllRecipes } from '@/services/recipe'
import { findRecipesFromIngredients } from '@/services/photo-intelligence'
import type { Recipe } from '@/lib/types/recipe'

jest.mock('@/lib/axios', () => ({ aiApi: { post: jest.fn() } }))
jest.mock('@/services/recipe', () => ({ getAllRecipes: jest.fn() }))

const recipe = (id: string, title: string, names: unknown) =>
	({
		id,
		title,
		coverImageUrl: [],
		totalTimeMinutes: 12,
		difficulty: 'Easy',
		fullIngredientList: names,
	}) as unknown as Recipe

const integrationPending = () =>
	Object.assign(new axios.AxiosError('pending integration'), {
		response: {
			status: 503,
			data: { code: 'INTEGRATION_PENDING' },
			statusText: 'Service Unavailable',
			headers: {},
			config: {},
		},
	})

describe('findRecipesFromIngredients stored-recipe fallback', () => {
	beforeEach(() => jest.clearAllMocks())

	it('uses exact normalized names, deterministic ranking, and withholds unusable metadata', async () => {
		jest.mocked(aiApi.post).mockRejectedValue(integrationPending())
		jest.mocked(getAllRecipes).mockResolvedValue({
			success: true,
			data: [
				recipe('z', 'Zucchini bowl', [
					{ name: 'Tofu' },
					{ name: ' KALE ' },
					{ name: 'Garlic' },
				]),
				recipe('b', 'Bean and kale', [{ name: 'Kale' }, { name: 'Bean' }]),
				recipe('a', 'Apple and tofu', [{ name: 'tofu' }, { name: 'Apple' }]),
				recipe('alias', 'Scallion bowl', [{ name: 'Scallion' }]),
				recipe('bad-list', 'Missing details', undefined),
				recipe('bad-entry', 'Invalid detail', [{ name: 17 }]),
				recipe('partial-entry', 'Partial details', [
					{ name: 'Tofu' },
					{ name: null },
				]),
				null,
			] as Recipe[],
			statusCode: 200,
		})

		const result = await findRecipesFromIngredients([' Tofu ', 'tofu', 'Kale'])

		expect(aiApi.post).toHaveBeenCalledWith(
			'/api/photo-intelligence/ingredient-recipes',
			{ ingredients: ['Tofu', 'Kale'] },
			{ signal: undefined },
		)
		expect(getAllRecipes).toHaveBeenCalledWith({ page: 0, size: 100 })
		expect(result.source).toBe('stored-overlap')
		expect(result.queryIngredients).toEqual(['Tofu', 'Kale'])
		expect(result.withheldRecipeCount).toBe(4)
		expect(result.matches.map(match => match.recipeId)).toEqual(['z', 'a', 'b'])
		expect(result.matches[0]).toMatchObject({
			matchMethod: 'exact-ingredient-overlap',
			inputIngredientCount: 2,
			matchedIngredients: ['Tofu', 'KALE'],
			missingIngredients: ['Garlic'],
		})
		expect(result.matches.every(match => match.matchScore === undefined)).toBe(
			true,
		)
		expect(result.matches.some(match => match.recipeId === 'alias')).toBe(false)
	})

	it('does not activate fallback for other upstream errors', async () => {
		const unauthorized = Object.assign(new axios.AxiosError('unauthorized'), {
			response: {
				status: 401,
				data: { code: 'UNAUTHORIZED' },
				statusText: 'Unauthorized',
				headers: {},
				config: {},
			},
		})
		jest.mocked(aiApi.post).mockRejectedValue(unauthorized)

		await expect(findRecipesFromIngredients(['Tofu'])).rejects.toThrow()
		expect(getAllRecipes).not.toHaveBeenCalled()
	})

	it('does not treat other 503 responses as a missing integration', async () => {
		const upstreamUnavailable = Object.assign(
			new axios.AxiosError('upstream unavailable'),
			{
				response: {
					status: 503,
					data: { code: 'UPSTREAM_UNAVAILABLE' },
					statusText: 'Service Unavailable',
					headers: {},
					config: {},
				},
			},
		)
		jest.mocked(aiApi.post).mockRejectedValue(upstreamUnavailable)

		await expect(findRecipesFromIngredients(['Tofu'])).rejects.toThrow()
		expect(getAllRecipes).not.toHaveBeenCalled()
	})

	it('reports a clear error if the existing recipe API cannot supply a bounded list', async () => {
		jest.mocked(aiApi.post).mockRejectedValue(integrationPending())
		jest.mocked(getAllRecipes).mockResolvedValue({
			success: false,
			message: 'Unavailable',
			statusCode: 503,
		})

		await expect(findRecipesFromIngredients(['Tofu'])).rejects.toThrow(
			'Stored recipes could not be loaded for ingredient matching.',
		)
	})
})
