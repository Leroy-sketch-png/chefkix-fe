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
import { PATHS, VERIFY_OTP_MESSAGES } from '@/constants'
import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from '@/components/ui/toaster'
import { triggerSuccessConfetti } from '@/lib/confetti'
import { Clock, AlertTriangle } from 'lucide-react'
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
	const searchParams = useSearchParams()
	const email = searchParams.get('email')
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
			toast.error('Your code has expired. Please request a new one.')
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

			const successMsg = VERIFY_OTP_MESSAGES.VERIFICATION_SUCCESS
			setSuccess(successMsg)
			setError(null)
			triggerSuccessConfetti()
			toast.success(successMsg)

			// Redirect immediately - don't make users wait
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
			toast.error('Please sign up first to verify your email.')
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
		<div className='rounded-lg bg-bg-card p-8 shadow-md'>
			<h2 className='text-center text-2xl font-bold leading-tight text-text-primary'>
				Verify Your Email
			</h2>
			<p className='mt-2 text-center text-sm leading-normal text-text-secondary'>
				An OTP has been sent to <strong>{email}</strong>. Please enter it below.
			</p>

			{/* Countdown Timer */}
			<div
				className={`mt-4 flex items-center justify-center gap-2 ${timerColor}`}
			>
				{isExpired ? (
					<>
						<AlertTriangle className='size-4' />
						<span className='text-sm font-medium'>
							Code expired — please request a new one
						</span>
					</>
				) : (
					<>
						<Clock className='size-4' />
						<span className='text-sm font-medium'>
							Code expires in {formatTime(timeRemaining)}
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
								<FormLabel>One-Time Password</FormLabel>
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
									Enter the 6-digit code.
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
							<p className='text-center text-sm font-medium text-accent'>
								{success}
							</p>
						</div>
					)}
					<AnimatedButton
						type='submit'
						className='w-full'
						isLoading={form.formState.isSubmitting}
						loadingText='Verifying...'
						disabled={isExpired}
						shine={!isExpired}
					>
						{isExpired ? 'Code Expired' : 'Verify Email'}
					</AnimatedButton>
				</form>
			</Form>
			<div className='mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary'>
				<span>
					{isExpired ? 'Get a new code:' : "Didn't receive the code?"}
				</span>
				<ResendOtpButton onResend={handleResendOtp} />
			</div>
		</div>
	)
}
