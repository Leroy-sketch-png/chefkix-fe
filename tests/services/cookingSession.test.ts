import { api } from '@/lib/axios'
import { logDevError } from '@/lib/dev-log'
import { getCurrentSession } from '@/services/cookingSession'

jest.mock('@/lib/axios')
jest.mock('@/lib/dev-log')

const mockedApi = api as jest.Mocked<typeof api>
const mockedLogDevError = logDevError as jest.MockedFunction<typeof logDevError>

describe('getCurrentSession', () => {
	beforeEach(() => jest.clearAllMocks())

	it('normalizes an expected no-active-session response without logging an error', async () => {
		mockedApi.get.mockRejectedValue({
			response: {
				status: 404,
				data: { message: 'No active cooking session' },
			},
		})

		await expect(getCurrentSession()).resolves.toEqual({
			success: true,
			data: null,
			message: 'No active cooking session',
			statusCode: 200,
		})
		expect(mockedLogDevError).not.toHaveBeenCalled()
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
