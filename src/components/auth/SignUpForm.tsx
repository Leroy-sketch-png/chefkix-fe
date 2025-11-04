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
import { signUp } from '@/services/auth'
import { PATHS, SIGN_UP_MESSAGES } from '@/constants'

const formSchema = z.object({
	username: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
	email: z.string().email({ message: 'Invalid email address.' }),
	password: z.string().min(6, {
		message: 'Password must be at least 6 characters.',
	}),
})

export function SignUpForm() {
	const router = useRouter()

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: '',
			email: '',
			password: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const response = await signUp(values)

		if (response.success) {
			router.push(
				`${PATHS.AUTH.VERIFY_OTP}?email=${encodeURIComponent(values.email)}`,
			)
		} else {
			if (response.error) {
				Object.keys(response.error).forEach(key => {
					const field = key as keyof z.infer<typeof formSchema>
					const message =
						response.error?.[field]?.join(', ') || SIGN_UP_MESSAGES.ERROR
					form.setError(field, {
						type: 'manual',
						message: message,
					})
				})
			} else {
				form.setError('root.general' as any, {
					type: 'manual',
					message: response.message || SIGN_UP_MESSAGES.FAILED,
				})
			}
		}
	}

	return (
		<div className='w-full max-w-md space-y-8'>
			<h2 className='mt-6 text-center text-3xl font-extrabold text-foreground'>
				Create your account
			</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
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
						name='username'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									<Input
										placeholder='your_username'
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
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										placeholder='test@example.com'
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
									<Input
										type='password'
										placeholder='password'
										{...field}
										className='text-foreground'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type='submit' className='w-full'>
						Create Account
					</Button>
				</form>
			</Form>
			<div className='text-center text-sm text-muted-foreground'>
				Already have an account?{' '}
				<Link
					href={PATHS.AUTH.SIGN_UP}
					className='font-medium text-primary hover:text-primary-dark'
				>
					Sign In
				</Link>
			</div>
		</div>
	)
}
