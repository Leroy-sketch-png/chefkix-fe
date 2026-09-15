import { api } from '@/lib/axios'
import { logDevError } from '@/lib/dev-log'
import { getUserShoppingLists } from '@/services/shoppingList'

jest.mock('@/lib/axios', () => ({
	api: {
		get: jest.fn(),
	},
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

const mockedApi = api as unknown as { get: jest.Mock }
const mockedLogDevError = logDevError as jest.Mock

const summary = {
	id: 'list-1',
	name: 'Weeknight shop',
	source: 'Custom' as const,
	totalItems: 3,
	checkedItems: 1,
	createdAt: '2026-08-11T00:00:00Z',
}

describe('getUserShoppingLists', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('accepts an explicit empty list as a truthful fresh-account state', async () => {
		mockedApi.get.mockResolvedValueOnce({
			data: { success: true, statusCode: 200, data: [] },
		})

		await expect(getUserShoppingLists()).resolves.toEqual([])
	})

	it('normalizes Spring page content', async () => {
		mockedApi.get.mockResolvedValueOnce({
			data: {
				success: true,
				statusCode: 200,
				data: { content: [summary] },
			},
		})

		await expect(getUserShoppingLists()).resolves.toEqual([summary])
	})

	it('rejects failed API envelopes instead of fabricating an empty account', async () => {
		mockedApi.get.mockResolvedValueOnce({
			data: {
				success: false,
				statusCode: 503,
				message: 'Shopping lists unavailable',
			},
		})

		await expect(getUserShoppingLists()).rejects.toThrow(
			'Shopping lists unavailable',
		)
		expect(mockedLogDevError).toHaveBeenCalledTimes(1)
	})

	it.each([
		['missing data', undefined],
		['malformed data', { unexpected: [] }],
	])('rejects %s instead of treating it as an empty list', async (_, data) => {
		mockedApi.get.mockResolvedValueOnce({
			data: { success: true, statusCode: 200, data },
		})

		await expect(getUserShoppingLists()).rejects.toThrow(
			'Invalid shopping list response',
		)
	})

	it('preserves transport failures for the page retry state', async () => {
		mockedApi.get.mockRejectedValueOnce(new Error('Network offline'))

		await expect(getUserShoppingLists()).rejects.toThrow('Network offline')
		expect(mockedLogDevError).toHaveBeenCalledTimes(1)
	})
})
