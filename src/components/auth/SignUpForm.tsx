'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { signUp, googleSignIn, checkUsernameAvailability } from '@/services/auth'
import { getMyProfile } from '@/services/profile'
import { PATHS } from '@/constants'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/i18n/hooks'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import { CheckCircle2, XCircle, Loader2, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const formSchema = z.object({
	firstName: z.string().min(1, {
		message: 'First name is required.',
	}),
	lastName: z.string().min(1, {
		message: 'Last name is required.',
	}),
	username: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
	email: z.string().email({ message: 'Invalid email address.' }),
	password: z.string().min(6, {
		message: 'Password must be at least 6 characters.',
	}),
})

export function SignUpForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	const { login, setUser, setLoading, logout } = useAuth()
	const t = useTranslations('auth')
	const [isSubmitting, setIsSubmitting] = useState(false)
	
	// Username availability check state
	const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
	const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null)

	// Password strength
	const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
		if (!pw) return { score: 0, label: '', color: '' }
		let score = 0
		if (pw.length >= 6) score++
		if (pw.length >= 10) score++
		if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
		if (/\d/.test(pw)) score++
		if (/[^A-Za-z0-9]/.test(pw)) score++
		if (score <= 1) return { score: 1, label: t('passwordWeak'), color: 'bg-error' }
		if (score <= 2) return { score: 2, label: t('passwordFair'), color: 'bg-warning' }
		if (score <= 3) return { score: 3, label: t('passwordGood'), color: 'bg-brand' }
		return { score: 4, label: t('passwordStrong'), color: 'bg-success' }
	}

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			username: '',
			email: '',
			password: '',
		},
	})

	// Watch username for live availability check
	const usernameValue = form.watch('username')
	const passwordValue = form.watch('password')
	const passwordStrength = getPasswordStrength(passwordValue)
	
	// Debounced username availability check
	useEffect(() => {
		// Clear any pending check
		if (usernameCheckTimeout.current) {
			clearTimeout(usernameCheckTimeout.current)
		}
		
		// Reset if username is too short
		if (!usernameValue || usernameValue.length < 2) {
			setUsernameStatus('idle')
			return
		}
		
		setUsernameStatus('checking')
		
		// Debounce: wait 500ms before checking
		usernameCheckTimeout.current = setTimeout(async () => {
			try {
				const response = await checkUsernameAvailability(usernameValue)
				if (response.success && response.data) {
					setUsernameStatus(response.data.available ? 'available' : 'taken')
				} else {
					setUsernameStatus('error')
				}
			} catch {
				setUsernameStatus('error')
			}
		}, 500)
		
		return () => {
			if (usernameCheckTimeout.current) {
				clearTimeout(usernameCheckTimeout.current)
			}
		}
	}, [usernameValue])

	async function onSubmit(values: z.infer<typeof formSchema>) {
		if (isSubmitting) return
		setIsSubmitting(true)

		try {
			const response = await signUp(values)

			if (response.success) {
				toast.success(
					t('accountCreatedCheckEmail'),
				)
				const otpUrl = `${PATHS.AUTH.VERIFY_OTP}?email=${encodeURIComponent(values.email)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`
				router.push(otpUrl)
				// Don't reset isSubmitting on success — navigation is async
			} else {
				if (response.error) {
					Object.keys(response.error).forEach(key => {
						const field = key as keyof z.infer<typeof formSchema>
						const message =
							response.error?.[field]?.join(', ') || t('signUpFormError')
						form.setError(field, {
							type: 'manual',
							message: message,
						})
					})
					toast.error(t('fixFormErrors'))
				} else {
					const errorMsg = response.message || t('signUpFailed')
					form.setError('root', {
						type: 'manual',
						message: errorMsg,
					})
					toast.error(errorMsg)
				}
				setIsSubmitting(false)
			}
		} catch {
			toast.error(t('unexpectedError'))
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
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
					<motion.div variants={staggerItem} className='grid grid-cols-2 gap-3'>
						<FormField
							control={form.control}
							name='firstName'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>{t('firstName')}</FormLabel>
									<FormControl>
										<Input
											placeholder={t('firstNamePlaceholder')}
											autoComplete='given-name'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='lastName'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>{t('lastName')}</FormLabel>
									<FormControl>
										<Input
											placeholder={t('lastNamePlaceholder')}
											autoComplete='family-name'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
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
							name='username'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>{t('username')}</FormLabel>
									<FormControl>
										<div className='relative'>
											<Input
												placeholder={t('usernamePlaceholder')}
												autoComplete='username'
												autoCapitalize='none'
												autoCorrect='off'
												spellCheck={false}
												{...field}
												className={cn(
													'h-11 rounded-xl border-border-medium bg-bg-elevated pr-10 text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20',
													usernameStatus === 'taken' && 'border-destructive focus:border-destructive focus:ring-destructive/20',
													usernameStatus === 'available' && 'border-success focus:border-success focus:ring-success/20',
												)}
											/>
								{/* Username availability indicator */}
								<div className='absolute right-3 top-1/2 -translate-y-1/2'>
									{usernameStatus === 'checking' && (
										<Loader2 className='size-4 animate-spin text-text-muted' />
									)}
									{usernameStatus === 'available' && (
										<CheckCircle2 className='size-4 text-success' />
									)}
									{usernameStatus === 'taken' && (
										<XCircle className='size-4 text-destructive' />
									)}
									{usernameStatus === 'error' && (
										<AlertCircle className='size-4 text-warning' />
									)}
								</div>
										</div>
									</FormControl>
								{usernameStatus === 'taken' && (
									<p className='text-xs text-destructive'>
										This username is already taken
									</p>
								)}
								{usernameStatus === 'available' && (
									<p className='text-xs text-success'>
										Username is available
									</p>
								)}
								{usernameStatus === 'error' && (
									<p className='text-xs text-warning'>
										Couldn&apos;t check availability - try signing up anyway
									</p>
								)}
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem}>
						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>{t('email')}</FormLabel>
									<FormControl>
										<Input
											placeholder={t('emailPlaceholder')}
											autoComplete='email'
											inputMode='email'
											autoCapitalize='none'
											autoCorrect='off'
											spellCheck={false}
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
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
											placeholder={t('createSecurePassword')}
											autoComplete='new-password'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
										/>
									</FormControl>
									{/* Password strength meter */}
									{passwordValue && (
										<div className='space-y-1.5'>
											<div className='flex gap-1'>
												{[1, 2, 3, 4].map(i => (
													<div
														key={i}
														className={cn(
															'h-1 flex-1 rounded-full transition-all duration-300',
															i <= passwordStrength.score
																? passwordStrength.color
																: 'bg-border-subtle',
														)}
													/>
												))}
											</div>
											<p className={cn(
												'text-xs font-medium',
												passwordStrength.score <= 1 ? 'text-error' :
												passwordStrength.score <= 2 ? 'text-warning' :
												passwordStrength.score <= 3 ? 'text-brand' : 'text-success',
											)}>
												{passwordStrength.label}
											</p>
										</div>
									)}
									{!passwordValue && (
										<div className='flex items-center gap-1.5 text-xs text-text-muted'>
											<Info className='size-3' />
									<span>{t('passwordHint')}</span>
										</div>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem}>
						<AnimatedButton
							type='submit'
							className='h-12 w-full rounded-xl bg-gradient-xp text-base font-bold shadow-card shadow-xp/30 transition-shadow hover:shadow-warm hover:shadow-xp/40'
							isLoading={isSubmitting}
							loadingText={t('creatingAccount')}
							shine
						>
							{t('getStarted')}
						</AnimatedButton>
					</motion.div>
					<motion.div
						variants={staggerItem}
						className='relative my-5 flex items-center'
					>
						<span className='flex-1 border-t border-border-subtle'></span>
						<span className='mx-4 text-xs leading-normal text-text-muted'>
							{t('or')}
						</span>
						<span className='flex-1 border-t border-border-subtle'></span>
					</motion.div>
					<motion.div variants={staggerItem} className='w-full'>
						<GoogleSignInButton
							onSuccess={async code => {
								const response = await googleSignIn({ code })
								if (response.success && response.data?.accessToken) {
									login(response.data.accessToken)
									const profileResponse = await getMyProfile()
									if (profileResponse.success && profileResponse.data) {
										setUser(profileResponse.data)
										toast.success(t('googleSignInSuccess'))
										setLoading(true)
										// Redirect to returnTo or let AuthProvider handle default
										if (returnTo && returnTo.startsWith('/')) {
											router.push(returnTo)
										} else {
											router.push('/dashboard')
										}
									} else {
										// Profile fetch failed - clean up auth state
										logout()
										toast.error(t('profileFetchFailed'))
									}
								} else {
									const errorMsg =
										response.message || t('googleSignInFailed')
								form.setError('root', {
										type: 'manual',
										message: errorMsg,
									})
									toast.error(errorMsg)
								}
							}}
							onFailure={error => {
								toast.error(t('googleSignInFailedRetry'))
								logDevError(error)
							}}
							text={t('signUpWithGoogle')}
						/>
					</motion.div>
				</form>
			</Form>
			<motion.div
				variants={staggerItem}
				className='text-center text-sm leading-normal text-text-secondary'
			>
				{t('hasAccount')}{' '}
				<Link
					href={returnTo ? `${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(returnTo)}` : PATHS.AUTH.SIGN_IN}
					className='font-semibold text-brand transition-colors hover:text-brand/80'
				>
					{t('signInLink')}
				</Link>
			</motion.div>
		</motion.div>
	)
}
