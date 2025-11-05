import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SIGN_UP_MESSAGES } from '@/constants/messages'

const SignUpPage = () => {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background px-4'>
			<div className='w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg'>
				<h1 className='mb-2 text-center text-3xl font-bold text-foreground'>
					{SIGN_UP_MESSAGES.PAGE_TITLE}
				</h1>
				<p className='mb-8 text-center text-muted-foreground'>
					{SIGN_UP_MESSAGES.PAGE_SUBTITLE}
				</p>
				<SignUpForm />
			</div>
		</div>
	)
}

export default SignUpPage
