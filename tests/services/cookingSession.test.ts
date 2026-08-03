import { api } from '@/lib/axios'
import { logDevError } from '@/lib/dev-log'
import { getCurrentSession } from '@/services/cookingSession'

jest.mock('@/lib/axios')
jest.mock('@/lib/dev-log')

const mockedApi = api as jest.Mocked<typeof api>
const mockedLogDevError = logDevError as jest.MockedFunction<typeof logDevError>

describe('getCurrentSession', () => {
	beforeEach(() => jest.clearAllMocks())

	it('preserves a structured 404 instead of disguising it as empty success', async () => {
		const error = {
			response: {
				status: 404,
				data: {
					success: false,
					statusCode: 404,
					message: 'Current session recipe not found',
				},
			},
		}
		mockedApi.get.mockRejectedValue(error)

		await expect(getCurrentSession()).resolves.toEqual(error.response.data)
		expect(mockedLogDevError).toHaveBeenCalledWith('response failed:', error)
	})

	it('keeps unexpected server failures visible to diagnostics', async () => {
		const error = {
			response: {
				status: 500,
				data: { success: false, message: 'Session lookup failed' },
			},
		}
		mockedApi.get.mockRejectedValue(error)

		await expect(getCurrentSession()).resolves.toEqual(error.response.data)
		expect(mockedLogDevError).toHaveBeenCalledWith('response failed:', error)
	})
})
