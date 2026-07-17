import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignUpClient from './SignUpClient'

export const metadata: Metadata = {
	title: 'Create your account',
	description:
		'Join Chefkix to build a cooking profile, save recipes, follow guided cooking steps, and share kitchen wins.',
	alternates: {
		canonical: '/auth/sign-up',
	},
	openGraph: {
		title: 'Create your Chefkix account',
		description:
			'Join Chefkix to build a cooking profile, save recipes, follow guided cooking steps, and share kitchen wins.',
		url: '/auth/sign-up',
		type: 'website',
	},
}

export default function SignUpPage() {
	return (
		<Suspense fallback={null}>
			<SignUpClient />
		</Suspense>
	)
}
