'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { googleSignIn } from '@/services/auth'
import { AUTH_MESSAGES, PATHS } from '@/constants'

const GoogleCallbackPage = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { login } = useAuth()

	useEffect(() => {
		const code = searchParams.get('code')
		const error = searchParams.get('error')

		if (error) {
			// Handle error: redirect to sign-in with an error message
			console.error(`Google OAuth Error: ${error}`)
			router.push(
				`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(AUTH_MESSAGES.GOOGLE_SIGN_IN_FAILED)}`,
			)
			return
		}

		if (code) {
			const exchangeCodeForToken = async () => {
				const response = await googleSignIn({ code })
				if (response.success && response.data) {
					login(response.data.user, response.data.token)
					router.push(PATHS.HOME)
				} else {
					// Handle failure: redirect to sign-in with an error message
					const errorMessage =
						response.message || AUTH_MESSAGES.GOOGLE_SIGN_IN_FAILED
					router.push(
						`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(errorMessage)}`,
					)
				}
			}

			exchangeCodeForToken()
		} else {
			// Fallback if no code or error is present
			router.push(
				`${PATHS.AUTH.SIGN_IN}?error=${encodeURIComponent(AUTH_MESSAGES.UNKNOWN_ERROR)}`,
			)
		}
	}, [searchParams, router, login])

	return (
		<div className='flex min-h-screen flex-col items-center justify-center'>
			<p className='text-lg font-semibold'>Signing in with Google...</p>
			<p className='mt-2 text-sm text-muted-foreground'>
				Please wait, you will be redirected shortly.
			</p>
			{/* You can add a spinner here */}
		</div>
	)
}

export default GoogleCallbackPage
