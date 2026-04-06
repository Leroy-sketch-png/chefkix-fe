'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { googleSignIn } from '@/services/auth'
import { getMyProfile } from '@/services/profile'
import { PATHS } from '@/constants'
import { logDevError } from '@/lib/dev-log'

const GoogleCallbackContent = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const t = useTranslations('auth')
	const { login, setUser } = useAuth()

	useEffect(() => {
		const code = searchParams.get('code')
		const error = searchParams.get('error')

		if (error) {
			// Handle error: redirect to sign-in with an error message
			logDevError(`Google OAuth Error: ${error}`)
			router.push(
				`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent('Google sign-in failed.')}`,
			)
			return
		}

		if (code) {
			const exchangeCodeForToken = async () => {
				const response = await googleSignIn({ code })
				if (response.success && response.data) {
					// Backend returns only accessToken - validate it exists
					if (!response.data.accessToken) {
						router.push(
							`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(t('noAccessToken'))}`,
						)
						return
					}

					// Set the token first (without user)
					login(response.data.accessToken)

					// Then fetch the user profile
					const profileResponse = await getMyProfile()
					if (profileResponse.success && profileResponse.data) {
						setUser(profileResponse.data)
						router.push(PATHS.HOME)
					} else {
						router.push(
							`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(t('profileFetchFailed'))}`,
						)
					}
				} else {
					// Handle failure: redirect to sign-in with an error message
					const errorMessage =
						response.message || 'Google sign-in failed.'
					router.push(
						`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(errorMessage)}`,
					)
				}
			}

			exchangeCodeForToken()
		} else {
			// Fallback if no code or error is present
			router.push(
				`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent('An unexpected error occurred. Please try again later.')}`,
			)
		}
	}, [searchParams, router, login, setUser, t])

	return (
		<div className='flex min-h-screen flex-col items-center justify-center'>
			<p className='text-lg font-semibold'>{t('signingInGoogle')}</p>
			<p className='mt-2 text-sm text-text-secondary'>
				{t('redirectingShortly')}
			</p>
			{/* You can add a spinner here */}
		</div>
	)
}

export default function GoogleCallbackPage() {
	return (
		<Suspense
			fallback={
				<div className='flex min-h-screen flex-col items-center justify-center'>
					<div className='size-8 animate-spin rounded-full border-4 border-brand border-t-transparent' />
				</div>
			}
		>
			<GoogleCallbackContent />
		</Suspense>
	)
}
