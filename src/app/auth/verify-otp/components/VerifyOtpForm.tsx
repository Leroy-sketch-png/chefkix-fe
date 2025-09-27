'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import { useRouter, useSearchParams } from 'next/navigation'
import { sendOtp, verifyOtp } from '@/services/auth'
import { PATHS } from '@/constants'
import { useState } from 'react'

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
			setError('Email not found. Please try signing up again.')
			return
		}

		const response = await verifyOtp({ email, otp: values.otp })

		if (response.success) {
			setSuccess('Email verified successfully! Redirecting to sign-in...')
			setError(null)
			setTimeout(() => {
				router.push(PATHS.AUTH.SIGN_IN)
			}, 2000)
		} else {
			setError(response.message || 'Invalid OTP. Please try again.')
			setSuccess(null)
		}
	}

	const handleResendOtp = async () => {
		if (!email) {
			setError('Email not found. Cannot resend OTP.')
			return
		}
		const response = await sendOtp({ email })
		if (response.success) {
			setSuccess('A new OTP has been sent to your email.')
			setError(null)
		} else {
			setError(response.message || 'Failed to resend OTP.')
			setSuccess(null)
		}
	}

	if (!email) {
		return (
			<div className='rounded-lg bg-white p-8 text-center shadow-md'>
				<h2 className='text-2xl font-bold text-red-600'>Error</h2>
				<p className='mt-4 text-gray-700'>
					No email address was provided. Please return to the sign-up page and
					try again.
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
		<div className='rounded-lg bg-white p-8 shadow-md'>
			<h2 className='text-center text-2xl font-bold'>Verify Your Email</h2>
			<p className='mt-2 text-center text-sm text-gray-600'>
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
									<Input placeholder='123456' {...field} />
								</FormControl>
								<FormDescription>Enter the 6-digit code.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					{error && <p className='text-sm font-medium text-red-500'>{error}</p>}
					{success && (
						<p className='text-sm font-medium text-green-500'>{success}</p>
					)}
					<Button type='submit' className='w-full'>
						Verify Email
					</Button>
				</form>
			</Form>
			<div className='mt-4 text-center'>
				<Button variant='link' onClick={handleResendOtp}>
					Didn&apos;t receive the code? Resend OTP
				</Button>
			</div>
		</div>
	)
}
