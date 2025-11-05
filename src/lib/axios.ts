import app from '@/configs/app'
import { useAuthStore } from '@/store/authStore'
import axios, {
	AxiosError,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from 'axios'

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8888',
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: app.AXIOS_TIMEOUT,
	withCredentials: true, // Enable sending/receiving HttpOnly cookies (refreshToken)
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

// Helper: add request to queue during token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
	refreshSubscribers.push(callback)
}

// Helper: notify all queued requests with new token
const onTokenRefreshed = (token: string) => {
	refreshSubscribers.forEach(callback => callback(token))
	refreshSubscribers = []
}

// Request Interceptor: Add the auth token to every request if it exists.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const accessToken = useAuthStore.getState().accessToken

	// Skip auth header for public endpoints (refresh-token)
	const isPublicEndpoint = config.url?.includes('/auth/refresh-token')

	if (accessToken && !isPublicEndpoint) {
		config.headers.Authorization = `Bearer ${accessToken}`
	}
	return config
})

// Response Interceptor: Standardize successful and error responses.
api.interceptors.response.use(
	(response: AxiosResponse) => {
		const backendResponse = response.data
		response.data = {
			success: true,
			statusCode: backendResponse.code,
			message: backendResponse.message,
			data: backendResponse.result,
		}
		return response
	},
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & {
			_retry?: boolean
		}

		// Handle 401 Unauthorized - attempt token refresh
		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry
		) {
			// Skip refresh attempt if we're already on the refresh endpoint or logout endpoint
			if (
				originalRequest.url?.includes('/auth/refresh-token') ||
				originalRequest.url?.includes('/auth/logout')
			) {
				// Refresh failed or logout - clear auth state
				const { logout } = useAuthStore.getState()
				logout()

				if (typeof window !== 'undefined') {
					window.location.href =
						'/auth/sign-in?error=Session expired. Please sign in again.'
				}
				return Promise.reject(error)
			}

			// Mark request as retried to prevent infinite loops
			originalRequest._retry = true

			if (!isRefreshing) {
				isRefreshing = true

				try {
					// Call refresh token endpoint (public, uses HttpOnly cookie automatically)
					const refreshResponse = await api.post('/api/v1/auth/refresh-token')
					const newAccessToken = refreshResponse.data.data.accessToken

					if (newAccessToken) {
						// Update store with new access token
						const { login, user } = useAuthStore.getState()
						login(newAccessToken, user || undefined)

						// Notify all queued requests
						onTokenRefreshed(newAccessToken)

						isRefreshing = false

						// Retry original request with new token
						originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
						return api(originalRequest)
					}
				} catch (refreshError) {
					// Refresh token failed - logout user
					isRefreshing = false
					const { logout } = useAuthStore.getState()
					logout()

					if (typeof window !== 'undefined') {
						window.location.href =
							'/auth/sign-in?error=Session expired. Please sign in again.'
					}
					return Promise.reject(refreshError)
				}
			}

			// If refresh is already in progress, queue this request
			return new Promise(resolve => {
				subscribeTokenRefresh((token: string) => {
					originalRequest.headers.Authorization = `Bearer ${token}`
					resolve(api(originalRequest))
				})
			})
		}

		// Handle other errors
		if (error.response) {
			const backendError = error.response.data as any
			error.response.data = {
				success: false,
				statusCode: backendError.code,
				message: backendError.message,
				error: backendError.result,
			}
		}
		return Promise.reject(error)
	},
)
