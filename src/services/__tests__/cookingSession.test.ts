import { getCurrentSession } from '../cookingSession'
import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { logDevError } from '@/lib/dev-log'

jest.mock('@/lib/axios', () => ({
	api: {
		get: jest.fn(),
	},
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

const mockedGet = api.get as jest.Mock
const mockedLogDevError = logDevError as jest.Mock

describe('current cooking session service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('returns the successful optional-resource response unchanged', async () => {
		mockedGet.mockResolvedValueOnce({
			data: { success: true, statusCode: 200 },
		})

		const response = await getCurrentSession({ timeoutMs: 4500 })

		expect(mockedGet).toHaveBeenCalledWith(
			API_ENDPOINTS.COOKING_SESSIONS.CURRENT,
			{ timeout: 4500 },
		)
		expect(response).toEqual({ success: true, statusCode: 200 })
		expect(mockedLogDevError).not.toHaveBeenCalled()
	})

	it('does not disguise an HTTP 404 as an empty current session', async () => {
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
		mockedGet.mockRejectedValueOnce(error)

		const response = await getCurrentSession()

		expect(response).toEqual(error.response.data)
		expect(mockedLogDevError).toHaveBeenCalledWith('response failed:', error)
	})
})
