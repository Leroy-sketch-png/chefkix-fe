'use client'

import { Suspense } from 'react'
import { VerifyOtpForm } from '@/components/auth/VerifyOtpForm'
import { LazyLottie } from '@/components/shared/LazyLottie'

const VerifyOtpPage = () => {
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand/5 via-accent/5 to-brand/5 px-4'>
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
				<Suspense fallback={<div className='flex h-64 items-center justify-center'><div className='size-8 animate-spin rounded-full border-4 border-brand border-t-transparent' /></div>}>
					<VerifyOtpForm />
				</Suspense>
			</div>
		</div>
	)
}

export default VerifyOtpPage
