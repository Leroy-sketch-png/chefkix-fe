'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_ROUTES, PATHS, PUBLIC_ROUTES } from '@/constants'
import { getMyProfile } from '@/services/profile'
import { AuthLoader } from '@/components/auth/AuthLoader'

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
				return
			}

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
		}

		validateSession()
	}, [isHydrated, accessToken, user, logout, setLoading, setUser])

	// This effect handles redirection logic AFTER the initial session validation.
	useEffect(() => {
		// Don't run redirect logic until loading is complete
		if (isLoading) return

		const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
		const isAuthRoute = AUTH_ROUTES.includes(pathname)

		if (!isAuthenticated && !isPublicRoute) {
			router.push(PATHS.AUTH.SIGN_IN)
		}

		if (isAuthenticated && isAuthRoute) {
			router.push(PATHS.DASHBOARD)
		}
	}, [isAuthenticated, isLoading, pathname, router])

	// While validating the session, show a warm, on-brand loading screen.
	if (isLoading) {
		return <AuthLoader />
	}

	// Once loading is complete, render the children.
	return <>{children}</>
}
