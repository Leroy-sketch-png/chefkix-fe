'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { ProfileNotFound } from '@/components/profile/ProfileNotFound'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
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
	const [componentError, setComponentError] = useState(false)
	const [componentLoadAttempt, setComponentLoadAttempt] = useState(0)
	const [isProfileComponentLoading, setIsProfileComponentLoading] =
		useState(true)

	useEffect(() => {
		let cancelled = false

		const fetchProfile = async () => {
			setIsLoading(true)
			setProfile(null)
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
		if (UserProfileComponent) return

		let cancelled = false
		setIsProfileComponentLoading(true)
		setComponentError(false)

		import('@/components/profile/UserProfile')
			.then(module => {
				if (!cancelled) {
					setUserProfileComponent(() => module.UserProfile)
				}
			})
			.catch(() => {
				if (!cancelled) {
					setComponentError(true)
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
	}, [UserProfileComponent, componentLoadAttempt])

	const handleRetry = () => {
		if (serverError) {
			setRetryCount(count => count + 1)
		}
		if (componentError) {
			setComponentLoadAttempt(count => count + 1)
		}
	}

	const isOwnProfile = profile?.userId === currentUser?.userId
	const showBackButton = Boolean(profile && isHydrated && !isOwnProfile)
	const hasTerminalError = serverError || componentError
	const isPending =
		!hasTerminalError &&
		!notFound &&
		(isLoading ||
			isProfileComponentLoading ||
			!profile ||
			!UserProfileComponent)

	let content

	if (isPending) {
		content = <UserProfileSkeleton />
	} else if (hasTerminalError) {
		content = (
			<div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center'>
				<p className='text-lg text-text-secondary'>{t('somethingWentWrong')}</p>
				<button
					type='button'
					onClick={handleRetry}
					className='rounded-lg bg-brand px-4 py-2 text-white transition-colors hover:bg-brand/90'
				>
					{t('tryAgain')}
				</button>
			</div>
		)
	} else if (notFound || !profile) {
		content = <ProfileNotFound />
	} else if (UserProfileComponent) {
		content = (
			<UserProfileComponent
				profile={profile}
				currentUserId={currentUser?.userId}
				initialTab={initialTab}
			/>
		)
	} else {
		content = <UserProfileSkeleton />
	}

	return (
		<ProfilePageShell>
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
			{content}
		</ProfilePageShell>
	)
}
