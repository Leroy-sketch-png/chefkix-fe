'use client'
import { useTranslations } from 'next-intl'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { ErrorState } from '@/components/ui/error-state'

const getTokenSubject = (token: string | null): string | null => {
	if (!token) return null

	try {
		const [, payload] = token.split('.')
		if (!payload) return null

		const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
		const decoded = JSON.parse(window.atob(padded)) as { sub?: string }
		return typeof decoded.sub === 'string' ? decoded.sub : null
	} catch {
		return null
	}
}

/**
 * /profile route - Redirects to the current user's profile page
 *
 * Since profiles are at /{userId}, this page uses the auth store to get
 * the current user's ID and redirects to their profile.
 * Must be a client component to access Zustand store (localStorage-persisted).
 */
const ProfilePage = () => {
	const router = useRouter()
	const t = useTranslations('profile')
	const { user, isAuthenticated, isLoading, accessToken } = useAuth()
	const [timedOut, setTimedOut] = useState(false)
	const targetUserId = user?.userId || getTokenSubject(accessToken)

	useEffect(() => {
		// Wait for auth state to hydrate from localStorage
		if (isLoading) return

		if (isAuthenticated && targetUserId) {
			// Redirect to user's own profile page
			router.replace(`/${targetUserId}`)
		} else {
			// Not authenticated - redirect to dashboard (which will handle auth)
			router.replace(PATHS.DASHBOARD)
		}
	}, [isAuthenticated, isLoading, targetUserId, router])

	// Safety timeout: if redirect hasn't happened after 5s, show error
	useEffect(() => {
		const timer = setTimeout(() => setTimedOut(true), 5000)
		return () => clearTimeout(timer)
	}, [])

	if (timedOut) {
		return (
			<div className='flex min-h-[50vh] items-center justify-center p-6'>
				<ErrorState
					title={t('couldNotLoadProfile')}
					message={t('profileLoadError')}
					onRetry={() => router.replace(PATHS.DASHBOARD)}
				/>
			</div>
		)
	}

	// Show skeleton while determining redirect destination
	return <UserProfileSkeleton />
}

export default ProfilePage
