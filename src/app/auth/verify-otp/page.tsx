'use client'

import { Suspense } from 'react'
import { VerifyOtpForm } from '@/components/auth/VerifyOtpForm'
import { VERIFY_OTP_MESSAGES } from '@/constants/messages'
import { LazyLottie } from '@/components/shared/LazyLottie'

const VerifyOtpPage = () => {
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 px-4'>
			{/* Background Lottie Animation - lazy loaded with theatrical entrance */}
			<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-20'>
				<LazyLottie
					src='/lottie/lottie-verify-email.json'
					sizeOfIllustrator={(w, h) => Math.min(w * 0.5, h * 0.6, 400)}
					entrance='fade'
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
