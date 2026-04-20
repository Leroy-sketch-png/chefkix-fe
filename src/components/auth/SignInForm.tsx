'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { AnimatedButton } from '@/components/ui/animated-button'
import { DividerOr } from '@/components/ui/divider-or'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { ApiResponse, LoginSuccessResponse } from '@/lib/types'
import { signIn } from '@/services/auth'
import { getMyProfile } from '@/services/profile'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { toast } from 'sonner'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { useTranslations } from '@/i18n/hooks'
import { startGoogleSignIn } from '@/lib/keycloak-sso'
import { logDevError } from '@/lib/dev-log'

function createFormSchema(t: (key: string) => string) {
	return z.object({
		emailOrUsername: z
			.string()
			.min(3, { message: t('validationEmailOrUsernameMin') }),
		password: z.string().min(6, {
			message: t('validationPasswordMin'),
		}),
	})
}

function createAuthErrorMap(
	t: (key: string) => string,
): Record<string, string> {
	return {
		'Invalid credentials': t('errorInvalidCredentials'),
		'User not found': t('errorUserNotFound'),
		'Account locked': t('errorAccountLocked'),
		'Account disabled': t('errorAccountDisabled'),
		'Email not verified': t('errorEmailNotVerified'),
		'Too many attempts': t('errorTooManyAttempts'),
		'Network Error': t('errorNetworkError'),
	}
}

function getReadableErrorMessage(
	message: string,
	errorMap: Record<string, string>,
	fallback: string,
): string {
	for (const [key, value] of Object.entries(errorMap)) {
		if (message.toLowerCase().includes(key.toLowerCase())) {
			return value
		}
	}
	if (!message || message === 'An unknown error occurred.') {
		return fallback
	}
	return message
}

