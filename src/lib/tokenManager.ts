/**
 * TokenManager - The Single Source of Truth for Token Operations
 *
 * PHILOSOPHY: Tokens are just JWTs. All the information we need is IN the token.
 * We don't track "time since last refresh" — we read the actual expiry claim.
 *
 * This module provides:
 * 1. Token decoding and expiry checking
 * 2. Centralized, queue-based token refresh (prevents race conditions)
 * 3. Clear expiry-based logic for when to refresh
 *
 * USAGE:
 * - TokenRefreshProvider uses this for proactive refresh scheduling
 * - Axios interceptor uses this for reactive 401 handling
 * - AuthProvider uses this for session validation
 *
 * CRITICAL: This module NEVER imports from authStore to avoid circular deps.
 * Instead, it accepts callbacks for store operations.
 */

import { api } from '@/lib/axios'

// ============================================================================
// CONSTANTS
// ============================================================================

// Access token lifetime in seconds (must match Keycloak realm config)
export const ACCESS_TOKEN_LIFETIME_SECONDS = 30 * 60 // 30 minutes

// Refresh when less than 20% of lifetime remains (6 minutes before expiry)
// More aggressive than 80% to ensure we never hit expiry
export const REFRESH_THRESHOLD_PERCENTAGE = 0.2

// Minimum time before expiry to trigger refresh (failsafe)
export const REFRESH_THRESHOLD_SECONDS =
	ACCESS_TOKEN_LIFETIME_SECONDS * REFRESH_THRESHOLD_PERCENTAGE

// Minimum interval between refresh attempts (prevent rapid fire on errors)
export const MIN_REFRESH_INTERVAL_MS = 10 * 1000 // 10 seconds

// ============================================================================
// TOKEN DECODING
// ============================================================================

export interface DecodedToken {
	exp: number // Expiry timestamp (seconds since epoch)
	iat: number // Issued at timestamp
	sub: string // Subject (user ID in Keycloak)
	preferred_username?: string
	email?: string
	realm_access?: { roles: string[] }
}

/**
 * Decode a JWT without verification (we trust Keycloak's signature verification on BE)
 * Returns null if token is malformed
 */
export const decodeToken = (token: string): DecodedToken | null => {
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null

		const payload = JSON.parse(atob(parts[1]))

		// Validate required fields
		if (typeof payload.exp !== 'number' || typeof payload.sub !== 'string') {
			console.error('[TokenManager] Token missing required claims')
			return null
		}

		return payload as DecodedToken
	} catch (error) {
		console.error('[TokenManager] Failed to decode token:', error)
		return null
	}
}

/**
 * Check if a token is expired (or will expire within buffer seconds)
 */
export const isTokenExpired = (
	token: string,
	bufferSeconds: number = 0,
): boolean => {
	const decoded = decodeToken(token)
	if (!decoded) return true // Malformed = expired

	const nowSeconds = Math.floor(Date.now() / 1000)
	return decoded.exp <= nowSeconds + bufferSeconds
}

/**
 * Get seconds until token expires (negative if already expired)
 */
export const getSecondsUntilExpiry = (token: string): number => {
	const decoded = decodeToken(token)
	if (!decoded) return -1

	const nowSeconds = Math.floor(Date.now() / 1000)
	return decoded.exp - nowSeconds
}

/**
 * Check if we should proactively refresh the token
 * Returns true if less than REFRESH_THRESHOLD_PERCENTAGE of lifetime remains
 */
export const shouldRefreshToken = (token: string): boolean => {
	const secondsUntilExpiry = getSecondsUntilExpiry(token)

	// Already expired
	if (secondsUntilExpiry <= 0) {
		console.log('[TokenManager] Token already expired')
		return true
	}

	// Should refresh if less than threshold remaining
	const shouldRefresh = secondsUntilExpiry <= REFRESH_THRESHOLD_SECONDS

	if (shouldRefresh) {
		console.log(
			`[TokenManager] Token expires in ${Math.round(secondsUntilExpiry / 60)} min — refresh needed`,
		)
	}

	return shouldRefresh
}

/**
 * Get human-readable token status for debugging
 */
