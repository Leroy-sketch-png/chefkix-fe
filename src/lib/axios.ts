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

// Request Interceptor: Attach JWT token to all requests
api.interceptors.request.use(
	config => {
		// Get token from Zustand store (persisted to localStorage)
		const state = useAuthStore.getState()
		const accessToken = state.accessToken

		// Debug: log token status for troubleshooting
		if (process.env.NODE_ENV === 'development') {
			const url = config.url || ''
			const hasToken = !!accessToken
			// Only log for non-auth endpoints to reduce noise
			if (!url.includes('/auth/')) {
				console.debug(
					`[axios] ${config.method?.toUpperCase()} ${url} | token: ${hasToken ? 'yes' : 'NO'}`,
				)
			}
		}

		// Attach token if available - use .set() for proper AxiosHeaders API
		if (accessToken) {
			config.headers.set('Authorization', `Bearer ${accessToken}`)
		}

		return config
	},
	error => {
		return Promise.reject(error)
	},
)

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
				console.debug(
					`[axios] 401 on auth endpoint (${originalRequest.url}), NOT refreshing`,
				)
				// Auth endpoint 401 = wrong credentials, NOT expired token
				// Just let the error propagate normally - don't logout, don't redirect
				return Promise.reject(error)
			}

			console.warn(
				`[axios] ⚠️ 401 on ${originalRequest.url}, attempting reactive token refresh`,
			)

			// Mark request as retried to prevent infinite loops
			originalRequest._retry = true

			if (!isRefreshing) {
				isRefreshing = true

				try {
					console.log('[axios] 🔄 Calling refresh-token endpoint...')

					// DEBUG: Check if cookie exists before making request
					if (typeof document !== 'undefined') {
						const cookies = document.cookie
						const hasRefreshToken = cookies.includes('refresh_token=')
						console.log(
							`[axios] 🍪 Cookie check: hasRefreshToken=${hasRefreshToken}`,
						)
						if (!hasRefreshToken) {
							console.error(
								'[axios] ❌ CRITICAL: refresh_token cookie is MISSING from browser!',
							)
							console.log('[axios] All cookies:', cookies)
						}
					}

					// Call refresh token endpoint (public, uses HttpOnly cookie automatically)
					const refreshResponse = await api.post('/api/v1/auth/refresh-token')
					const newAccessToken = refreshResponse.data.data.accessToken

					if (newAccessToken) {
						console.log('[axios] ✅ Reactive refresh successful')
						// Update the token in store - request interceptor will pick it up
						// No need to set api.defaults.headers as the interceptor handles it
						useAuthStore.setState({ accessToken: newAccessToken })

						// Notify all queued requests
						onTokenRefreshed(newAccessToken)

						isRefreshing = false

						// Retry original request with new token
						originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
						return api(originalRequest)
					} else {
						console.error('[axios] ❌ No access token in refresh response')
					}
				} catch (refreshError: unknown) {
					// IMPROVED: Don't logout immediately on refresh failure
					// Could be a transient network issue. Let the user continue with cached data
					// and try again on the next request.
					isRefreshing = false
					refreshSubscribers = [] // Clear queue

					// Check if it's a real session expiry (401/403 from refresh endpoint)
					// vs a network/transient error
					const isHardFailure =
						refreshError instanceof Error &&
						'response' in refreshError &&
						typeof (refreshError as { response?: { status?: number } }).response
							?.status === 'number' &&
						[401, 403].includes(
							(refreshError as { response: { status: number } }).response
								.status,
						)

					if (isHardFailure) {
						// Real session expiry - logout user
						console.error(
							'[axios] ❌ HARD FAILURE: Refresh returned 401/403, logging out',
							refreshError,
						)
						const { logout } = useAuthStore.getState()
						logout()

						if (typeof window !== 'undefined') {
							window.location.href = `${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(AUTH_MESSAGES.SESSION_EXPIRED)}`
						}
						return Promise.reject(refreshError)
					} else {
						// Transient error (network, timeout) - don't logout
						// Just let this request fail, user can retry manually
						console.warn(
							'[axios] ⚠️ TRANSIENT FAILURE: Refresh failed (network/timeout), not logging out',
							refreshError,
						)
						return Promise.reject(error) // Return original error
					}
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
