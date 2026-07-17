import type { Metadata } from 'next'
import WelcomeClient from './WelcomeClient'

export const metadata: Metadata = {
	title: 'Welcome',
	description:
		'Cook with guided recipes, meal planning, kitchen timers, and a food community built for real kitchens.',
	alternates: {
		canonical: '/welcome',
	},
	openGraph: {
		title: 'Welcome to Chefkix',
		description:
			'Cook with guided recipes, meal planning, kitchen timers, and a food community built for real kitchens.',
		url: '/welcome',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Welcome to Chefkix',
		description:
			'Cook with guided recipes, meal planning, kitchen timers, and a food community built for real kitchens.',
	},
}

export default function WelcomePage() {
	return <WelcomeClient />
}
