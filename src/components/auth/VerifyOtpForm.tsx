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
import { sendOtp, verifyOtp } from '@/services/auth'
import { PATHS, VERIFY_OTP_MESSAGES } from '@/constants'
import { useState } from 'react'
import { toast } from '@/components/ui/toaster'
import { triggerSuccessConfetti } from '@/lib/confetti'
import dynamic from 'next/dynamic'
import lottieEmailVerified from '@/../public/lottie/lottie-email-verified-success.json'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

const formSchema = z.object({
	otp: z.string().min(6, { message: 'Your OTP must be 6 characters.' }),
})

export const VerifyOtpForm = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const email = searchParams.get('email')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { otp: '' },
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!email) {
			const errorMsg = VERIFY_OTP_MESSAGES.EMAIL_NOT_FOUND
			setError(errorMsg)
			toast.error(errorMsg)
			return
		}

		const response = await verifyOtp({ email, otp: values.otp })

		if (response.success) {
			const successMsg = VERIFY_OTP_MESSAGES.VERIFICATION_SUCCESS
			setSuccess(successMsg)
			setError(null)
			triggerSuccessConfetti()
			toast.success(successMsg)
			setTimeout(() => {
				router.push(PATHS.AUTH.SIGN_IN)
			}, 2000)
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
		const response = await sendOtp({ email })
		if (response.success) {
			const successMsg = VERIFY_OTP_MESSAGES.RESEND_SUCCESS
			setSuccess(successMsg)
			setError(null)
			toast.success(successMsg)
		} else {
			const errorMsg = response.message || VERIFY_OTP_MESSAGES.RESEND_FAILED
			setError(errorMsg)
			setSuccess(null)
			toast.error(errorMsg)
		}
	}

	if (!email) {
		return (
			<div className='rounded-lg bg-card p-8 text-center shadow-md'>
				<h2 className='text-2xl font-bold text-destructive'>Error</h2>
				<p className='mt-4 text-foreground'>
					{VERIFY_OTP_MESSAGES.NO_EMAIL_PROVIDED}
				</p>
				<Button
					onClick={() => router.push(PATHS.AUTH.SIGN_UP)}
					className='mt-6'
				>
					Back to Sign Up
				</Button>
			</div>
		)
	}

	return (
		<div className='rounded-lg bg-bg-card p-8 shadow-md'>
			<h2 className='text-center text-2xl font-bold leading-tight text-text-primary'>
				Verify Your Email
			</h2>
			<p className='mt-2 text-center text-sm leading-normal text-text-secondary'>
				An OTP has been sent to <strong>{email}</strong>. Please enter it below.
			</p>
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
								<LottieAnimation
									lottie={lottieEmailVerified}
									sizeOfIllustrator={(w, h) => Math.min(w * 0.4, h * 0.4, 200)}
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
					>
						Verify Email
					</AnimatedButton>
				</form>
			</Form>
			<div className='mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary'>
				<span>Didn&apos;t receive the code?</span>
				<ResendOtpButton onResend={handleResendOtp} />
			</div>
		</div>
	)
}
