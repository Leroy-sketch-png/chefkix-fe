'use client'

import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

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
import { toast } from '@/components/ui/toaster'
import { forgotPassword } from '@/services/auth'
import { FORGOT_PASSWORD_MESSAGES } from '@/constants/messages'
import { PATHS } from '@/constants'

const formSchema = z.object({
	email: z.string().email({ message: 'Please enter a valid email.' }),
})

export const ForgotPasswordForm = () => {
	const router = useRouter()

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { email: '' },
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		const response = await forgotPassword({ email: values.email })

		if (response.success) {
			toast.success(FORGOT_PASSWORD_MESSAGES.SUCCESS)
			router.push(
				`${PATHS.AUTH.RESET_PASSWORD}?email=${encodeURIComponent(values.email)}`,
			)
			return
		}

		const errorMessage =
			response.message || 'Failed to send reset instructions.'
		form.setError('email', { type: 'manual', message: errorMessage })
		toast.error(errorMessage)
	}

	return (
		<div className='w-full space-y-6'>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
					<FormField
						control={form.control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{FORGOT_PASSWORD_MESSAGES.EMAIL_LABEL}</FormLabel>
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
						className='h-11 w-full'
						isLoading={form.formState.isSubmitting}
						loadingText='Sending instructions...'
					>
						{FORGOT_PASSWORD_MESSAGES.FORM_TITLE}
					</AnimatedButton>
				</form>
			</Form>
			<div className='text-center text-sm leading-normal text-text-secondary'>
				<Link
					href={PATHS.AUTH.SIGN_IN}
					className='font-medium text-primary transition-colors hover:text-primary-dark'
				>
					{FORGOT_PASSWORD_MESSAGES.BACK_TO_SIGN_IN}
				</Link>
			</div>
		</div>
	)
}
