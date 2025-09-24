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
import { signIn } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'

const formSchema = z.object({
	email: z.string().email({ message: 'Invalid email address.' }),
	password: z.string().min(6, {
		message: 'Password must be at least 6 characters.',
	}),
})

export function SignInForm() {
	const router = useRouter()
	const isLoggedIn = useAuthStore(state => state.isLoggedIn)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		console.log('Attempting sign-in with:', values)
		// Corrected: Pass the entire values object as SignInDto
		const response = await signIn({
			usernameOrEmail: values.email,
			password: values.password,
		})

		if (response.success) {
			console.log('Sign-in successful:', response.data)
			useAuthStore.getState().login(values.email)
			router.push('/')
		} else {
			console.error('Sign-in failed:', response.error)
			// Corrected: Extract the error message from the response.error object
			const errorMessage =
				response.error?.general?.[0] || response.message || 'Sign-in failed.'
			form.setError('email', {
				type: 'manual',
				message: errorMessage,
			})
		}
	}

	return (
		<div className='w-full max-w-md space-y-8'>
			<p>Logged In Status: {isLoggedIn ? 'Yes' : 'No'}</p>
			<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
				Sign in to your account
			</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
					<FormField
						control={form.control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										placeholder='test@example.com'
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
				</form>
			</Form>
			<div className='text-center text-sm text-gray-600'>
				Don&apos;t have an account?{' '}
				<Link
					href='/auth/sign-up'
					className='font-medium text-indigo-600 hover:text-indigo-500'
				>
					Sign Up
				</Link>
			</div>
		</div>
	)
}
