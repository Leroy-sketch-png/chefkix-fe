'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBlockedUsersStore } from '@/store/blockedUsersStore'

/**
 * BlockedUsersProvider - Initializes the blocked users store when user is authenticated.
 * Should be placed in the app layout after AuthProvider.
 */
export const BlockedUsersProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const { isAuthenticated, isLoading, isHydrated } = useAuth()
	const { fetchBlockedUsers, isLoaded, clearBlockedUsers } =
		useBlockedUsersStore()

	useEffect(() => {
		// Wait for auth to be ready
		if (!isHydrated || isLoading) return

		if (isAuthenticated && !isLoaded) {
			// User is authenticated, fetch blocked users list
			fetchBlockedUsers()
		} else if (!isAuthenticated) {
			// User logged out, clear blocked users
			clearBlockedUsers()
		}
	}, [
		isAuthenticated,
		isLoading,
		isHydrated,
		isLoaded,
		fetchBlockedUsers,
		clearBlockedUsers,
	])

	return <>{children}</>
}
