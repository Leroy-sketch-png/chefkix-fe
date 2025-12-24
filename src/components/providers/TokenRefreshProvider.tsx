'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'

/**
 * TokenRefreshProvider handles proactive token refresh before expiry.
 *
 * Strategy:
 * - Access tokens expire in 15 minutes (900 seconds) per spec
 * - We refresh proactively at 80% of lifetime (12 minutes)
 * - This prevents users from ever seeing 401 errors in normal usage
 * - Falls back to reactive refresh (axios interceptor) if proactive fails
 *
 * CRITICAL DESIGN DECISION:
 * Token refresh ONLY updates the accessToken. It does NOT touch the user object.
 * The user is already authenticated and their profile is already loaded.
 * Mixing token refresh with user validation creates unnecessary complexity and bugs.
 *
 * VISIBILITY CHANGE HANDLING:
 * When user returns to a tab after being away, we MUST refresh the token
 * BEFORE any other API calls happen. We expose a global promise that
 * AuthProvider can await to coordinate timing.
 */

// Token lifetime in milliseconds (30 minutes = 1800 seconds)
// SYNC: Must match Keycloak realm accessTokenLifespan in realm-export.json
const ACCESS_TOKEN_LIFETIME_MS = 30 * 60 * 1000

// Refresh at 80% of lifetime (24 minutes)
const REFRESH_THRESHOLD_MS = ACCESS_TOKEN_LIFETIME_MS * 0.8

// Minimum time between refresh attempts (prevent rapid fire)
const MIN_REFRESH_INTERVAL_MS = 30 * 1000 // 30 seconds (reduced from 1 min for better UX)

// Global promise for coordinating visibility-triggered refresh with AuthProvider
let visibilityRefreshPromise: Promise<boolean> | null = null

/**
 * Wait for any ongoing visibility-triggered refresh to complete.
 * Call this from AuthProvider BEFORE making API calls.
 */
export const waitForVisibilityRefresh = async (): Promise<void> => {
	if (visibilityRefreshPromise) {
		await visibilityRefreshPromise
	}
}

interface TokenRefreshProviderProps {
	children: React.ReactNode
}

export const TokenRefreshProvider = ({
	children,
}: TokenRefreshProviderProps) => {
	const { isAuthenticated, accessToken } = useAuthStore()

	// Track last refresh time to prevent rapid refreshes
	const lastRefreshTimeRef = useRef<number>(0)
	// Track if a refresh is in progress
	const isRefreshingRef = useRef<boolean>(false)
	// Store the interval ID for cleanup
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	/**
	 * Proactively refresh the access token.
	 * Only updates the token - user state is preserved as-is.
	 * Returns true if refresh was successful, false otherwise.
	 */
	const refreshToken = useCallback(async (): Promise<boolean> => {
		// Prevent concurrent refreshes
		if (isRefreshingRef.current) {
			return false
		}

		// Prevent refreshing too frequently
		const now = Date.now()
		if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL_MS) {
			return false
		}

		isRefreshingRef.current = true

		try {
			// Call the refresh endpoint (uses HttpOnly cookie automatically)
			const response = await api.post('/api/v1/auth/refresh-token')
			const newAccessToken = response.data?.data?.accessToken

			if (newAccessToken) {
				// Update token in store - request interceptor will pick it up
				// No need to set api.defaults.headers as the interceptor handles it
				useAuthStore.setState({ accessToken: newAccessToken })

				lastRefreshTimeRef.current = now
				console.debug('[TokenRefresh] Proactive refresh successful')
				return true
			}

			console.warn('[TokenRefresh] No access token in refresh response')
			return false
		} catch (error) {
			console.warn('[TokenRefresh] Proactive refresh failed:', error)
			// Don't logout here - let the reactive refresh (axios interceptor) handle it
			// The proactive refresh might fail due to network issues, but the token might still be valid
			return false
		} finally {
			isRefreshingRef.current = false
		}
	}, [])

	/**
	 * Set up the proactive refresh interval when authenticated.
	 */
	useEffect(() => {
		// Only run when authenticated with a token
		if (!isAuthenticated || !accessToken) {
			// Clear any existing interval
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
			return
		}

		// Record initial "refresh" time as login time
		if (lastRefreshTimeRef.current === 0) {
			lastRefreshTimeRef.current = Date.now()
		}

		// Set up interval to check and refresh proactively
		intervalRef.current = setInterval(async () => {
			const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current

			// If we're past the threshold, refresh
			if (timeSinceLastRefresh >= REFRESH_THRESHOLD_MS) {
				const success = await refreshToken()
				if (!success) {
					// Proactive refresh failed - the reactive handler will catch 401s
					console.debug(
						'[TokenRefresh] Proactive refresh failed, relying on reactive handler',
					)
				}
			}
		}, 60 * 1000) // Check every minute

		// Cleanup on unmount or auth state change
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
		}
	}, [isAuthenticated, accessToken, refreshToken])

	// Also refresh when the tab becomes visible (user returns after being away)
	// CRITICAL: We set a global promise so AuthProvider can wait for this to complete
	useEffect(() => {
		if (!isAuthenticated) return

		const handleVisibilityChange = async () => {
			if (document.visibilityState === 'visible') {
				const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current

				// If significant time has passed while tab was hidden, refresh IMMEDIATELY
				// Also refresh even if close to threshold to be safe
				if (timeSinceLastRefresh >= REFRESH_THRESHOLD_MS * 0.8) {
					console.debug(
						'[TokenRefresh] Tab became visible, refreshing token proactively',
					)
					// Set global promise so AuthProvider can await this
					visibilityRefreshPromise = refreshToken()
					await visibilityRefreshPromise
					visibilityRefreshPromise = null
				}
			}
		}

		// Handle both visibility change AND focus (belt + suspenders)
		const handleFocus = async () => {
			const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current
			if (timeSinceLastRefresh >= REFRESH_THRESHOLD_MS * 0.8) {
				console.debug('[TokenRefresh] Window focused, checking token freshness')
				visibilityRefreshPromise = refreshToken()
				await visibilityRefreshPromise
				visibilityRefreshPromise = null
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)
		window.addEventListener('focus', handleFocus)

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			window.removeEventListener('focus', handleFocus)
		}
	}, [isAuthenticated, refreshToken])

	return <>{children}</>
}
