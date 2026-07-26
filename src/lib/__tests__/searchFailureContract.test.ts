import fs from 'node:fs'
import path from 'node:path'
import { api } from '@/lib/axios'
import { unifiedSearch } from '@/services/search'

jest.mock('@/lib/axios', () => ({
	api: {
		get: jest.fn(),
	},
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

const mockedApi = api as unknown as {
	get: jest.Mock
}

const searchPageSource = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/search/page.tsx'),
	'utf8',
)

const exploreSource = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/explore/ExploreClient.tsx'),
	'utf8',
)

describe('truthful primary search failure contract', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('returns successful primary search envelopes unchanged', async () => {
		const response = {
			success: true,
			statusCode: 200,
			data: { recipes: { found: 0, hits: [] } },
		}
		mockedApi.get.mockResolvedValueOnce({ data: response })

		await expect(unifiedSearch('not-indexed')).resolves.toBe(response)
	})

	it('rejects an unavailable primary search instead of inventing empty results', async () => {
		const outage = {
			response: {
				status: 503,
				data: {
					success: false,
					statusCode: 503,
					message: 'Search is temporarily unavailable. Please try again.',
				},
			},
		}
		mockedApi.get.mockRejectedValueOnce(outage)

		await expect(unifiedSearch('chicken')).rejects.toBe(outage)
	})

	it('clears stale dedicated-search results and exposes retry on failure', () => {
		expect(searchPageSource).toContain('setError(false)')
		expect(searchPageSource).toContain(
			'setResults({ recipes: [], people: [], posts: [] })',
		)
		expect(searchPageSource).toContain("setRetryKey(k => k + 1)")
		expect(searchPageSource).not.toMatch(
			/SEARCH_VOCABULARY|levenshtein|findSuggestion|didYouMean/,
		)
	})

	it('treats initial and paginated Explore search failures as retryable', () => {
		expect(exploreSource).toContain(
			"setError(t('failedLoadRecipesDescription'))",
		)
		expect(exploreSource).toContain('setLoadMoreError(true)')
		expect(exploreSource).toContain(
			"throw new Error(searchRes.message || 'Search failed')",
		)
	})
})
