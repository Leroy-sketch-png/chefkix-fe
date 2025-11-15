'use client'

import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from '@/components/ui/toaster'
import { verifyOtpPassword, forgotPassword } from '@/services/auth'
import { RESET_PASSWORD_MESSAGES } from '@/constants/messages'
import { PATHS } from '@/constants'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'

const formSchema = z
	.object({
		otp: z.string().min(6, { message: 'Enter the 6-digit code.' }),
		newPassword: z.string().min(6, {
			message: 'Password must be at least 6 characters.',
		}),
		confirmPassword: z.string().min(6, {
			message: 'Password must be at least 6 characters.',
		}),
	})
	.refine(values => values.newPassword === values.confirmPassword, {
		message: 'Passwords do not match.',
		path: ['confirmPassword'],
	})

export const ResetPasswordForm = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const email = searchParams.get('email')

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			otp: '',
			newPassword: '',
			confirmPassword: '',
		},
	})

	const handleResend = async () => {
		if (!email) {
			toast.error(RESET_PASSWORD_MESSAGES.MISSING_EMAIL)
			return
		}

		const response = await forgotPassword({ email })
		if (response.success) {
			toast.success(RESET_PASSWORD_MESSAGES.RESEND_SUCCESS)
			return
		}

		toast.error(response.message || 'Failed to resend code.')
	}

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!email) {
			toast.error(RESET_PASSWORD_MESSAGES.MISSING_EMAIL)
			return
		}

		const response = await verifyOtpPassword({
			email,
			otp: values.otp,
			newPassword: values.newPassword,
		})

		if (response.success) {
			toast.success(RESET_PASSWORD_MESSAGES.SUCCESS)
			setTimeout(() => router.push(PATHS.AUTH.SIGN_IN), 1500)
			return
		}

		const errorMessage = response.message || 'Failed to update password.'
		form.setError('otp', { type: 'manual', message: errorMessage })
		toast.error(errorMessage)
	}

	if (!email) {
		return (
			<div className='rounded-lg bg-bg-card p-8 text-center shadow-md'>
				<p className='text-sm font-medium text-destructive'>
					{RESET_PASSWORD_MESSAGES.MISSING_EMAIL}
				</p>
				<Button
					className='mt-6'
					onClick={() => router.push(PATHS.AUTH.FORGOT_PASSWORD)}
				>
					Return to Forgot Password
				</Button>
			</div>
		)
	}

	return (
		<div className='w-full space-y-6'>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
					<FormField
						control={form.control}
						name='otp'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{RESET_PASSWORD_MESSAGES.OTP_LABEL}</FormLabel>
								<FormControl>
									<div className='flex justify-center'>
										<InputOTP maxLength={6} {...field}>
											<InputOTPGroup>
												{Array.from({ length: 6 }).map((_, index) => (
													<InputOTPSlot key={index} index={index} />
												))}
											</InputOTPGroup>
										</InputOTP>
									</div>
								</FormControl>
								<FormDescription className='text-center text-text-secondary'>
									{RESET_PASSWORD_MESSAGES.PAGE_SUBTITLE}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='newPassword'
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{RESET_PASSWORD_MESSAGES.NEW_PASSWORD_LABEL}
								</FormLabel>
								<FormControl>
									<PasswordInput
										placeholder='Enter a strong password'
										{...field}
										className='text-foreground'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='confirmPassword'
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{RESET_PASSWORD_MESSAGES.CONFIRM_PASSWORD_LABEL}
								</FormLabel>
								<FormControl>
									<PasswordInput
										placeholder='Re-enter the password'
										{...field}
										className='text-foreground'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<AnimatedButton
						type='submit'
						className='h-11 w-full'
						isLoading={form.formState.isSubmitting}
						loadingText='Updating password...'
					>
						{RESET_PASSWORD_MESSAGES.SUBMIT_TEXT}
					</AnimatedButton>
				</form>
			</Form>
			<div className='flex items-center justify-center gap-2 text-sm text-text-secondary'>
				<span>{RESET_PASSWORD_MESSAGES.RESEND_PROMPT}</span>
				<Button
					variant='link'
					onClick={handleResend}
					className='px-0 text-primary hover:text-primary-dark'
				>
					{RESET_PASSWORD_MESSAGES.RESEND_BUTTON}
				</Button>
			</div>
		</div>
	)
}
