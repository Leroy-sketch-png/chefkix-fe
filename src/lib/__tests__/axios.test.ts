import { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

jest.mock('@/configs/app', () => ({
	__esModule: true,
	default: {
		AXIOS_TIMEOUT: 1000,
	},
}))

jest.mock('@/constants', () => ({
	PATHS: {
		AUTH: {
			SIGN_IN: '/sign-in',
		},
	},
}))

jest.mock('@/store/authStore', () => ({
	useAuthStore: {
		getState: jest.fn(),
		setState: jest.fn(),
	},
}))

jest.mock('@/lib/tokenManager', () => ({
	refreshAccessToken: jest.fn(),
	isRefreshInProgress: jest.fn(),
	waitForRefresh: jest.fn(),
}))

const { api } = require('@/lib/axios') as typeof import('@/lib/axios')
const { useAuthStore } =
	require('@/store/authStore') as typeof import('@/store/authStore')
const { refreshAccessToken, isRefreshInProgress, waitForRefresh } =
	require('@/lib/tokenManager') as typeof import('@/lib/tokenManager')

const mockAuthStore = useAuthStore as unknown as {
	getState: jest.Mock
	setState: jest.Mock
}
const mockRefreshAccessToken = refreshAccessToken as jest.Mock
const mockIsRefreshInProgress = isRefreshInProgress as jest.Mock
const mockWaitForRefresh = waitForRefresh as jest.Mock

const unauthorizedResponse = (config: InternalAxiosRequestConfig) => ({
	data: { message: 'Unauthorized' },
	status: 401,
	statusText: 'Unauthorized',
	headers: {},
	config,
})

const successResponse = (
	config: InternalAxiosRequestConfig,
	data: Record<string, unknown>,
) => ({
	data,
	status: 200,
	statusText: 'OK',
	headers: {},
	config,
})

const throwUnauthorized = (config: InternalAxiosRequestConfig) => {
	throw new AxiosError(
		'Unauthorized',
		'ERR_BAD_REQUEST',
		config,
		undefined,
		unauthorizedResponse(config),
	)
}

const readAuthHeader = (config: InternalAxiosRequestConfig) => {
	const directHeader = config.headers?.Authorization
	if (typeof directHeader === 'string') return directHeader

	return config.headers?.get?.('Authorization') ?? null
}

const parseJsonPayload = (data: unknown) =>
	typeof data === 'string' ? JSON.parse(data) : data

describe('api refresh retry behavior', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		const authState = {
			accessToken: 'old-token',
			logout: jest.fn(),
		}

		mockAuthStore.getState.mockImplementation(() => authState)
		mockAuthStore.setState.mockImplementation(update => {
			Object.assign(authState, update)
		})

		mockIsRefreshInProgress.mockReturnValue(false)
		mockWaitForRefresh.mockResolvedValue(null)
		mockRefreshAccessToken.mockImplementation(async onTokenRefreshed => {
			onTokenRefreshed('new-token')
			return {
				success: true,
				token: 'new-token',
				error: null,
			}
		})
	})

	it('preserves JSON request bodies when retrying after a refresh', async () => {
		const seenConfigs: InternalAxiosRequestConfig[] = []
		const payload = {
			title: 'Midnight noodles',
			visibility: 'PUBLIC',
		}

		const response = await api.post('/recipes', payload, {
			adapter: async config => {
				seenConfigs.push(config as InternalAxiosRequestConfig)

				if (seenConfigs.length === 1) {
					throwUnauthorized(config as InternalAxiosRequestConfig)
				}

				return successResponse(config as InternalAxiosRequestConfig, {
					payload: config.data,
					authHeader: readAuthHeader(config as InternalAxiosRequestConfig),
				})
			},
		})

		expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1)
		expect(seenConfigs).toHaveLength(2)
		expect(parseJsonPayload(seenConfigs[1].data)).toEqual(payload)
		expect(response.data.data.authHeader).toBe('Bearer new-token')
		expect(parseJsonPayload(response.data.data.payload)).toEqual(payload)
	})

	it('preserves multipart FormData when retrying after a refresh', async () => {
		const seenConfigs: InternalAxiosRequestConfig[] = []
		const formData = new FormData()
		formData.append('content', 'Burnt but proud')
		formData.append(
			'photo',
			new Blob(['plate'], { type: 'text/plain' }),
			'plate.txt',
		)

		await api.post('/posts', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			adapter: async config => {
				seenConfigs.push(config as InternalAxiosRequestConfig)

				if (seenConfigs.length === 1) {
					throwUnauthorized(config as InternalAxiosRequestConfig)
				}

				return successResponse(config as InternalAxiosRequestConfig, {
					ok: true,
				})
			},
		})

		expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1)
		expect(seenConfigs).toHaveLength(2)
		expect(seenConfigs[0].data).toBe(formData)
		expect(seenConfigs[1].data).toBe(formData)
		expect(readAuthHeader(seenConfigs[1])).toBe('Bearer new-token')
	})
})
