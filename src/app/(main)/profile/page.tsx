'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { ErrorState } from '@/components/ui/error-state'

/**
 * /profile route - Redirects to the current user's profile page
 *
 * Since profiles are at /{userId}, this page uses the auth store to get
 * the current user's ID and redirects to their profile.
 * Must be a client component to access Zustand store (localStorage-persisted).
 */
const ProfilePage = () => {
	const router = useRouter()
	const { user, isAuthenticated, isLoading } = useAuth()
	const [timedOut, setTimedOut] = useState(false)

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

	// Safety timeout: if redirect hasn't happened after 5s, show error
	useEffect(() => {
		const timer = setTimeout(() => setTimedOut(true), 5000)
		return () => clearTimeout(timer)
	}, [])

	if (timedOut) {
		return (
			<div className='flex min-h-[50vh] items-center justify-center p-6'>
				<ErrorState
					title='Could not load profile'
					message='We had trouble loading your profile. Please try logging in again.'
					onRetry={() => router.replace(PATHS.DASHBOARD)}
				/>
			</div>
		)
	}

	// Show skeleton while determining redirect destination
	return <UserProfileSkeleton />
}

export default ProfilePage
