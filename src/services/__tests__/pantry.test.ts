import { getPantryItems, addPantryItem, getMatchingRecipes } from '../pantry'
import { api } from '@/lib/axios'

jest.mock('@/lib/axios', () => ({
	api: {
		get: jest.fn(),
		post: jest.fn(),
	},
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

const mockedApi = api as unknown as {
	get: jest.Mock
	post: jest.Mock
}

describe('pantry service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('returns a failed ApiResponse instead of an empty list when pantry load fails', async () => {
		mockedApi.get.mockResolvedValueOnce({
			data: {
				success: false,
				statusCode: 503,
				message: 'Pantry unavailable',
			},
		})

		const response = await getPantryItems()

		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(503)
		expect(response.message).toBe('Pantry unavailable')
		expect(response.data).toBeUndefined()
	})

	it('normalizes Spring page pantry payloads into item arrays', async () => {
		mockedApi.get.mockResolvedValueOnce({
			data: {
				success: true,
				statusCode: 200,
				data: {
					content: [
						{
							id: 'pantry-1',
							ingredientName: 'Rice',
							category: 'grains',
						},
					],
				},
			},
		})

		const response = await getPantryItems()

		expect(response.success).toBe(true)
		expect(response.data).toEqual([
			expect.objectContaining({ id: 'pantry-1', ingredientName: 'Rice' }),
		])
	})

	it('throws for failed mutating pantry responses', async () => {
		mockedApi.post.mockResolvedValueOnce({
			data: {
				success: false,
				statusCode: 400,
				message: 'Invalid pantry item',
			},
		})

		await expect(addPantryItem({ ingredientName: '   ' })).rejects.toThrow(
			'Invalid pantry item',
		)
	})

	it('throws when matching recipes returns a failed envelope', async () => {
		mockedApi.get.mockResolvedValueOnce({
			data: {
				success: false,
				statusCode: 500,
				message: 'Recipe matching failed',
			},
		})

		await expect(getMatchingRecipes()).rejects.toThrow('Recipe matching failed')
	})
})
