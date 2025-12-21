'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { AnimatedButton } from '@/components/ui/animated-button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { ApiResponse, LoginSuccessResponse } from '@/lib/types'
import { signIn, googleSignIn } from '@/services/auth'
import { getMyProfile } from '@/services/profile'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { SIGN_IN_MESSAGES } from '@/constants/messages'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { toast } from '@/components/ui/toaster'
import { staggerContainer, staggerItem } from '@/lib/motion'

const formSchema = z.object({
	emailOrUsername: z
		.string()
		.min(3, { message: 'Email or username must be at least 3 characters.' }),
	password: z.string().min(6, {
		message: 'Password must be at least 6 characters.',
	}),
})

// User-friendly error messages for common authentication failures
const AUTH_ERROR_MAP: Record<string, string> = {
	'Invalid credentials':
		'Incorrect email/username or password. Please try again.',
	'User not found': 'No account found with that email or username.',
	'Account locked': 'Your account has been locked. Please contact support.',
	'Account disabled': 'Your account has been disabled. Please contact support.',
	'Email not verified': 'Please verify your email before signing in.',
	'Too many attempts': 'Too many failed attempts. Please try again later.',
	'Network Error': 'Unable to connect to server. Please check your connection.',
}

function getReadableErrorMessage(message: string): string {
	// Check if we have a mapped error
	for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
		if (message.toLowerCase().includes(key.toLowerCase())) {
			return value
		}
	}
	// If no mapping found, return original or a generic message
	if (!message || message === 'An unknown error occurred.') {
		return 'Sign in failed. Please check your credentials and try again.'
	}
	return message
}

export function SignInForm() {
	const { login, setUser, logout, setLoading } = useAuth()
	const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
	// Separate loading state for the button - form.isSubmitting doesn't track async properly
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			emailOrUsername: '',
			password: '',
		},
	})

	async function handleSuccessfulLogin(
		response: ApiResponse<LoginSuccessResponse>,
	): Promise<boolean> {
		// Correctly access the nested 'data' property from the standardized ApiResponse
		const payload = response.data
		if (!payload || !payload.accessToken) {
			const errorMsg =
				'Authentication failed: no access token received from server.'
			form.setError('root.general' as any, {
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
			toast.success('Welcome back! Signed in successfully.')
			// Set loading AFTER everything is ready - AuthProvider will handle redirect
			setLoading(true)
			return true
		} else {
			// Profile fetch failed - logout completely and show error
			logout()
			const errorMsg =
				profileResponse.message ||
				'Login successful, but failed to fetch your profile. Please try again.'
			form.setError('root.general' as any, {
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
				const readableError = getReadableErrorMessage(response.message || '')
				form.setError('root.general' as any, {
					type: 'manual',
					message: readableError,
				})
				toast.error(readableError)
				setIsSubmitting(false)
			}
		} catch (error) {
			// Unexpected error
			const errorMsg = 'An unexpected error occurred. Please try again.'
			form.setError('root.general' as any, {
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
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
					{form.formState.errors.root?.general && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							className='rounded-xl bg-error/10 p-4 text-sm text-error'
							role='alert'
						>
							{(form.formState.errors.root.general as any).message}
						</motion.div>
					)}
					<motion.div variants={staggerItem}>
						<FormField
							control={form.control}
							name='emailOrUsername'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>Email or Username</FormLabel>
									<FormControl>
										<Input
											placeholder='yourname or test@example.com'
											{...field}
											className='h-12 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
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
									<FormLabel className='text-text'>Password</FormLabel>
									<FormControl>
										<PasswordInput
											placeholder='password'
											{...field}
											className='h-12 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
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
							{SIGN_IN_MESSAGES.FORGOT_PASSWORD}
						</Button>
					</motion.div>
					<motion.div variants={staggerItem}>
						<AnimatedButton
							type='submit'
							className='h-12 w-full rounded-xl bg-gradient-hero text-base font-bold shadow-lg shadow-brand/30 transition-shadow hover:shadow-xl hover:shadow-brand/40'
							isLoading={isSubmitting}
							loadingText='Signing in...'
							shine
						>
							Sign In
						</AnimatedButton>
					</motion.div>
					<motion.div
						variants={staggerItem}
						className='relative my-4 flex items-center'
					>
						<span className='flex-1 border-t border-border-subtle'></span>
						<span className='mx-4 text-xs leading-normal text-text-muted'>
							or
						</span>
						<span className='flex-1 border-t border-border-subtle'></span>
					</motion.div>
					<motion.div variants={staggerItem}>
						<GoogleSignInButton
							text='Sign in with Google'
							onSuccess={async code => {
								const response = await googleSignIn({ code })
								if (response.success) {
									await handleSuccessfulLogin(response)
								} else {
									const errorMessage =
										response.message || 'Google sign-in failed.'
									form.setError('root.general' as any, {
										type: 'manual',
										message: errorMessage,
									})
								}
							}}
							onFailure={error => {
								form.setError('root.general' as any, {
									type: 'manual',
									message: error.message || 'Google sign-in failed.',
								})
							}}
						/>
					</motion.div>
				</form>
			</Form>
			<motion.div
				variants={staggerItem}
				className='text-center text-sm leading-normal text-text-secondary'
			>
				{SIGN_IN_MESSAGES.NO_ACCOUNT}{' '}
				<Link
					href={PATHS.AUTH.SIGN_UP}
					className='font-semibold text-brand transition-colors hover:text-brand/80'
				>
					Create account
				</Link>
			</motion.div>
			<ForgotPasswordDialog
				open={forgotPasswordOpen}
				onOpenChange={setForgotPasswordOpen}
			/>
		</motion.div>
	)
}
