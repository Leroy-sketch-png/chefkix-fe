import fs from 'node:fs'
import path from 'node:path'
import { api } from '@/lib/axios'
import { unifiedSearch } from '@/services/search'
import { getAllRecipes } from '@/services/recipe'

jest.mock('@/lib/axios', () => ({
	api: { get: jest.fn() },
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

const mockedGet = api.get as jest.Mock
const exploreSource = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/explore/ExploreClient.tsx'),
	'utf8',
)

describe('truthful Explore filter contract', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockedGet.mockResolvedValue({ data: { success: true, data: {} } })
	})

	it('serializes every unified recipe filter through repeated query keys', async () => {
		await unifiedSearch('chicken', 'recipes', 20, 2, {
			difficulty: ['Beginner', 'Advanced'],
			cuisine: ['Vietnamese', 'Italian'],
			dietary: ['gluten-free', 'high-protein'],
			maxTime: 30,
			minRating: 4,
			qualityTier: 'Foolproof',
		})

		expect(mockedGet).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				params: expect.objectContaining({
					q: 'chicken',
					page: 2,
					difficulty: ['Beginner', 'Advanced'],
					cuisine: ['Vietnamese', 'Italian'],
					dietary: ['gluten-free', 'high-protein'],
					maxTime: 30,
					minRating: 4,
					qualityTier: 'Foolproof',
				}),
				paramsSerializer: { indexes: null },
			}),
		)
	})

	it('uses the same filter builders for initial and paginated lifecycles', () => {
		expect(
			exploreSource.match(/buildUnifiedSearchFilters\(filters\)/g),
		).toHaveLength(2)
		expect(exploreSource.match(/buildBrowseFilterParams\(/g)).toHaveLength(3)
		expect(exploreSource).toContain('filterParams.minRating = filters.rating')
		expect(exploreSource).toContain("filterParams.qualityTier = 'FOOLPROOF'")
		expect(exploreSource).toContain('filterParams.difficulties = difficulties')
		expect(exploreSource).toContain(
			'filterParams.cuisineTypes = filters.cuisine',
		)
	})

	it('serializes multi-select browse filters as repeated query keys', async () => {
		await getAllRecipes({
			difficulties: ['Beginner', 'Advanced'],
			cuisineTypes: ['Vietnamese', 'Italian'],
			dietaryTags: ['vegetarian', 'high-protein'],
			minRating: 4,
			qualityTier: 'FOOLPROOF',
		})

		expect(mockedGet).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				params: expect.objectContaining({
					difficulties: ['Beginner', 'Advanced'],
					cuisineTypes: ['Vietnamese', 'Italian'],
					dietaryTags: ['vegetarian', 'high-protein'],
					minRating: 4,
					qualityTier: 'FOOLPROOF',
				}),
				paramsSerializer: { indexes: null },
			}),
		)
	})
})
