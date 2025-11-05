'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_ROUTES, PATHS, PUBLIC_ROUTES } from '@/constants'
import { getMyProfile } from '@/services/profile'

interface AuthProviderProps {
	children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const {
		isAuthenticated,
		isLoading,
		accessToken,
		user,
		logout,
		setLoading,
		setUser,
	} = useAuth()
	const pathname = usePathname()
	const router = useRouter()

	// This effect runs once on app load to validate the session.
	useEffect(() => {
		const validateSession = async () => {
			// Ensure we show a loading state while we validate any persisted token.
			// Persisted stores may contain `isLoading: false` from previous sessions,
			// so explicitly set loading true here to avoid flash / premature redirects.
			setLoading(true)

			if (!accessToken) {
				// If there's no accessToken, we're done loading.
				setLoading(false)
				return
			}

			// Token exists - Keycloak handles validation internally.
			// We just need to ensure we have user data.
			// If we don't have user data, fetch it.
			if (!user) {
				const profileResponse = await getMyProfile()
				if (profileResponse.success && profileResponse.data) {
					setUser(profileResponse.data)
				} else {
					// Failed to fetch profile, logout
					logout()
				}
			}
			// We're done loading
			setLoading(false)
		}

		validateSession()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accessToken]) // We only want to re-validate if the accessToken itself changes.

	// This effect handles redirection logic AFTER the initial session validation.
	useEffect(() => {
		// Don't run redirect logic until the initial loading is complete.
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

	// While validating the session, show nothing to prevent content flashing.
	if (isLoading) {
		return null // Or a full-page loading spinner
	}

	// Once loading is complete, render the children.
	return <>{children}</>
}
