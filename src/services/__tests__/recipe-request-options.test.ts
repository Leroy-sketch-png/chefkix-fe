import { api } from '@/lib/axios'
import { getAllRecipes } from '@/services/recipe'

jest.mock('@/lib/axios', () => ({ api: { get: jest.fn() } }))
jest.mock('@/lib/dev-log', () => ({ logDevError: jest.fn() }))

describe('getAllRecipes request options', () => {
	beforeEach(() => jest.clearAllMocks())

	it('forwards an optional abort signal to the authenticated recipe request', async () => {
		jest.mocked(api.get).mockResolvedValue({
			data: { success: true, data: [], statusCode: 200 },
		} as never)
		const controller = new AbortController()

		await getAllRecipes({ page: 0, size: 100 }, { signal: controller.signal })

		expect(api.get).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ signal: controller.signal }),
		)
	})

	it('keeps legacy callers unchanged and avoids a request for an already-aborted signal', async () => {
		jest.mocked(api.get).mockResolvedValue({
			data: { success: true, data: [], statusCode: 200 },
		} as never)

		await getAllRecipes({ page: 0, size: 20 })
		const [, config] = jest.mocked(api.get).mock.calls[0]
		expect(config).not.toHaveProperty('signal')

		const controller = new AbortController()
		controller.abort()
		await expect(
			getAllRecipes({ page: 0, size: 100 }, { signal: controller.signal }),
		).rejects.toMatchObject({ name: 'AbortError' })
		expect(api.get).toHaveBeenCalledTimes(1)
	})
})
