'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { AnimatedButton } from '@/components/ui/animated-button'
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
import { getMyProfile } from '@/services/profile'
import { useAuth } from '@/hooks/useAuth'
import { PATHS, VERIFY_OTP_MESSAGES } from '@/constants'
import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { triggerSuccessConfetti } from '@/lib/confetti'
import { Clock, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LazyLottie } from '@/components/shared/LazyLottie'

const formSchema = z.object({
	otp: z.string().min(6, { message: 'Your OTP must be 6 characters.' }),
})

// OTP expires after 10 minutes (from spec)
const OTP_EXPIRY_SECONDS = 10 * 60 // 600 seconds

/**
 * Format seconds into MM:SS display
 */
function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const VerifyOtpForm = () => {
	const router = useRouter()
	const t = useTranslations('auth')
	const searchParams = useSearchParams()
	const email = searchParams.get('email')
	const returnTo = searchParams.get('returnTo')
	const { login, setUser, setLoading } = useAuth()

	// Determine the redirect target after login
	// Only allow relative paths to prevent open redirect attacks
	const postLoginPath = returnTo && returnTo.startsWith('/') ? returnTo : '/dashboard'
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	// OTP Expiry countdown
	const [timeRemaining, setTimeRemaining] = useState(OTP_EXPIRY_SECONDS)
	const [isExpired, setIsExpired] = useState(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { otp: '' },
	})

	// Start/restart the countdown timer
	const startTimer = useCallback(() => {
		// Clear any existing timer
		if (timerRef.current) {
			clearInterval(timerRef.current)
		}

		setTimeRemaining(OTP_EXPIRY_SECONDS)
		setIsExpired(false)
		setError(null)

		timerRef.current = setInterval(() => {
			setTimeRemaining(prev => {
				if (prev <= 1) {
					// Time's up
					clearInterval(timerRef.current!)
					setIsExpired(true)
					return 0
				}
				return prev - 1
			})
		}, 1000)
	}, [])

	// Initialize timer on mount
	useEffect(() => {
		if (email) {
			startTimer()
		}
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}
	}, [email, startTimer])

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		// Don't allow submission if expired
		if (isExpired) {
			toast.error(t('expiredResend'))
			return
		}

		if (!email) {
			const errorMsg = VERIFY_OTP_MESSAGES.EMAIL_NOT_FOUND
			setError(errorMsg)
			toast.error(errorMsg)
			return
		}

		const response = await verifyOtp({ email, otp: values.otp })

		if (response.success) {
			// Stop the timer
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}

			setSuccess(VERIFY_OTP_MESSAGES.VERIFICATION_SUCCESS)
			setError(null)
			triggerSuccessConfetti()

			// Auto-login: extract tokens and sign in immediately
			const payload = response.data
			if (payload?.accessToken) {
				login(payload.accessToken)

				const profileResponse = await getMyProfile()
				if (profileResponse.success && profileResponse.data) {
					setUser(profileResponse.data)
					toast.success(
						'Welcome to ChefKix! Let\u2019s get cooking \uD83C\uDF89',
					)
					setLoading(true)
					router.push(postLoginPath)
					return
				}
			}

			// Fallback: if auto-login fails, redirect to sign-in with pre-filled email
			toast.success('Email verified! Just enter your password to jump in.')
			if (email) {
				sessionStorage.setItem('verified-email', email)
				sessionStorage.setItem('just-registered', 'true')
			}
			router.push(PATHS.AUTH.SIGN_IN)
		} else {
			const errorMsg = response.message || VERIFY_OTP_MESSAGES.INVALID_OTP
			setError(errorMsg)
			setSuccess(null)
			toast.error(errorMsg)
		}
	}

	const handleResendOtp = async () => {
		if (!email) {
			const errorMsg = VERIFY_OTP_MESSAGES.EMAIL_NOT_FOUND_FOR_RESEND
			setError(errorMsg)
			toast.error(errorMsg)
			return
		}
		const response = await resendOtp({ email })
		if (response.success) {
			const successMsg = VERIFY_OTP_MESSAGES.RESEND_SUCCESS
			setSuccess(null)
			setError(null)
			toast.success(successMsg)
			// Restart the timer on successful resend
			startTimer()
			// Clear the OTP input
			form.reset()
		} else {
			const errorMsg = response.message || VERIFY_OTP_MESSAGES.RESEND_FAILED
			setError(errorMsg)
			setSuccess(null)
			toast.error(errorMsg)
		}
	}

	// No email = redirect to sign up (don't show error, just redirect)
	useEffect(() => {
		if (!email) {
			toast.error(t('signUpFirst'))
			router.push(PATHS.AUTH.SIGN_UP)
		}
	}, [email, router])

	// While redirecting due to no email, show nothing
	if (!email) {
		return null
	}

	// Calculate urgency styling
	const isUrgent = timeRemaining <= 60 && !isExpired // Last minute
	const timerColor = isExpired
		? 'text-destructive'
		: isUrgent
			? 'text-streak animate-pulse'
			: 'text-text-secondary'

	return (
		<div className='rounded-lg bg-bg-card p-8 shadow-card'>
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
						<span className='text-sm font-medium'>
						{t('codeExpired')}
						</span>
					</>
				) : (
					<>
						<Clock className='size-4' />
						<span className='text-sm font-medium'>
						{t('codeExpiresIn', { time: formatTime(timeRemaining) })}
						</span>
					</>
				)}
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='mt-6 space-y-6'>
					<FormField
						control={form.control}
						name='otp'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('otpLabel')}</FormLabel>
								<FormControl>
									<div className='flex justify-center'>
										<InputOTP maxLength={6} {...field} disabled={isExpired}>
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
						disabled={isExpired}
						shine={!isExpired}
					>
						{isExpired ? t('codeExpiredBtn') : t('verifyEmailBtn')}
					</AnimatedButton>
				</form>
			</Form>
			<div className='mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary'>
				<span>
					{isExpired ? t('getNewCode') : t('didntReceive')}
				</span>
				<ResendOtpButton onResend={handleResendOtp} />
			</div>
		</div>
	)
}
