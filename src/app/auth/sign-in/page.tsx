import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'
import { SIGN_IN_MESSAGES } from '@/constants/messages'

const SignInPage = () => {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background px-4'>
			<div className='w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg'>
				<h1 className='mb-2 text-center text-3xl font-bold text-foreground'>
					{SIGN_IN_MESSAGES.PAGE_TITLE}
				</h1>
				<p className='mb-8 text-center text-muted-foreground'>
					{SIGN_IN_MESSAGES.PAGE_SUBTITLE}
				</p>
				<SignInForm />
			</div>
		</div>
	)
}

export default SignInPage
