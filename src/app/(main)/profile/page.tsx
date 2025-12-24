'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { PATHS } from '@/constants'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'

/**
 * /profile route - Redirects to the current user's profile page
 *
 * Since profiles are at /{userId}, this page uses the auth store to get
 * the current user's ID and redirects to their profile.
 * Must be a client component to access Zustand store (localStorage-persisted).
 */
const ProfilePage = () => {
	const router = useRouter()
	const { user, isAuthenticated, isLoading } = useAuthStore()

	useEffect(() => {
		// Wait for auth state to hydrate from localStorage
		if (isLoading) return

		if (isAuthenticated && user?.userId) {
			// Redirect to user's own profile page
			router.replace(`/${user.userId}`)
		} else {
			// Not authenticated - redirect to dashboard (which will handle auth)
			router.replace(PATHS.DASHBOARD)
		}
	}, [isAuthenticated, isLoading, user?.userId, router])

	// Show skeleton while determining redirect destination
	return <UserProfileSkeleton />
}

export default ProfilePage
