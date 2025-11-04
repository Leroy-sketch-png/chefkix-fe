import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'

const SignInPage = () => {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background px-4'>
			<div className='w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg'>
				<h1 className='mb-4 text-center text-3xl font-bold text-foreground'>
					Sign In
				</h1>
				<p className='mb-8 text-center text-muted-foreground'>
					Welcome back! Please enter your credentials.
				</p>
				<SignInForm />
			</div>
		</div>
	)
}

export default SignInPage
