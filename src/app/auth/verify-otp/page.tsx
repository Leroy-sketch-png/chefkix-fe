import type { Metadata } from 'next'
import VerifyOtpClient from './VerifyOtpClient'

export const metadata: Metadata = {
	title: 'Verify your email',
	description:
		'Verify your Chefkix account email to finish signup and protect access to your cooking profile.',
	robots: {
		index: false,
		follow: false,
	},
}

export default function VerifyOtpPage() {
	return <VerifyOtpClient />
}