export function SignInForm() {
	const { login, setUser, logout, setLoading } = useAuth()
	const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
	// Separate loading state for the button - form.isSubmitting doesn't track async properly
	const [isSubmitting, setIsSubmitting] = useState(false)
	const t = useTranslations('auth')
	const formSchema = useMemo(() => createFormSchema(t), [t])
	const authErrorMap = useMemo(() => createAuthErrorMap(t), [t])
	const [verifiedEmail] = useState(() =>
		typeof window !== 'undefined'
			? sessionStorage.getItem('verified-email')
			: null,
	)
	const [isNewSignup] = useState(
		() =>
			typeof window !== 'undefined' &&
			sessionStorage.getItem('just-registered') === 'true',
	)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			emailOrUsername: verifiedEmail || '',
			password: '',
		},
	})
	const router = useRouter()
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	const oauthError = searchParams.get('error')

	// Determine the redirect target after login
	// Only allow relative paths to prevent open redirect attacks
	const postLoginPath =
		returnTo && returnTo.startsWith('/') ? returnTo : '/dashboard'

	useEffect(() => {
		if (verifiedEmail) {
			sessionStorage.removeItem('verified-email')
		}
		if (isNewSignup) {
			sessionStorage.removeItem('just-registered')
		}
	}, [verifiedEmail, isNewSignup])

	useEffect(() => {
		if (!oauthError) {
			return
		}

		form.setError('root', {
			type: 'manual',
			message: oauthError,
		})
		toast.error(oauthError)
	}, [oauthError, form])

	async function handleSuccessfulLogin(
		response: ApiResponse<LoginSuccessResponse>,
	): Promise<boolean> {
		// Correctly access the nested 'data' property from the standardized ApiResponse
		const payload = response.data
		if (!payload?.accessToken) {
			const errorMsg = t('errorNoAccessToken')
			form.setError('root', {
				type: 'manual',
				message: errorMsg,
			})
			toast.error(errorMsg)
			return false
		}

		// Per the API spec, login returns a token. Set it, then fetch the user profile.
		login(payload.accessToken)

		const profileResponse = await getMyProfile()
		if (profileResponse.success && profileResponse.data) {
			setUser(profileResponse.data)
			if (isNewSignup) {
				toast.success(t('toastWelcomeNew'))
				router.push(postLoginPath)
			} else {
				toast.success(t('toastWelcomeBack'))
				router.push(postLoginPath)
			}
			return true
		} else {
			// Profile fetch failed - logout completely and show error
			logout()
			const errorMsg = t('errorProfileFetchFailed')
			form.setError('root', {
				type: 'manual',
				message: errorMsg,
			})
			toast.error(errorMsg)
			return false
		}
	}

	async function onSubmit(values: z.infer<typeof formSchema>) {
		// Clear previous errors
		form.clearErrors()
		setIsSubmitting(true)

		try {
			const response = await signIn({
				emailOrUsername: values.emailOrUsername,
				password: values.password,
			})

			if (response.success) {
				const success = await handleSuccessfulLogin(response)
				if (!success) {
					// Login failed after initial success - button should stop spinning
					setIsSubmitting(false)
				}
				// If success, keep spinner going until redirect happens
			} else {
				// Login failed - show user-friendly error
				const readableError = getReadableErrorMessage(
					response.message || '',
					authErrorMap,
					t('errorSignInFailed'),
				)
				form.setError('root', {
					type: 'manual',
					message: readableError,
				})
				toast.error(readableError)
				setIsSubmitting(false)
			}
		} catch (error) {
			// Unexpected error
			const errorMsg = t('errorUnexpected')
			form.setError('root', {
				type: 'manual',
				message: errorMsg,
			})
			toast.error(errorMsg)
			setIsSubmitting(false)
		}
	}

	return (
		<motion.div
			variants={staggerContainer}
			initial='hidden'
			animate='visible'
			className='w-full space-y-6'
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className='space-y-4'
					noValidate
				>
					{form.formState.errors.root?.message && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							className='rounded-xl bg-error/10 p-4 text-sm text-error'
							role='alert'
						>
							{form.formState.errors.root.message}
						</motion.div>
					)}
					<motion.div variants={staggerItem}>
						<FormField
							control={form.control}
							name='emailOrUsername'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>
										{t('emailOrUsername')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t('emailOrUsernamePlaceholder')}
											autoComplete='username'
											autoCapitalize='none'
											autoCorrect='off'
											spellCheck={false}
											{...field}
											className='h-12 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem}>
						<FormField
							control={form.control}
							name='password'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>{t('password')}</FormLabel>
									<FormControl>
										<PasswordInput
											placeholder={t('passwordPlaceholder')}
											autoComplete='current-password'
											{...field}
											className='h-12 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem} className='text-right text-sm'>
						<Button
							variant='link'
							type='button'
							onClick={() => setForgotPasswordOpen(true)}
							className='h-auto p-0 font-medium text-brand transition-colors hover:text-brand/80'
						>
							{t('forgotPassword')}
						</Button>
					</motion.div>
					<motion.div variants={staggerItem}>
						<AnimatedButton
							type='submit'
							className='h-11 w-full rounded-xl bg-brand text-base font-semibold text-white shadow-warm transition-all hover:bg-brand/90 hover:shadow-glow sm:h-12'
							isLoading={isSubmitting}
							loadingText={t('signingIn')}
						>
							{t('signIn')}
						</AnimatedButton>
					</motion.div>
					<motion.div variants={staggerItem} className='my-3 sm:my-4'>
						<DividerOr>{t('or')}</DividerOr>
					</motion.div>
					<motion.div variants={staggerItem}>
						<GoogleSignInButton
							text={t('google')}
							onClick={async () => {
								try {
									await startGoogleSignIn(returnTo)
								} catch (err) {
									logDevError('Google sign-in error:', err)
									const errorMessage = t('googleSignInFailedRetry')
									form.setError('root', {
										type: 'manual',
										message: errorMessage,
									})
									toast.error(errorMessage)
								}
							}}
						/>
					</motion.div>
				</form>
			</Form>
			<motion.div
				variants={staggerItem}
				className='text-center text-sm leading-normal text-text-secondary'
			>
				{t('noAccount')}{' '}
				<Link
					href={
						returnTo
							? `${PATHS.AUTH.SIGN_UP}?returnTo=${encodeURIComponent(returnTo)}`
							: PATHS.AUTH.SIGN_UP
					}
					className='font-semibold text-brand transition-colors hover:text-brand/80'
				>
					{t('createAccount')}
				</Link>
			</motion.div>
			<ForgotPasswordDialog
				open={forgotPasswordOpen}
				onOpenChange={setForgotPasswordOpen}
			/>
		</motion.div>
	)
}
