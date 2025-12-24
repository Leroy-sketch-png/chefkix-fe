'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_ROUTES, PATHS, PUBLIC_ROUTES } from '@/constants'
import { getMyProfile } from '@/services/profile'
import { AuthLoader } from '@/components/auth/AuthLoader'
import { waitForVisibilityRefresh } from './TokenRefreshProvider'

interface AuthProviderProps {
	children: React.ReactNode
}

/**
 * AuthProvider handles:
 * 1. Session validation on app load (checking persisted tokens)
 * 2. Route protection (redirecting unauthenticated users)
 * 3. Auth route redirection (redirecting authenticated users away from login/signup)
 *
 * Flow:
 * - Wait for Zustand hydration to complete
 * - If we have a token, validate the session by fetching the profile
 * - Show AuthLoader while validating
 * - Redirect based on auth state and current route
 *
 * CRITICAL: We use isRedirecting state to prevent the flicker where the
 * previous page renders briefly before the redirect completes.
 *
 * COORDINATION WITH TokenRefreshProvider:
 * When tab becomes visible after being hidden, TokenRefreshProvider may be
 * refreshing the token. We MUST wait for that to complete before making
 * any API calls to avoid 401 race conditions.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
	const {
		isAuthenticated,
		isLoading,
		isHydrated,
		accessToken,
		user,
		logout,
		setLoading,
		setUser,
	} = useAuth()
	const pathname = usePathname()
	const router = useRouter()

	// Track if we're in the middle of a redirect to prevent render flicker
	const [isRedirecting, setIsRedirecting] = useState(false)
	// Track if initial session validation is complete
	const [isSessionValidated, setIsSessionValidated] = useState(false)
	// Ref to track if redirect has been triggered for this auth state
	const redirectTriggeredRef = useRef(false)

	// This effect runs once hydration is complete to validate the session.
	useEffect(() => {
		// Wait for Zustand to rehydrate from localStorage
		if (!isHydrated) {
			return
		}

		const validateSession = async () => {
			// If there's no accessToken, we're done loading.
			if (!accessToken) {
				setLoading(false)
				setIsSessionValidated(true)
				return
			}

			// CRITICAL: Wait for any visibility-triggered token refresh to complete
			// This prevents race conditions where we call getMyProfile() with an expired token
			// while TokenRefreshProvider is already refreshing it
			await waitForVisibilityRefresh()

			// Token exists - if we don't have user data, fetch it.
			if (!user) {
				const profileResponse = await getMyProfile()
				if (profileResponse.success && profileResponse.data) {
					setUser(profileResponse.data)
				} else {
					// Failed to fetch profile (token invalid/expired), logout
					logout()
				}
			}

			// We're done loading
			setLoading(false)
			setIsSessionValidated(true)
		}

		validateSession()
	}, [isHydrated, accessToken, user, logout, setLoading, setUser])

	// This effect handles redirection logic AFTER the initial session validation.
	useEffect(() => {
		// Don't run redirect logic until loading is complete AND session is validated
		if (isLoading || !isSessionValidated) return

		const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
		const isAuthRoute = AUTH_ROUTES.includes(pathname)

		// Protected route access without auth - redirect to sign in
		if (!isAuthenticated && !isPublicRoute) {
			if (!redirectTriggeredRef.current) {
				redirectTriggeredRef.current = true
				setIsRedirecting(true)
				router.push(PATHS.AUTH.SIGN_IN)
			}
			return
		}

		// Authenticated user on auth route (sign-in, sign-up) - redirect to dashboard
		if (isAuthenticated && isAuthRoute) {
			if (!redirectTriggeredRef.current) {
				redirectTriggeredRef.current = true
				setIsRedirecting(true)
				router.push(PATHS.DASHBOARD)
			}
			return
		}

		// We're on the correct page, no redirect needed
		redirectTriggeredRef.current = false
		setIsRedirecting(false)
	}, [isAuthenticated, isLoading, isSessionValidated, pathname, router])

	// Reset redirect tracking when auth state changes (logout, new login)
	useEffect(() => {
		redirectTriggeredRef.current = false
	}, [isAuthenticated])

	// While validating the session OR redirecting, show a warm, on-brand loading screen.
	// This prevents the flicker where the old page renders briefly before redirect.
	if (isLoading || isRedirecting) {
		return <AuthLoader />
	}

	// Once loading is complete and we're not redirecting, render the children.
	return <>{children}</>
}
