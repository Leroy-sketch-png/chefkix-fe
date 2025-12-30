'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { PATHS, AUTH_MESSAGES } from '@/constants'
import {
	scheduleProactiveRefresh,
	cancelScheduledRefresh,
	refreshAccessToken,
	shouldRefreshToken,
	getTokenStatus,
	isRefreshInProgress,
} from '@/lib/tokenManager'

/**
 * TokenRefreshProvider - Production-Grade Proactive Token Refresh
 *
 * STRATEGY:
 * 1. On mount/token change: Schedule refresh based on ACTUAL JWT expiry (not timers)
 * 2. On visibility change: Refresh if token is stale
 * 3. Uses centralized TokenManager to avoid race conditions
 *
 * NO MORE:
 * - Manual timers that drift from actual expiry
 * - Race conditions with axios interceptor
 * - Fragile "time since last refresh" tracking
 *
 * THE TOKEN'S `exp` CLAIM IS THE SINGLE SOURCE OF TRUTH.
 */

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
	const { isAuthenticated, accessToken, logout } = useAuthStore()
	const hasScheduledRef = useRef(false)

	/**
	 * Callbacks for TokenManager
	 */
	const onTokenRefreshed = useCallback((newToken: string) => {
		useAuthStore.setState({ accessToken: newToken })
	}, [])

	const onSessionExpired = useCallback(() => {
		logout()
		if (typeof window !== 'undefined') {
			window.location.href = `${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(AUTH_MESSAGES.SESSION_EXPIRED)}`
		}
	}, [logout])

	/**
	 * Refresh the token (used for visibility change)
	 */
	const doRefresh = useCallback(async (): Promise<boolean> => {
		// Skip if already refreshing
		if (isRefreshInProgress()) {
			return false
		}

		const result = await refreshAccessToken(onTokenRefreshed, onSessionExpired)
		return result.success
	}, [onTokenRefreshed, onSessionExpired])

	/**
	 * Schedule proactive refresh when authenticated with a token.
	 * Uses the ACTUAL token expiry, not manual timers.
	 */
	useEffect(() => {
		if (!isAuthenticated || !accessToken) {
			// Cancel any scheduled refresh when logged out
			cancelScheduledRefresh()
			hasScheduledRef.current = false
			return
		}

		// Schedule proactive refresh based on actual token expiry
		if (!hasScheduledRef.current) {
			scheduleProactiveRefresh(accessToken, onTokenRefreshed, onSessionExpired)
			hasScheduledRef.current = true
		}

		// Cleanup on unmount
		return () => {
			cancelScheduledRefresh()
			hasScheduledRef.current = false
		}
	}, [isAuthenticated, accessToken, onTokenRefreshed, onSessionExpired])

	/**
	 * Handle tab visibility and focus changes.
	 * Refresh if the token is stale when user returns.
	 */
	useEffect(() => {
		if (!isAuthenticated || !accessToken) return

		const handleVisibilityOrFocus = async () => {
			// Only act when tab becomes visible
			if (document.visibilityState !== 'visible') return

			// Check if token needs refresh using actual expiry
			if (shouldRefreshToken(accessToken)) {
				visibilityRefreshPromise = doRefresh()
				await visibilityRefreshPromise
				visibilityRefreshPromise = null

				// Re-schedule proactive refresh with the new token
				const newToken = useAuthStore.getState().accessToken
				if (newToken) {
					scheduleProactiveRefresh(newToken, onTokenRefreshed, onSessionExpired)
				}
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityOrFocus)
		window.addEventListener('focus', handleVisibilityOrFocus)

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
			window.removeEventListener('focus', handleVisibilityOrFocus)
		}
	}, [
		isAuthenticated,
		accessToken,
		doRefresh,
		onTokenRefreshed,
		onSessionExpired,
	])

	return <>{children}</>
}
