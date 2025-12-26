'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getProfileByUserId } from '@/services/profile'
import { useAuthStore } from '@/store/authStore'
import { UserProfile } from '@/components/profile/UserProfile'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { ProfileNotFound } from '@/components/profile/ProfileNotFound'
import { Profile } from '@/lib/types'

/**
 * Dynamic profile page at /{userId}
 * Supports ?tab= query param to navigate directly to a tab (recipes, posts, cooking, saved)
 * Must be a client component to access auth store for token in API calls.
 */
const ProfilePage = () => {
	const params = useParams()
	const searchParams = useSearchParams()
	const userId = params.userId as string
	const initialTab = searchParams.get('tab') || undefined
	const { user: currentUser, isLoading: isAuthLoading } = useAuthStore()

	const [profile, setProfile] = useState<Profile | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [notFound, setNotFound] = useState(false)

	useEffect(() => {
		// Wait for auth to hydrate before making API calls
		if (isAuthLoading) return

		const fetchProfile = async () => {
			setIsLoading(true)
			setNotFound(false)

			const { success, data } = await getProfileByUserId(userId)

			if (success && data) {
				setProfile(data)
			} else {
				setNotFound(true)
			}

			setIsLoading(false)
		}

		if (userId) {
			fetchProfile()
		}
	}, [userId, isAuthLoading])

	if (isLoading || isAuthLoading) {
		return <UserProfileSkeleton />
	}

	if (notFound || !profile) {
		return <ProfileNotFound />
	}

	return (
		<UserProfile
			profile={profile}
			currentUserId={currentUser?.userId}
			initialTab={initialTab}
		/>
	)
}

export default ProfilePage
