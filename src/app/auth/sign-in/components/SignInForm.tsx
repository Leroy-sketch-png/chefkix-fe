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
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants/paths'

const formSchema = z.object({
	email: z.string().email({ message: 'Invalid email address.' }),
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
			email: '',
			password: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const response = await signIn({
			emailOrUsername: values.email,
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
					href={PATHS.AUTH.SIGN_UP}
					className='font-medium text-indigo-600 hover:text-indigo-500'
				>
					Sign Up
				</Link>
			</div>
		</div>
	)
}
