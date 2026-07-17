import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignInClient from './SignInClient'

export const metadata: Metadata = {
	title: 'Sign in',
	description:
		'Return to your Chefkix kitchen to continue cooking sessions, saved recipes, meal plans, and community activity.',
	alternates: {
		canonical: '/auth/sign-in',
	},
	robots: {
		index: false,
		follow: false,
	},
	openGraph: {
		title: 'Sign in to Chefkix',
		description:
			'Return to your Chefkix kitchen to continue cooking sessions, saved recipes, meal plans, and community activity.',
		url: '/auth/sign-in',
		type: 'website',
	},
}

export default function SignInPage() {
	return (
		<Suspense fallback={null}>
			<SignInClient />
		</Suspense>
	)
}
