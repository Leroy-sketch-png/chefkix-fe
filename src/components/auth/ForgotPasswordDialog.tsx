'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatedButton } from '@/components/ui/animated-button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { forgotPassword, verifyOtpPassword } from '@/services/auth'
import {
	FORGOT_PASSWORD_MESSAGES,
	RESET_PASSWORD_MESSAGES,
} from '@/constants/messages'
import { ArrowLeft } from 'lucide-react'

type Step = 'email' | 'reset'

const emailSchema = z.object({
	email: z.string().email({ message: 'Please enter a valid email.' }),
})

const resetSchema = z
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

interface ForgotPasswordDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const ForgotPasswordDialog = ({
	open,
	onOpenChange,
}: ForgotPasswordDialogProps) => {
	const [step, setStep] = useState<Step>('email')
	const [email, setEmail] = useState('')

	const emailForm = useForm<z.infer<typeof emailSchema>>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: '' },
	})

	const resetForm = useForm<z.infer<typeof resetSchema>>({
		resolver: zodResolver(resetSchema),
		defaultValues: {
			otp: '',
			newPassword: '',
			confirmPassword: '',
		},
	})

	const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
		const response = await forgotPassword({ email: values.email })

		if (response.success) {
			setEmail(values.email)
			setStep('reset')
			toast.success(FORGOT_PASSWORD_MESSAGES.SUCCESS)
			return
		}

		const errorMessage =
			response.message || 'Failed to send reset instructions.'
		emailForm.setError('email', { type: 'manual', message: errorMessage })
		toast.error(errorMessage)
	}

	const handleResetSubmit = async (values: z.infer<typeof resetSchema>) => {
		const response = await verifyOtpPassword({
			email,
			otp: values.otp,
			newPassword: values.newPassword,
		})

		if (response.success) {
			toast.success(RESET_PASSWORD_MESSAGES.SUCCESS)
			setTimeout(() => {
				onOpenChange(false)
				// Reset forms and state
				setStep('email')
				setEmail('')
				emailForm.reset()
				resetForm.reset()
			}, 1000)
			return
		}

		const errorMessage = response.message || 'Failed to update password.'
		resetForm.setError('otp', { type: 'manual', message: errorMessage })
		toast.error(errorMessage)
	}

	const handleResend = async () => {
		const response = await forgotPassword({ email })
		if (response.success) {
			toast.success(RESET_PASSWORD_MESSAGES.RESEND_SUCCESS)
			return
		}
		toast.error(response.message || 'Failed to resend code.')
	}

	const handleBack = () => {
		setStep('email')
		resetForm.reset()
	}

	const handleClose = () => {
		onOpenChange(false)
		// Reset after animation completes
		setTimeout(() => {
			setStep('email')
			setEmail('')
			emailForm.reset()
			resetForm.reset()
		}, 300)
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{step === 'email'
							? FORGOT_PASSWORD_MESSAGES.PAGE_TITLE
							: RESET_PASSWORD_MESSAGES.PAGE_TITLE}
					</DialogTitle>
					<DialogDescription>
						{step === 'email'
							? FORGOT_PASSWORD_MESSAGES.PAGE_SUBTITLE
							: RESET_PASSWORD_MESSAGES.PAGE_SUBTITLE}
					</DialogDescription>
				</DialogHeader>

				{step === 'email' && (
					<Form {...emailForm}>
						<form
							onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
							className='space-y-4'
						>
							<FormField
								control={emailForm.control}
								name='email'
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{FORGOT_PASSWORD_MESSAGES.EMAIL_LABEL}
										</FormLabel>
										<FormControl>
											<Input
												placeholder='chef@example.com'
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
								className='w-full'
								isLoading={emailForm.formState.isSubmitting}
								loadingText='Sending...'
							>
								{FORGOT_PASSWORD_MESSAGES.FORM_TITLE}
							</AnimatedButton>
						</form>
					</Form>
				)}

				{step === 'reset' && (
					<>
						<Button
							variant='ghost'
							size='sm'
							onClick={handleBack}
							className='mb-2 w-fit gap-2'
						>
							<ArrowLeft className='h-4 w-4' />
							Back
						</Button>
						<Form {...resetForm}>
							<form
								onSubmit={resetForm.handleSubmit(handleResetSubmit)}
								className='space-y-4'
							>
								<FormField
									control={resetForm.control}
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
											<FormDescription className='text-center'>
												<Button
													variant='link'
													type='button'
													onClick={handleResend}
													className='h-auto p-0 text-xs'
												>
													{RESET_PASSWORD_MESSAGES.RESEND_BUTTON}
												</Button>
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={resetForm.control}
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
									control={resetForm.control}
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
									className='w-full'
									isLoading={resetForm.formState.isSubmitting}
									loadingText='Updating...'
								>
									{RESET_PASSWORD_MESSAGES.SUBMIT_TEXT}
								</AnimatedButton>
							</form>
						</Form>
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
