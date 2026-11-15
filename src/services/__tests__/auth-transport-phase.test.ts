import axios from 'axios'
import { api } from '@/lib/axios'
import { logDevError } from '@/lib/dev-log'
import {
	getMyProfileWithAccessToken,
	getProfileByUserId,
} from '@/services/profile'
import { signIn, signUp } from '@/services/auth'

jest.mock('@/lib/axios', () => ({ api: { get: jest.fn(), post: jest.fn() } }))
jest.mock('axios', () => ({
	__esModule: true,
	default: { get: jest.fn() },
}))
jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
	logDevWarn: jest.fn(),
}))

const mockPost = api.post as jest.Mock
const mockApiGet = api.get as jest.Mock
const mockAxiosGet = axios.get as jest.Mock
const mockLogDevError = logDevError as jest.Mock

describe('authentication transport failure phases', () => {
	beforeEach(() => jest.clearAllMocks())

	it('represents a sign-in transport failure without fabricating an HTTP status', async () => {
		mockPost.mockRejectedValue(
			Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }),
		)

		const result = await signIn({
			emailOrUsername: 'testuser',
			password: 'test123',
		})

		expect(result).toMatchObject({ success: false, statusCode: 0 })
		expect(result.message).toContain('Unable to connect')
		expect(mockLogDevError).toHaveBeenCalledWith(
			'sign-in request failed: no HTTP response',
		)
		expect(mockLogDevError.mock.calls.flat().join(' ')).not.toContain('test123')
	})

	it('preserves an actual sign-in HTTP status without logging response details', async () => {
		mockPost.mockRejectedValue({
			response: {
				status: 401,
				data: {
					success: false,
					statusCode: 401,
					message: 'Invalid credentials',
				},
			},
		})

		const result = await signIn({
			emailOrUsername: 'testuser',
			password: 'test123',
		})

		expect(result).toMatchObject({ success: false, statusCode: 401 })
		expect(mockLogDevError).toHaveBeenCalledWith(
			'sign-in request failed: HTTP 401',
		)
		expect(mockLogDevError.mock.calls.flat().join(' ')).not.toContain(
			'Invalid credentials',
		)
	})

	it('does not log signup request details that can include credentials', async () => {
		mockPost.mockRejectedValue(
			Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }),
		)

		await signUp({
			username: 'testuser',
			email: 'test@example.invalid',
			password: 'test-password-value',
		} as never)

		expect(mockLogDevError).toHaveBeenCalledWith(
			'sign-up request failed: no HTTP response',
		)
		expect(mockLogDevError.mock.calls.flat().join(' ')).not.toContain(
			'test-password-value',
		)
		expect(mockLogDevError.mock.calls.flat().join(' ')).not.toContain(
			'test@example.invalid',
		)
	})

	it('represents profile transport failure as no response and logs no token', async () => {
		mockAxiosGet.mockRejectedValue(
			Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }),
		)

		const result = await getMyProfileWithAccessToken('test-access-token')

		expect(result).toMatchObject({ success: false, statusCode: 0 })
		expect(result.message).toContain('Unable to connect')
		expect(mockLogDevError).toHaveBeenCalledWith(
			'profile validation request failed: no HTTP response',
		)
		expect(mockLogDevError.mock.calls.flat().join(' ')).not.toContain(
			'test-access-token',
		)
	})

	it('does not turn an unsuccessful wrapped profile response with data into success', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			data: {
				success: false,
				statusCode: 200,
				message: 'Profile validation failed',
				data: { userId: 'unexpected-user' },
			},
		})

		const result = await getMyProfileWithAccessToken('test-access-token')

		expect(result).toMatchObject({
			success: false,
			statusCode: 200,
			message: 'Profile validation failed',
		})
		expect(result.data).toBeUndefined()
	})

	it('does not accept profile lookup data when the response marks itself unsuccessful', async () => {
		mockApiGet.mockResolvedValue({
			status: 200,
			data: {
				success: false,
				statusCode: 404,
				message: 'Profile validation failed',
				data: { userId: 'unexpected-user' },
			},
		})

		const result = await getProfileByUserId('user-id')

		expect(result).toMatchObject({
			success: false,
			statusCode: 404,
			message: 'Profile validation failed',
		})
		expect(result.data).toBeUndefined()
	})
})
