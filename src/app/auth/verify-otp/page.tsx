'use client'

import { Suspense } from 'react'
import { VerifyOtpForm } from './components/VerifyOtpForm'

const VerifyOtpPage = () => {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50'>
			<div className='w-full max-w-md'>
				<Suspense fallback={<div>Loading...</div>}>
					<VerifyOtpForm />
				</Suspense>
			</div>
		</div>
	)
}

export default VerifyOtpPage
