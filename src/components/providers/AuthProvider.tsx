'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_ROUTES, PATHS, PUBLIC_ROUTES } from '@/constants'
import { introspect } from '@/services/auth'

interface AuthProviderProps {
	children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const { isAuthenticated, isLoading, token, logout, setLoading } = useAuth()
	const pathname = usePathname()
	const router = useRouter()

	// This effect runs once on app load to validate the session.
	useEffect(() => {
		const validateSession = async () => {
			if (!token) {
				// If there's no token, we're done loading.
				setLoading(false)
				return
			}

			// If a token exists, we must validate it with the backend.
			const response = await introspect(token)

			if (!response.success || !response.data?.valid) {
				// If the token is invalid, log the user out.
				logout()
			} else {
				// If the token is valid, we simply stop loading.
				// The user data is already in the store from the last login.
				setLoading(false)
			}
		}

		validateSession()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]) // We only want to re-validate if the token itself changes.

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
