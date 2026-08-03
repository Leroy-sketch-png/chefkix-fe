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
		images: [
			{
				url: '/images/hero/cacio-e-pepe.png',
				width: 1024,
				height: 1024,
				alt: 'Cacio e Pepe shared on Chefkix',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Welcome to Chefkix',
		description:
			'Cook with guided recipes, meal planning, kitchen timers, and a food community built for real kitchens.',
		images: [
			{
				url: '/images/hero/cacio-e-pepe.png',
				alt: 'Cacio e Pepe shared on Chefkix',
			},
		],
	},
}

export default function WelcomePage() {
	return <WelcomeClient />
}
