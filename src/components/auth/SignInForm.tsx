'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { signIn, googleSignIn } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_MESSAGES, PATHS } from '@/constants'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

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
	const { login, isAuthenticated } = useAuth()

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			emailOrUsername: '',
			password: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const response = await signIn({
			emailOrUsername: values.emailOrUsername,
			password: values.password,
		})

		if (response.success && response.data) {
			login(response.data.user, response.data.token)
			router.push(PATHS.HOME)
		} else {
			const errorMessage = response.message || 'An unknown error occurred.'
			form.setError('root.general' as any, {
				type: 'manual',
				message: errorMessage,
			})
		}
	}

	return (
		<div className='w-full max-w-md space-y-8'>
			<p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
			<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
				Sign in to your account
			</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
					{form.formState.errors.root?.general && (
						<div
							className='rounded-md bg-red-50 p-4 text-sm text-red-700'
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
										className='text-gray-900'
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
									<Input
										type='password'
										placeholder='password'
										{...field}
										className='text-gray-900'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type='submit' className='w-full'>
						Sign In
					</Button>
					<GoogleSignInButton
						onSuccess={async code => {
							const response = await googleSignIn({ code })
							if (response.success && response.data) {
								login(response.data.user, response.data.token)
								router.push(PATHS.HOME)
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
			<div className='text-center text-sm text-gray-600'>
				Don&apos;t have an account?{' '}
				<Link
					href={PATHS.AUTH.SIGN_UP}
					className='font-medium text-indigo-600 hover:text-indigo-500'
				>
					Sign Up
				</Link>
			</div>
		</div>
	)
}
