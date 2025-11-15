'use client'

import dynamic from 'next/dynamic'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import lottieSetup from '@/../public/lottie/lottie-setup-profile.json'
import { RESET_PASSWORD_MESSAGES } from '@/constants/messages'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

const ResetPasswordPage = () => {
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4'>
			<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-20'>
				<LottieAnimation
					lottie={lottieSetup}
					sizeOfIllustrator={(w, h) => Math.min(w * 0.5, h * 0.6, 400)}
					loop
					autoplay
				/>
			</div>
			<div className='relative z-10 w-full max-w-md rounded-lg border border-border bg-card/95 p-8 shadow-lg backdrop-blur-sm'>
				<h1 className='mb-2 text-center text-3xl font-bold text-foreground'>
					{RESET_PASSWORD_MESSAGES.PAGE_TITLE}
				</h1>
				<p className='mb-8 text-center text-muted-foreground'>
					{RESET_PASSWORD_MESSAGES.PAGE_SUBTITLE}
				</p>
				<ResetPasswordForm />
			</div>
		</div>
	)
}

export default ResetPasswordPage
