'use client'

import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SIGN_UP_MESSAGES } from '@/constants/messages'
import dynamic from 'next/dynamic'
import lottieRegister from '@/../public/lottie/lottie-register.json'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

const SignUpPage = () => {
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-accent/5 to-primary/5 px-4'>
			{/* Background Lottie Animation */}
			<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-20'>
				<LottieAnimation
					lottie={lottieRegister}
					sizeOfIllustrator={(w, h) => Math.min(w * 0.5, h * 0.6, 400)}
					loop
					autoplay
				/>
			</div>

			{/* Sign Up Form */}
			<div className='relative z-10 w-full max-w-md rounded-lg border border-border bg-card/95 p-8 shadow-lg backdrop-blur-sm'>
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
