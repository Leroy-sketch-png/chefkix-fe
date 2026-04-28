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
import { PATHS } from '@/constants'
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
import messages from '../../messages/en.json'

/** Static lookup for axios error translations (non-component context) */
const t = (key: keyof typeof messages.common) => messages.common[key]

// ============================================================================
// AXIOS INSTANCES
// ============================================================================

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080',
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: app.AXIOS_TIMEOUT,
	withCredentials: true, // CRITICAL: Send HttpOnly cookies (refresh_token)
})

/**
 * Separate axios instance for AI features.
 * Browser requests go through the frontend's same-origin proxy so the AI key
 * stays server-side. Server-side calls target that same proxy via localhost.
 */
const aiProxyBaseUrl =
	typeof window === 'undefined'
		? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
		: ''

export const aiApi = axios.create({
	baseURL: aiProxyBaseUrl,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 60_000, // AI calls can take longer (Gemini processing)
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
		const isWrappedResponse =
			backendResponse != null &&
			typeof backendResponse === 'object' &&
			('success' in backendResponse ||
				'statusCode' in backendResponse ||
				'code' in backendResponse ||
				'message' in backendResponse)

		// Find the main data payload (handles various backend formats)
		const data =
			backendResponse.result !== undefined
				? backendResponse.result
				: backendResponse.data !== undefined
					? backendResponse.data
					: isWrappedResponse
						? null
						: backendResponse

		response.data = {
			success: backendResponse.success ?? true,
			statusCode:
				backendResponse.code ?? backendResponse.statusCode ?? response.status,
			message: backendResponse.message || t('httpRequestSuccess'),
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
				return Promise.reject(error)
			}

			originalRequest._retry = true

			// If a refresh is already in progress, wait for it
			if (isRefreshInProgress()) {
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
					useAuthStore.setState({
						accessToken: newToken,
						isAuthenticated: true,
					})
				},
				// onSessionExpired: Clear auth state and redirect
				() => {
					const { logout } = useAuthStore.getState()
					logout()

					if (typeof window !== 'undefined') {
						window.location.href = `${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(t('httpSessionExpired'))}`
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
					400: t('httpError400'),
					401: t('httpError401'),
					403: t('httpError403'),
					404: t('httpError404'),
					413: t('httpError413'),
					429: t('httpError429'),
					500: t('httpError500'),
					502: t('httpError502'),
					503: t('httpError503'),
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
					message: backendError.message || t('httpGenericError'),
					error: backendError.result,
				}
			}
		}

		return Promise.reject(error)
	},
)
