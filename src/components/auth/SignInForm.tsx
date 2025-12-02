'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
import { ApiResponse, LoginSuccessResponse, User } from '@/lib/types'
import { signIn, googleSignIn } from '@/services/auth'
import { getMyProfile } from '@/services/profile'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { SIGN_IN_MESSAGES } from '@/constants/messages'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { toast } from '@/components/ui/toaster'

const formSchema = z.object({
	emailOrUsername: z
		.string()
		.min(3, { message: 'Email or username must be at least 3 characters.' }),
	password: z.string().min(6, {
		message: 'Password must be at least 6 characters.',
	}),
})

export function SignInForm() {
	const router = useRouter()
	const { login, setUser, isAuthenticated } = useAuth()
	const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			emailOrUsername: '',
			password: '',
		},
	})

	async function handleSuccessfulLogin(
		response: ApiResponse<LoginSuccessResponse>,
	) {
		// Correctly access the nested 'data' property from the standardized ApiResponse
		const payload = response.data
		if (!payload || !payload.accessToken) {
			const errorMsg =
				'Authentication failed: no access token received from server.'
			form.setError('root.general' as any, {
				type: 'manual',
				message: errorMsg,
			})
			toast.error(errorMsg)
			return
		}

		// Per the API spec, login returns a token. Set it, then fetch the user profile.
		login(payload.accessToken)

		const profileResponse = await getMyProfile()
		if (profileResponse.success && profileResponse.data) {
			setUser(profileResponse.data)
			toast.success('Welcome back! Signed in successfully.')
			router.push(PATHS.DASHBOARD)
		} else {
			const errorMsg =
				profileResponse.message ||
				'Login successful, but failed to fetch user profile. Please try again.'
			form.setError('root.general' as any, {
				type: 'manual',
				message: errorMsg,
			})
			toast.error(errorMsg)
		}
	}

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const response = await signIn({
			emailOrUsername: values.emailOrUsername,
			password: values.password,
		})

		if (response.success) {
			await handleSuccessfulLogin(response)
		} else {
			const errorMessage = response.message || 'An unknown error occurred.'
			form.setError('root.general' as any, {
				type: 'manual',
				message: errorMessage,
			})
			toast.error(errorMessage)
		}
	}

	return (
		<div className='w-full space-y-6'>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
					{form.formState.errors.root?.general && (
						<div
							className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'
							role='alert'
						>
							{(form.formState.errors.root.general as any).message}
						</div>
					)}
					<FormField
						control={form.control}
						name='emailOrUsername'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email or Username</FormLabel>
								<FormControl>
									<Input
										placeholder='yourname or test@example.com'
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
						name='password'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<PasswordInput
										placeholder='password'
										{...field}
										className='text-foreground'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className='text-right text-sm'>
						<Button
							variant='link'
							type='button'
							onClick={() => setForgotPasswordOpen(true)}
							className='h-auto p-0 font-medium text-primary transition-colors hover:text-primary-dark'
						>
							{SIGN_IN_MESSAGES.FORGOT_PASSWORD}
						</Button>
					</div>
					<AnimatedButton
						type='submit'
						className='h-11 w-full'
						isLoading={form.formState.isSubmitting}
						loadingText='Signing in...'
						shine
					>
						Sign In
					</AnimatedButton>
					<div className='relative my-4 flex items-center'>
						<span className='flex-1 border-t border-border-subtle'></span>
						<span className='mx-4 text-xs leading-normal text-text-secondary'>
							or
						</span>
						<span className='flex-1 border-t border-border-subtle'></span>
					</div>
					<GoogleSignInButton
						text='Sign in with Google'
						onSuccess={async code => {
							const response = await googleSignIn({ code })
							if (response.success) {
								await handleSuccessfulLogin(response)
							} else {
								const errorMessage =
									response.message || 'Google sign-in failed.'
								form.setError('root.general' as any, {
									type: 'manual',
									message: errorMessage,
								})
							}
						}}
						onFailure={error => {
							form.setError('root.general' as any, {
								type: 'manual',
								message: error.message || 'Google sign-in failed.',
							})
						}}
					/>
				</form>
			</Form>
			<div className='text-center text-sm leading-normal text-text-secondary'>
				{SIGN_IN_MESSAGES.NO_ACCOUNT}{' '}
				<Link
					href={PATHS.AUTH.SIGN_UP}
					className='font-medium text-primary transition-colors hover:text-primary-dark'
				>
					Create account
				</Link>
			</div>
			<ForgotPasswordDialog
				open={forgotPasswordOpen}
				onOpenChange={setForgotPasswordOpen}
			/>
		</div>
	)
}
