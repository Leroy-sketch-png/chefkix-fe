import app from '@/configs/app'
import { useAuthStore } from '@/store/authStore'
import { PATHS, AUTH_MESSAGES } from '@/constants'
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

// Response Interceptor: Standardize successful and error responses.
api.interceptors.response.use(
	(response: AxiosResponse) => {
		const backendResponse = response.data

		// Intelligently find the main data payload
		// Handles structures like { result: data }, { data: data }, or just data
		const data =
			backendResponse.result !== undefined
				? backendResponse.result
				: backendResponse.data !== undefined
					? backendResponse.data
					: backendResponse

		// Standardize the response format for the rest of the app
		response.data = {
			success:
				backendResponse.success !== undefined ? backendResponse.success : true,
			statusCode:
				backendResponse.code !== undefined
					? backendResponse.code
					: backendResponse.statusCode,
			message: backendResponse.message || 'Request was successful.',
			data: data,
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
			// Skip refresh for ALL auth endpoints - 401 here means bad credentials, not expired token
			if (originalRequest.url?.includes('/auth/')) {
				// Auth endpoint 401 = wrong credentials, NOT expired token
				// Just let the error propagate normally - don't logout, don't redirect
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
						window.location.href = `${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(AUTH_MESSAGES.SESSION_EXPIRED)}`
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

			// Handle empty response body (common when Spring Security intercepts 401)
			const hasBody =
				backendError &&
				(backendError.message || backendError.code || backendError.statusCode)

			if (!hasBody) {
				// Map HTTP status codes to user-friendly messages when body is empty
				const statusMessages: Record<number, string> = {
					400: 'Invalid request. Please check your input.',
					401: 'Invalid credentials. Please check your email/username and password.',
					403: 'Access denied. You do not have permission for this action.',
					404: 'Resource not found.',
					429: 'Too many requests. Please try again later.',
					500: 'Server error. Please try again later.',
					502: 'Service temporarily unavailable. Please try again.',
					503: 'Service temporarily unavailable. Please try again.',
				}
				const statusCode = error.response.status
				error.response.data = {
					success: false,
					statusCode: statusCode,
					message:
						statusMessages[statusCode] ||
						`Request failed with status ${statusCode}`,
					error: null,
				}
			} else {
				error.response.data = {
					success: false,
					statusCode:
						backendError.code ||
						backendError.statusCode ||
						error.response.status,
					message: backendError.message || 'An error occurred.',
					error: backendError.result,
				}
			}
		}
		return Promise.reject(error)
	},
)
