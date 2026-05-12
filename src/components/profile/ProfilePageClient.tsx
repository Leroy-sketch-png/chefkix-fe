'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { ProfileNotFound } from '@/components/profile/ProfileNotFound'
import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/lib/types'

type UserProfileComponentProps = {
	profile: Profile
	currentUserId?: string
	initialTab?: string
}

export function ProfilePageClient() {
	const params = useParams()
	const searchParams = useSearchParams()
	const router = useRouter()
	const userId = params.userId as string
	const t = useTranslations('profile')
	const initialTab = searchParams.get('tab') || undefined
	const { user: currentUser, isHydrated } = useAuth()

	const [profile, setProfile] = useState<Profile | null>(null)
	const [UserProfileComponent, setUserProfileComponent] =
		useState<ComponentType<UserProfileComponentProps> | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [notFound, setNotFound] = useState(false)
	const [serverError, setServerError] = useState(false)
	const [retryCount, setRetryCount] = useState(0)
	const [isProfileComponentLoading, setIsProfileComponentLoading] =
		useState(false)

	useEffect(() => {
		let cancelled = false

		const fetchProfile = async () => {
			setIsLoading(true)
			setNotFound(false)
			setServerError(false)

			try {
				const { getProfileByUserId } = await import('@/services/profile')
				const response = await getProfileByUserId(userId)

				if (cancelled) return

				if (response.success && response.data) {
					setProfile(response.data)
				} else if (response.statusCode === 404) {
					setNotFound(true)
				} else {
					setServerError(true)
				}
			} catch {
				if (!cancelled) {
					setServerError(true)
				}
			}

			if (!cancelled) {
				setIsLoading(false)
			}
		}

		if (userId) {
			fetchProfile()
		}

		return () => {
			cancelled = true
		}
	}, [userId, retryCount])

	useEffect(() => {
		if (!profile || UserProfileComponent) return

		let cancelled = false
		setIsProfileComponentLoading(true)

		import('@/components/profile/UserProfile')
			.then(module => {
				if (!cancelled) {
					setUserProfileComponent(() => module.UserProfile)
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsProfileComponentLoading(false)
				}
			})

		return () => {
			cancelled = true
		}
	}, [profile, UserProfileComponent])

	if (isLoading) {
		return <UserProfileSkeleton />
	}

	if (serverError) {
		return (
			<div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center'>
				<p className='text-lg text-text-secondary'>{t('somethingWentWrong')}</p>
				<button
					type='button'
					onClick={() => setRetryCount(count => count + 1)}
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

	const isOwnProfile = profile.userId === currentUser?.userId
	const showBackButton = isHydrated && !isOwnProfile

	return (
		<div className='min-h-screen bg-bg'>
			<div className='mx-auto w-full max-w-container-xl px-4 py-4 md:px-6 lg:px-8'>
				{showBackButton ? (
					<div className='mb-4'>
						<button
							type='button'
							onClick={() => router.back()}
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text-secondary shadow-card transition-colors hover:bg-bg-elevated hover:text-text-primary'
							aria-label={t('ariaGoBack')}
						>
							<ArrowLeft className='size-4' />
							<span>{t('back')}</span>
						</button>
					</div>
				) : null}
				{UserProfileComponent && !isProfileComponentLoading ? (
					<UserProfileComponent
						profile={profile}
						currentUserId={currentUser?.userId}
						initialTab={initialTab}
					/>
				) : (
					<UserProfileSkeleton />
				)}
			</div>
		</div>
	)
}
