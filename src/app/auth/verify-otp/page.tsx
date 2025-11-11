'use client'

import { Suspense } from 'react'
import { VerifyOtpForm } from '@/components/auth/VerifyOtpForm'
import dynamic from 'next/dynamic'
import lottieVerifyEmail from '@/../../public/lottie/lottie-verify-email.json'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

const VerifyOtpPage = () => {
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 px-4'>
			{/* Background Lottie Animation */}
			<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-20'>
				<LottieAnimation
					lottie={lottieVerifyEmail}
					sizeOfIllustrator={(w, h) => Math.min(w * 0.5, h * 0.6, 400)}
					loop
					autoplay
				/>
			</div>

			{/* Verify OTP Form */}
			<div className='relative z-10 w-full max-w-md'>
				<Suspense fallback={<div>Loading...</div>}>
					<VerifyOtpForm />
				</Suspense>
			</div>
		</div>
	)
}

export default VerifyOtpPage
