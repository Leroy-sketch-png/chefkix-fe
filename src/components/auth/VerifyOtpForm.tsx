'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AnimatedButton } from '@/components/ui/animated-button'
import { PasswordInput } from '@/components/ui/password-input'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { ResendOtpButton } from '@/components/ui/resend-otp-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { resendOtp, verifyOtp } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { triggerSuccessConfetti } from '@/lib/confetti'
import { Clock, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LazyLottie } from '@/components/shared/LazyLottie'
import { finalizeAuthSession } from '@/lib/auth-session'
import {
	clearOtpDeliveryTiming,
	isOtpDeliveryTiming,
	readOtpDeliveryTiming,
	saveOtpDeliveryTiming,
} from '@/lib/otp-delivery'
import type { OtpDeliveryTiming } from '@/lib/types'

function createOtpSchema(t: (key: string) => string) {
	return z
		.object({
			otp: z.string().length(6, { message: t('validationOtpExact') }),
			password: z.string().min(8, { message: t('validationNewPasswordMin') }),
			confirmPassword: z.string(),
		})
		.refine(values => values.password === values.confirmPassword, {
			message: t('passwordsDoNotMatch'),
			path: ['confirmPassword'],
		})
}

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const VerifyOtpForm = () => {
	const router = useRouter()
	const t = useTranslations('auth')
	const formSchema = useMemo(() => createOtpSchema(t), [t])
	const searchParams = useSearchParams()
	const email = searchParams.get('email')
	const returnTo = searchParams.get('returnTo')
	const { login, setUser } = useAuth()

	// Determine the redirect target after login
	// Only allow relative paths to prevent open redirect attacks
	const postLoginPath =
		returnTo && returnTo.startsWith('/') ? returnTo : '/dashboard'
	const signInPath =
		returnTo && returnTo.startsWith('/')
			? `${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(returnTo)}`
			: PATHS.AUTH.SIGN_IN
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const [delivery, setDelivery] = useState<OtpDeliveryTiming | null>(null)
	const [now, setNow] = useState(() => Date.now())

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { otp: '', password: '', confirmPassword: '' },
	})

	useEffect(() => {
		setDelivery(email ? readOtpDeliveryTiming(email) : null)
		setNow(Date.now())
	}, [email])

	const timeRemaining = delivery
		? Math.max(0, Math.ceil((Date.parse(delivery.expiresAt) - now) / 1000))
		: null
	const isExpired = timeRemaining === 0

	useEffect(() => {
		if (!delivery || Date.parse(delivery.expiresAt) <= Date.now()) return
		const interval = window.setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(interval)
	}, [delivery])

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!email) {
			const errorMsg = t('emailNotFound')
			setError(errorMsg)
			return
		}

		const response = await verifyOtp({
			email,
			otp: values.otp,
			password: values.password,
		})

		if (response.success) {
			clearOtpDeliveryTiming(email)
			setSuccess(t('verificationSuccess'))
			setError(null)
			triggerSuccessConfetti()

			// Auto-login: extract tokens and sign in immediately
			const payload = response.data
			if (payload?.accessToken) {
				const profileResponse = await finalizeAuthSession(payload.accessToken, {
					login,
					setUser,
				})
				if (profileResponse.success && profileResponse.data) {
					toast.success(t('toastWelcomeNew'))
					router.push(postLoginPath)
					return
				}
			}

			// Fallback: if auto-login fails, redirect to sign-in with pre-filled email
			toast.success(t('toastEmailVerified'))
			if (email) {
				sessionStorage.setItem('verified-email', email)
				sessionStorage.setItem('just-registered', 'true')
			}
			router.push(signInPath)
		} else {
			const errorMsg = t('invalidOtp')
			setError(errorMsg)
			setSuccess(null)
		}
	}

	const handleResendOtp = async (): Promise<OtpDeliveryTiming | null> => {
		if (!email) {
			const errorMsg = t('emailNotFoundForResend')
			setError(errorMsg)
			return null
		}
		const response = await resendOtp({ email })
		if (response.success && isOtpDeliveryTiming(response.data)) {
			const successMsg = t('resendSuccess')
			setSuccess(null)
			setError(null)
			toast.success(successMsg)
			saveOtpDeliveryTiming(email, response.data)
			setDelivery(response.data)
			setNow(Date.now())
			form.resetField('otp')
			return response.data
		} else {
			const errorMsg = t('resendFailed')
			setError(errorMsg)
			setSuccess(null)
			return null
		}
	}

	// No email = redirect to sign up (don't show error, just redirect)
	useEffect(() => {
		if (!email) {
			toast.error(t('signUpFirst'))
			router.push(PATHS.AUTH.SIGN_UP)
		}
	}, [email, router, t])

	// While redirecting due to no email, show nothing
	if (!email) {
		return null
	}

	// Calculate urgency styling
	const isUrgent = timeRemaining !== null && timeRemaining <= 60 && !isExpired
	const timerColor = isExpired
		? 'text-destructive'
		: isUrgent
			? 'text-streak animate-pulse'
			: 'text-text-secondary'

	return (
		<div className='rounded-xl bg-bg-card p-8 shadow-card'>
			<h2 className='text-center text-2xl font-bold leading-tight text-text-primary'>
				{t('verifyEmail')}
			</h2>
			<p className='mt-2 text-center text-sm leading-normal text-text-secondary'>
				{t('otpSentTo', { email })}
			</p>

			{/* Countdown Timer */}
			<div
				className={`mt-4 flex items-center justify-center gap-2 ${timerColor}`}
			>
				{isExpired ? (
					<>
						<AlertTriangle className='size-4' />
						<span className='text-sm font-medium'>{t('codeExpired')}</span>
					</>
				) : timeRemaining !== null ? (
					<>
						<Clock className='size-4' />
						<span className='text-sm font-medium'>
							{t('codeExpiresIn', { time: formatTime(timeRemaining) })}
						</span>
					</>
				) : (
					<>
						<Clock className='size-4' />
						<span className='text-sm font-medium'>
							{t('codeValidityServerManaged')}
						</span>
					</>
				)}
			</div>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className='mt-6 space-y-6'
					noValidate
				>
					<FormField
						control={form.control}
						name='otp'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('otpLabel')}</FormLabel>
								<FormControl>
									<div className='flex justify-center'>
										<InputOTP maxLength={6} {...field}>
											<InputOTPGroup>
												<InputOTPSlot index={0} />
												<InputOTPSlot index={1} />
												<InputOTPSlot index={2} />
												<InputOTPSlot index={3} />
												<InputOTPSlot index={4} />
												<InputOTPSlot index={5} />
											</InputOTPGroup>
										</InputOTP>
									</div>
								</FormControl>
								<FormDescription className='text-center'>
									{t('otpDescription')}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className='space-y-1'>
						<p className='text-sm font-semibold text-text-primary'>
							{t('secureAccountTitle')}
						</p>
						<p className='text-xs leading-normal text-text-secondary'>
							{t('secureAccountDescription')}
						</p>
					</div>
					<FormField
						control={form.control}
						name='password'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('password')}</FormLabel>
								<FormControl>
									<PasswordInput
										placeholder={t('createSecurePassword')}
										autoComplete='new-password'
										{...field}
									/>
								</FormControl>
								<FormDescription>{t('passwordHint')}</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='confirmPassword'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('confirmPassword')}</FormLabel>
								<FormControl>
									<PasswordInput
										placeholder={t('confirmPasswordPlaceholder')}
										autoComplete='new-password'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{error && (
						<p className='text-sm font-medium text-destructive'>{error}</p>
					)}
					{success && (
						<div className='space-y-3'>
							<div className='flex justify-center'>
								<LazyLottie
									src='/lottie/lottie-email-verified-success.json'
									sizeOfIllustrator={(w, h) => Math.min(w * 0.4, h * 0.4, 200)}
									entrance='scale'
									loop={false}
									autoplay
								/>
							</div>
							<p className='text-center text-sm font-medium text-success'>
								{success}
							</p>
						</div>
					)}
					<AnimatedButton
						type='submit'
						className='w-full'
						isLoading={form.formState.isSubmitting}
						loadingText={t('verifying')}
						shine
					>
						{t('verifyAndCreateAccount')}
					</AnimatedButton>
				</form>
			</Form>
			<div className='mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary'>
				<span>{isExpired ? t('getNewCode') : t('didntReceive')}</span>
				<ResendOtpButton
					onResend={handleResendOtp}
					resendAvailableAt={delivery?.resendAvailableAt}
				/>
			</div>
		</div>
	)
}