export const getTokenStatus = (
	token: string | null,
): {
	valid: boolean
	expiresIn: string
	expiresAt: string
	shouldRefresh: boolean
} => {
	if (!token) {
		return {
			valid: false,
			expiresIn: 'N/A',
			expiresAt: 'N/A',
			shouldRefresh: false,
		}
	}

	const decoded = decodeToken(token)
	if (!decoded) {
		return {
			valid: false,
			expiresIn: 'MALFORMED',
			expiresAt: 'MALFORMED',
			shouldRefresh: false,
		}
	}

	const secondsUntilExpiry = getSecondsUntilExpiry(token)
	const expired = secondsUntilExpiry <= 0

	return {
		valid: !expired,
		expiresIn: expired
			? `EXPIRED ${Math.abs(Math.round(secondsUntilExpiry / 60))} min ago`
			: `${Math.round(secondsUntilExpiry / 60)} min`,
		expiresAt: new Date(decoded.exp * 1000).toLocaleTimeString(),
		shouldRefresh: shouldRefreshToken(token),
	}
}

// ============================================================================
// CENTRALIZED TOKEN REFRESH (The Queue Pattern)
// ============================================================================

// State for the centralized refresh mechanism
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null
let lastRefreshAttempt = 0

// Subscribers waiting for the refresh to complete
type RefreshSubscriber = {
	resolve: (token: string) => void
	reject: (error: Error) => void
}
let refreshSubscribers: RefreshSubscriber[] = []

/**
 * Notify all subscribers with the new token (or error)
 */
const notifySubscribers = (token: string | null, error: Error | null) => {
	refreshSubscribers.forEach(subscriber => {
		if (error) {
			subscriber.reject(error)
		} else if (token) {
			subscriber.resolve(token)
		} else {
			subscriber.reject(new Error('No token returned from refresh'))
		}
	})
	refreshSubscribers = []
}

/**
 * The actual refresh API call
 * This is separated so we can mock it in tests
 */
const callRefreshEndpoint = async (): Promise<string> => {
	// The refresh_token cookie is HttpOnly — JavaScript cannot see it.
	// The browser sends it automatically with withCredentials: true.
	const response = await api.post('/api/v1/auth/refresh-token')

	const newAccessToken = response.data?.data?.accessToken
	if (!newAccessToken) {
		throw new Error('No access token in refresh response')
	}

	return newAccessToken
}

export interface RefreshResult {
	success: boolean
	token: string | null
	error: 'EXPIRED' | 'NETWORK' | 'UNKNOWN' | null
}

/**
 * Centralized token refresh with queue pattern.
 *
 * When multiple parts of the app detect an expired token simultaneously:
 * 1. First caller initiates the refresh
 * 2. Subsequent callers get queued and receive the same result
 * 3. No race conditions, no duplicate refresh calls
 *
 * @param onTokenRefreshed - Callback to update the store with new token
 * @param onSessionExpired - Callback when refresh fails with 401/403 (session truly expired)
 */
export const refreshAccessToken = async (
	onTokenRefreshed: (token: string) => void,
	onSessionExpired: () => void,
): Promise<RefreshResult> => {
	// Rate limit: prevent rapid-fire refresh attempts
	const now = Date.now()
	if (now - lastRefreshAttempt < MIN_REFRESH_INTERVAL_MS) {
		console.debug(
			'[TokenManager] Refresh throttled (too soon since last attempt)',
		)
		return { success: false, token: null, error: null }
	}

	// If a refresh is already in progress, queue this request
	if (isRefreshing && refreshPromise) {
		console.debug('[TokenManager] Refresh in progress, queueing...')
		try {
			const token = await new Promise<string>((resolve, reject) => {
				refreshSubscribers.push({ resolve, reject })
			})
			return { success: true, token, error: null }
		} catch (error) {
			return {
				success: false,
				token: null,
				error:
					error instanceof Error && error.message === 'SESSION_EXPIRED'
						? 'EXPIRED'
						: 'UNKNOWN',
			}
		}
	}

	// We're the first caller — initiate the refresh
	isRefreshing = true
	lastRefreshAttempt = now

	console.log('[TokenManager] 🔄 Initiating token refresh...')

	try {
		refreshPromise = callRefreshEndpoint()
		const newToken = await refreshPromise

		console.log('[TokenManager] ✅ Token refresh successful')

		// Update the store
		onTokenRefreshed(newToken)

		// Notify all queued subscribers
		notifySubscribers(newToken, null)

		return { success: true, token: newToken, error: null }
	} catch (error: unknown) {
		console.error('[TokenManager] ❌ Token refresh failed:', error)

		// Determine the type of failure
		let errorType: RefreshResult['error'] = 'UNKNOWN'

		if (error instanceof Error) {
			// Check for network errors (no response from server)
			const axiosError = error as {
				response?: { status?: number }
				code?: string
			}

			if (
				axiosError.code === 'ECONNABORTED' ||
				axiosError.code === 'ERR_NETWORK'
			) {
				// Network error — don't logout, user can retry
				errorType = 'NETWORK'
				console.warn(
					'[TokenManager] Network error during refresh — NOT logging out',
				)
			} else if (
				axiosError.response?.status === 401 ||
				axiosError.response?.status === 403
			) {
				// Server explicitly rejected the refresh token — session is truly expired
				errorType = 'EXPIRED'
				console.error(
					'[TokenManager] Session expired (401/403 from refresh endpoint)',
				)
				onSessionExpired()
			}
		}

		// Notify all queued subscribers of the failure
		const sessionExpiredError = new Error('SESSION_EXPIRED')
		notifySubscribers(
			null,
			errorType === 'EXPIRED' ? sessionExpiredError : (error as Error),
		)

		return { success: false, token: null, error: errorType }
	} finally {
		isRefreshing = false
		refreshPromise = null
	}
}

