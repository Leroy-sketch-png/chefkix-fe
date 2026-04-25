'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PATHS } from '@/constants'
import {
	clearGoogleSignInSession,
	consumeGoogleSignInSession,
} from '@/lib/keycloak-sso'
import { googleSignIn } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { getMyProfile } from '@/services/profile'

const GoogleCallbackContent = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const t = useTranslations('auth')
	const { login, setUser, logout, setLoading } = useAuth()

	useEffect(() => {
		let cancelled = false

		const buildSignInUrl = (message: string, returnTo?: string | null) => {
			const params = new URLSearchParams({ error: message })
			if (returnTo && returnTo.startsWith('/')) {
				params.set('returnTo', returnTo)
			}
			return `${PATHS.AUTH.SIGN_IN}?${params.toString()}`
		}

		const exchangeCode = async () => {
			try {
				const error = searchParams.get('error')
				const errorDescription = searchParams.get('error_description')
				const code = searchParams.get('code')
				const state = searchParams.get('state')

				if (error) {
					clearGoogleSignInSession()
					if (!cancelled) {
						router.replace(
							buildSignInUrl(errorDescription || t('googleSignInFailed')),
						)
					}
					return
				}

				if (!code || !state) {
					clearGoogleSignInSession()
					if (!cancelled) {
						router.replace(buildSignInUrl(t('googleStateInvalid')))
					}
					return
				}

				const session = consumeGoogleSignInSession(state)
				if (!session) {
					if (!cancelled) {
						router.replace(buildSignInUrl(t('googleStateInvalid')))
					}
					return
				}

				const response = await googleSignIn({
					code,
					redirectUri: session.redirectUri,
					codeVerifier: session.codeVerifier,
				})
				clearGoogleSignInSession()

				if (!response.success || !response.data?.accessToken) {
					if (!cancelled) {
						router.replace(
							buildSignInUrl(
								response.message || t('googleSignInFailed'),
								session.returnTo,
							),
						)
					}
					return
				}

				login(response.data.accessToken)
				const profileResponse = await getMyProfile()

				if (profileResponse.success && profileResponse.data) {
					setUser(profileResponse.data)
					setLoading(true)
					if (!cancelled) {
						router.replace(session.returnTo || PATHS.DASHBOARD)
					}
					return
				}

				logout()
				if (!cancelled) {
					router.replace(
						buildSignInUrl(t('errorProfileFetchFailed'), session.returnTo),
					)
				}
			} catch {
				clearGoogleSignInSession()
				if (!cancelled) {
					router.replace(buildSignInUrl(t('googleSignInFailed')))
				}
			}
		}

		void exchangeCode()

		return () => {
			cancelled = true
		}
	}, [router, searchParams, t, login, setUser, logout, setLoading])

	return (
		<div className='flex min-h-screen flex-col items-center justify-center'>
			<p className='text-lg font-semibold'>{t('signingInGoogle')}</p>
			<p className='mt-2 text-sm text-text-secondary'>
				{t('redirectingShortly')}
			</p>
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
