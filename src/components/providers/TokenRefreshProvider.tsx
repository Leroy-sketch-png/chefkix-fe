'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/authStore'
import { PATHS, shouldRedirectExpiredSession } from '@/constants'
import {
	scheduleProactiveRefresh,
	cancelScheduledRefresh,
	refreshAccessToken,
	shouldRefreshToken,
	isRefreshInProgress,
	decodeToken,
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
	const { isAuthenticated, accessToken, isLoggingOut, logout } = useAuthStore()
	const t = useTranslations('shared')
	const hasScheduledRef = useRef(false)

	/**
	 * Callbacks for TokenManager
	 */
	const onTokenRefreshed = useCallback((newToken: string) => {
		const currentAuth = useAuthStore.getState()
		const currentSubject = currentAuth.accessToken
			? decodeToken(currentAuth.accessToken)?.sub
			: null
		const refreshedSubject = decodeToken(newToken)?.sub

		if (
			!currentAuth.isAuthenticated ||
			currentAuth.isLoggingOut ||
			!currentSubject ||
			refreshedSubject !== currentSubject
		) {
			return
		}

		useAuthStore.setState({ accessToken: newToken, isAuthenticated: true })
	}, [])

	const onSessionExpired = useCallback(() => {
		const currentAuth = useAuthStore.getState()
		if (currentAuth.isLoggingOut || !currentAuth.isAuthenticated) return

		logout()
		if (typeof window !== 'undefined') {
			if (shouldRedirectExpiredSession(window.location.pathname)) {
				window.location.href = `${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(t('sessionExpiredMessage'))}`
			}
		}
	}, [logout, t])

	/**
	 * Refresh the token (used for visibility change)
	 */
	const doRefresh = useCallback(async (): Promise<boolean> => {
		const currentAuth = useAuthStore.getState()
		if (
			!currentAuth.isAuthenticated ||
			currentAuth.isLoggingOut ||
			!currentAuth.accessToken
		) {
			return false
		}

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
		if (!isAuthenticated || !accessToken || isLoggingOut) {
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
	}, [
		isAuthenticated,
		accessToken,
		isLoggingOut,
		onTokenRefreshed,
		onSessionExpired,
	])

	/**
	 * Handle tab visibility and focus changes.
	 * Refresh if the token is stale when user returns.
	 */
	useEffect(() => {
		if (!isAuthenticated || !accessToken || isLoggingOut) return

		const handleVisibilityOrFocus = async () => {
			// Only act when tab becomes visible
			if (document.visibilityState !== 'visible') return
			const currentAuth = useAuthStore.getState()
			if (
				!currentAuth.isAuthenticated ||
				currentAuth.isLoggingOut ||
				!currentAuth.accessToken
			) {
				return
			}

			// Check if token needs refresh using actual expiry
			if (shouldRefreshToken(currentAuth.accessToken)) {
				try {
					visibilityRefreshPromise = doRefresh()
					await visibilityRefreshPromise
				} finally {
					visibilityRefreshPromise = null
				}

				// Re-schedule proactive refresh with the new token
				const refreshedAuth = useAuthStore.getState()
				if (
					refreshedAuth.isAuthenticated &&
					!refreshedAuth.isLoggingOut &&
					refreshedAuth.accessToken
				) {
					scheduleProactiveRefresh(
						refreshedAuth.accessToken,
						onTokenRefreshed,
						onSessionExpired,
					)
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
		isLoggingOut,
		doRefresh,
		onTokenRefreshed,
		onSessionExpired,
	])

	return <>{children}</>
}
