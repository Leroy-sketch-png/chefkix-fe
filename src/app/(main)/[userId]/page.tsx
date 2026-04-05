'use client'
import { useTranslations } from 'next-intl'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProfileByUserId } from '@/services/profile'
import { useAuth } from '@/hooks/useAuth'
import { UserProfile } from '@/components/profile/UserProfile'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { ProfileNotFound } from '@/components/profile/ProfileNotFound'
import { PageTransition } from '@/components/layout/PageTransition'
import { Profile } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Dynamic profile page at /{userId}
 * Supports ?tab= query param to navigate directly to a tab (recipes, posts, cooking, saved)
 * Must be a client component to access auth store for token in API calls.
 */
const ProfileContent = () => {
	const params = useParams()
	const searchParams = useSearchParams()
	const router = useRouter()
	const userId = params.userId as string
	const t = useTranslations('profile')
	const initialTab = searchParams.get('tab') || undefined
	const { user: currentUser, isLoading: isAuthLoading } = useAuth()

	const [profile, setProfile] = useState<Profile | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [notFound, setNotFound] = useState(false)
	const [serverError, setServerError] = useState(false)
	const [retryCount, setRetryCount] = useState(0)

	useEffect(() => {
		// Wait for auth to hydrate before making API calls
		if (isAuthLoading) return

		let cancelled = false

		const fetchProfile = async () => {
			setIsLoading(true)
			setNotFound(false)
			setServerError(false)

			const response = await getProfileByUserId(userId)

			if (cancelled) return

			if (response.success && response.data) {
				setProfile(response.data)
			} else if (response.statusCode === 404) {
				setNotFound(true)
			} else {
				setServerError(true)
				toast.error(t('failedToLoadProfile'))
			}

			setIsLoading(false)
		}

		if (userId) {
			fetchProfile()
		}
		return () => {
			cancelled = true
		}
	}, [userId, isAuthLoading, retryCount])

	if (isLoading || isAuthLoading) {
		return <UserProfileSkeleton />
	}

	if (serverError) {
		return (
			<div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center'>
				<p className='text-lg text-text-secondary'>
					{t('somethingWentWrong')}
				</p>
				<button
					type='button'
					onClick={() => setRetryCount(c => c + 1)}
					className='rounded-lg bg-brand px-4 py-2 text-white transition-colors hover:bg-brand/90'
				>
					{t('tryAgain')}
				</button>
			</div>
		)
	}

	if (notFound || !profile) {
		return <ProfileNotFound />
	}

	return (
		<>
			<div className='mx-auto w-full max-w-container-xl pt-4'>
				<button

					type='button'

					onClick={() => router.back()}
					className='flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
					aria-label='Go back'
				>
					<ArrowLeft className='size-4' />
					<span>{t('back')}</span>
				</button>
			</div>
			<UserProfile
				profile={profile}
				currentUserId={currentUser?.userId}
				initialTab={initialTab}
			/>
		</>
	)
}

export default function ProfilePage() {
	return (
		<PageTransition>
			<Suspense fallback={<UserProfileSkeleton />}>
				<ProfileContent />
			</Suspense>
		</PageTransition>
	)
}