/**
 * Check if a refresh is currently in progress
 */
export const isRefreshInProgress = (): boolean => isRefreshing

/**
 * Wait for any in-progress refresh to complete
 * Returns the new token if refresh succeeds, null otherwise
 */
export const waitForRefresh = async (): Promise<string | null> => {
	if (!isRefreshing || !refreshPromise) {
		return null
	}

	try {
		return await refreshPromise
	} catch {
		return null
	}
}

// ============================================================================
// SCHEDULER (for proactive refresh)
// ============================================================================

let refreshTimeout: NodeJS.Timeout | null = null

/**
 * Schedule a proactive refresh based on the token's actual expiry.
 * Cancels any previously scheduled refresh.
 *
 * @param token - The current access token
 * @param onTokenRefreshed - Callback to update store with new token
 * @param onSessionExpired - Callback when session is truly expired
 */
export const scheduleProactiveRefresh = (
	token: string,
	onTokenRefreshed: (token: string) => void,
	onSessionExpired: () => void,
): void => {
	// Clear any existing scheduled refresh
	if (refreshTimeout) {
		clearTimeout(refreshTimeout)
		refreshTimeout = null
	}

	const decoded = decodeToken(token)
	if (!decoded) {
		console.error('[TokenManager] Cannot schedule refresh — invalid token')
		return
	}

	const secondsUntilExpiry = getSecondsUntilExpiry(token)

	// If already past refresh threshold, refresh immediately
	if (secondsUntilExpiry <= REFRESH_THRESHOLD_SECONDS) {
		console.log(
			'[TokenManager] Token at/past refresh threshold — refreshing immediately',
		)
		refreshAccessToken(onTokenRefreshed, onSessionExpired)
		return
	}

	// Schedule refresh at the threshold point
	const refreshInMs = (secondsUntilExpiry - REFRESH_THRESHOLD_SECONDS) * 1000
	const refreshInMinutes = Math.round(refreshInMs / 60000)

	console.log(
		`[TokenManager] 📅 Scheduled proactive refresh in ${refreshInMinutes} min ` +
			`(token expires at ${new Date(decoded.exp * 1000).toLocaleTimeString()})`,
	)

	refreshTimeout = setTimeout(async () => {
		console.log('[TokenManager] ⏰ Scheduled refresh triggered')
		const result = await refreshAccessToken(onTokenRefreshed, onSessionExpired)

		// If refresh succeeded, schedule the next one
		if (result.success && result.token) {
			scheduleProactiveRefresh(result.token, onTokenRefreshed, onSessionExpired)
		}
	}, refreshInMs)
}

/**
 * Cancel any scheduled proactive refresh
 */
export const cancelScheduledRefresh = (): void => {
	if (refreshTimeout) {
		clearTimeout(refreshTimeout)
		refreshTimeout = null
		console.debug('[TokenManager] Scheduled refresh cancelled')
	}
}
