'use client'

import { Suspense } from 'react'
import { VerifyOtpForm } from '@/components/auth/VerifyOtpForm'

const VerifyOtpPage = () => {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background px-4'>
			<div className='w-full max-w-md'>
				<Suspense fallback={<div>Loading...</div>}>
					<VerifyOtpForm />
				</Suspense>
			</div>
		</div>
	)
}

export default VerifyOtpPage
