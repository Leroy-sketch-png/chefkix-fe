import type { Metadata } from 'next'
import { Suspense } from 'react'
import JoinClient from './JoinClient'

export const metadata: Metadata = {
	title: 'Join a friend on ChefKix',
	description: 'Create your ChefKix account and redeem a friend referral.',
	robots: {
		index: false,
		follow: false,
	},
}

export default function JoinPage() {
	return (
		<Suspense fallback={null}>
			<JoinClient />
		</Suspense>
	)
}
