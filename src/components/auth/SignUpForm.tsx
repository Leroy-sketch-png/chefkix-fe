'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
import { signUp, googleSignIn } from '@/services/auth'
import { getMyProfile } from '@/services/profile'
import { PATHS, SIGN_UP_MESSAGES } from '@/constants'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/hooks/useAuth'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'

const formSchema = z.object({
	firstName: z.string().min(1, {
		message: 'First name is required.',
	}),
	lastName: z.string().min(1, {
		message: 'Last name is required.',
	}),
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
	const { login, setUser } = useAuth()

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			username: '',
			email: '',
			password: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const response = await signUp(values)

		if (response.success) {
			toast.success(
				'Account created! Please check your email for the verification code.',
			)
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
				toast.error('Please fix the errors in the form.')
			} else {
				const errorMsg = response.message || SIGN_UP_MESSAGES.FAILED
				form.setError('root.general' as any, {
					type: 'manual',
					message: errorMsg,
				})
				toast.error(errorMsg)
			}
		}
	}

	return (
		<motion.div
			variants={staggerContainer}
			initial='hidden'
			animate='visible'
			className='w-full space-y-6'
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
					{form.formState.errors.root?.general && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							className='rounded-xl bg-error/10 p-4 text-sm text-error'
							role='alert'
						>
							{(form.formState.errors.root.general as any).message}
						</motion.div>
					)}
					<motion.div variants={staggerItem} className='grid grid-cols-2 gap-3'>
						<FormField
							control={form.control}
							name='firstName'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>First Name</FormLabel>
									<FormControl>
										<Input
											placeholder='John'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='lastName'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>Last Name</FormLabel>
									<FormControl>
										<Input
											placeholder='Doe'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem}>
						<FormField
							control={form.control}
							name='username'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>Username</FormLabel>
									<FormControl>
										<Input
											placeholder='your_username'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem}>
						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>Email</FormLabel>
									<FormControl>
										<Input
											placeholder='test@example.com'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem}>
						<FormField
							control={form.control}
							name='password'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='text-text'>Password</FormLabel>
									<FormControl>
										<PasswordInput
											placeholder='password'
											{...field}
											className='h-11 rounded-xl border-border-medium bg-bg-elevated text-text transition-all focus:border-brand focus:ring-2 focus:ring-brand/20'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
					<motion.div variants={staggerItem}>
						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<AnimatedButton
								type='submit'
								className='h-12 w-full rounded-xl bg-gradient-xp text-base font-bold shadow-lg shadow-xp/30 transition-shadow hover:shadow-xl hover:shadow-xp/40'
								isLoading={form.formState.isSubmitting}
								loadingText='Creating account...'
								shine
							>
								{SIGN_UP_MESSAGES.FORM_TITLE}
							</AnimatedButton>
						</motion.div>
					</motion.div>
					<motion.div
						variants={staggerItem}
						className='relative my-5 flex items-center'
					>
						<span className='flex-1 border-t border-border-subtle'></span>
						<span className='mx-4 text-xs leading-normal text-text-muted'>
							or
						</span>
						<span className='flex-1 border-t border-border-subtle'></span>
					</motion.div>
					<motion.div variants={staggerItem} className='w-full'>
						<GoogleSignInButton
							onSuccess={async code => {
								const response = await googleSignIn({ code })
								if (response.success && response.data?.accessToken) {
									login(response.data.accessToken)
									const profileResponse = await getMyProfile()
									if (profileResponse.success && profileResponse.data) {
										setUser(profileResponse.data)
										toast.success('Signed in with Google successfully!')
										router.push(PATHS.DASHBOARD)
									} else {
										toast.error('Failed to fetch profile. Please try again.')
									}
								} else {
									const errorMsg =
										response.message || 'Failed to sign in with Google.'
									form.setError('root.general' as any, {
										type: 'manual',
										message: errorMsg,
									})
									toast.error(errorMsg)
								}
							}}
							onFailure={error => {
								toast.error('Failed to sign in with Google. Please try again.')
								console.error(error)
							}}
							text='Sign up with Google'
						/>
					</motion.div>
				</form>
			</Form>
			<motion.div
				variants={staggerItem}
				className='text-center text-sm leading-normal text-text-secondary'
			>
				{SIGN_UP_MESSAGES.ALREADY_HAVE_ACCOUNT}{' '}
				<Link
					href={PATHS.AUTH.SIGN_IN}
					className='font-semibold text-brand transition-colors hover:text-brand/80'
				>
					Sign In
				</Link>
			</motion.div>
		</motion.div>
	)
}
