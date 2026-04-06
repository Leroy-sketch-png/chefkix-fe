'use client'

import { useMemo, useState } from 'react'
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
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { forgotPassword, verifyOtpPassword } from '@/services/auth'
import { ArrowLeft } from 'lucide-react'

type Step = 'email' | 'reset'

function createEmailSchema(t: (key: string) => string) {
	return z.object({
		email: z.string().email({ message: t('forgotEmailInvalid') }),
	})
}

function createResetSchema(t: (key: string) => string) {
	return z
		.object({
			otp: z.string().min(6, { message: t('forgotCodeInvalid') }),
			newPassword: z.string().min(6, {
				message: t('forgotPasswordMin'),
			}),
			confirmPassword: z.string().min(6, {
				message: t('forgotPasswordMin'),
			}),
		})
		.refine(values => values.newPassword === values.confirmPassword, {
			message: t('forgotPasswordMismatch'),
			path: ['confirmPassword'],
		})
}

interface ForgotPasswordDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const ForgotPasswordDialog = ({
	open,
	onOpenChange,
}: ForgotPasswordDialogProps) => {
	const t = useTranslations('auth')
	const emailSchema = useMemo(() => createEmailSchema(t), [t])
	const resetSchema = useMemo(() => createResetSchema(t), [t])
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
			toast.success(t('forgotSuccess'))
			return
		}

		const errorMessage =
			response.message || t('forgotSendFailed')
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
			toast.success(t('resetSuccess'))
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

		const errorMessage = response.message || t('forgotUpdateFailed')
		resetForm.setError('otp', { type: 'manual', message: errorMessage })
		toast.error(errorMessage)
	}

	const handleResend = async () => {
		const response = await forgotPassword({ email })
		if (response.success) {
			toast.success(t('resetResendSuccess'))
			return
		}
		toast.error(response.message || t('forgotResendFailed'))
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
						? t('forgotPageTitle')
						: t('resetPageTitle')}
				</DialogTitle>
				<DialogDescription>
					{step === 'email'
						? t('forgotPageSubtitle')
						: t('resetPageSubtitle')}
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
										{t('forgotEmailLabel')}
									</FormLabel>
										<FormControl>
											<Input
												placeholder={t('forgotEmailPlaceholder')}
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
								loadingText={t('forgotSending')}
								shine
							>
								{t('forgotFormTitle')}
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
							<ArrowLeft className='size-4' />
							{t('forgotBack')}
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
											<FormLabel>{t('resetOtpLabel')}</FormLabel>
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
													{t('resetResendButton')}
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
												{t('resetNewPasswordLabel')}
											</FormLabel>
											<FormControl>
												<PasswordInput
													placeholder={t('forgotPasswordPlaceholder')}
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
												{t('resetConfirmPasswordLabel')}
											</FormLabel>
											<FormControl>
												<PasswordInput
													placeholder={t('forgotConfirmPlaceholder')}
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
									loadingText={t('forgotUpdating')}
									shine
								>
									{t('resetSubmitText')}
								</AnimatedButton>
							</form>
						</Form>
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
