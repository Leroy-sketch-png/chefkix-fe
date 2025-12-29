/**
 * Axios Instance with Production-Grade Token Management
 *
 * ARCHITECTURE:
 * 1. Request interceptor: Attaches access token from store
 * 2. Response interceptor: Handles 401s with centralized refresh queue
 *
 * CRITICAL DESIGN DECISIONS:
 * - Uses TokenManager for ALL refresh operations (no duplicate logic)
 * - Queue pattern: Multiple 401s result in ONE refresh call
 * - Network errors ≠ logout (only explicit 401 from refresh endpoint = logout)
 * - No circular dependencies (TokenManager doesn't import this file)
 */

import app from '@/configs/app'
import { useAuthStore } from '@/store/authStore'
import { PATHS, AUTH_MESSAGES } from '@/constants'
import axios, {
	AxiosError,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from 'axios'
import {
	refreshAccessToken,
	isRefreshInProgress,
	waitForRefresh,
} from '@/lib/tokenManager'

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8888',
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: app.AXIOS_TIMEOUT,
	withCredentials: true, // CRITICAL: Send HttpOnly cookies (refresh_token)
})

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

api.interceptors.request.use(
	config => {
		const state = useAuthStore.getState()
		const accessToken = state.accessToken

		if (accessToken) {
			config.headers.set('Authorization', `Bearer ${accessToken}`)
		}

		// Debug logging in development
		if (process.env.NODE_ENV === 'development') {
			const url = config.url || ''
			// Only log non-auth endpoints to reduce noise
			if (!url.includes('/auth/')) {
				console.debug(
					`[axios] ${config.method?.toUpperCase()} ${url} | token: ${accessToken ? 'yes' : 'NO'}`,
				)
			}
		}

		return config
	},
	error => Promise.reject(error),
)

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

api.interceptors.response.use(
	// SUCCESS: Normalize response format
	(response: AxiosResponse) => {
		const backendResponse = response.data

		// Find the main data payload (handles various backend formats)
		const data =
			backendResponse.result !== undefined
				? backendResponse.result
				: backendResponse.data !== undefined
					? backendResponse.data
					: backendResponse

		response.data = {
			success: backendResponse.success ?? true,
			statusCode:
				backendResponse.code ?? backendResponse.statusCode ?? response.status,
			message: backendResponse.message || 'Request successful.',
			data: data,
		}

		return response
	},

	// ERROR: Handle 401s with centralized refresh
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & {
			_retry?: boolean
		}

		// ----------------------------------------------------------------
		// HANDLE 401 UNAUTHORIZED
		// ----------------------------------------------------------------
		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry
		) {
			// Skip refresh for auth endpoints — 401 here means bad credentials, not expired token
			if (originalRequest.url?.includes('/auth/')) {
				console.debug(
					`[axios] 401 on auth endpoint (${originalRequest.url}), not refreshing`,
				)
				return Promise.reject(error)
			}

			console.warn(
				`[axios] ⚠️ 401 on ${originalRequest.url}, initiating token refresh`,
			)
			originalRequest._retry = true

			// If a refresh is already in progress, wait for it
			if (isRefreshInProgress()) {
				console.debug('[axios] Refresh already in progress, waiting...')
				const newToken = await waitForRefresh()
				if (newToken) {
					originalRequest.headers.Authorization = `Bearer ${newToken}`
					return api(originalRequest)
				}
				// Refresh failed while we were waiting — error will be handled below
			}

			// Initiate the refresh using TokenManager
			const result = await refreshAccessToken(
				// onTokenRefreshed: Update store with new token
				(newToken: string) => {
					useAuthStore.setState({ accessToken: newToken })
				},
				// onSessionExpired: Clear auth state and redirect
				() => {
					const { logout } = useAuthStore.getState()
					logout()

					if (typeof window !== 'undefined') {
						window.location.href = `${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(AUTH_MESSAGES.SESSION_EXPIRED)}`
					}
				},
			)

			if (result.success && result.token) {
				// Retry the original request with the new token
				originalRequest.headers.Authorization = `Bearer ${result.token}`
				return api(originalRequest)
			}

			// Refresh failed
			if (result.error === 'NETWORK') {
				// Network error — don't logout, just fail this request
				console.warn('[axios] Network error during refresh, request failed')
				return Promise.reject(error)
			}

			// Session expired — already handled by onSessionExpired callback
			return Promise.reject(error)
		}

		// ----------------------------------------------------------------
		// HANDLE OTHER ERRORS
		// ----------------------------------------------------------------
		if (error.response) {
			const backendError = error.response.data as Record<string, unknown>

			// Check if response has meaningful body
			const hasBody =
				backendError &&
				(backendError.message || backendError.code || backendError.statusCode)

			if (!hasBody) {
				// Map HTTP status codes to user-friendly messages
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

				error.response.data = {
					success: false,
					statusCode: error.response.status,
					message:
						statusMessages[error.response.status] ||
						`Request failed with status ${error.response.status}`,
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
