import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Dashboard | Chefkix - Your Culinary Journey',
	description:
		'Share your cooking adventures, discover new recipes, and connect with fellow food enthusiasts on Chefkix.',
	openGraph: {
		title: 'Dashboard | Chefkix',
		description: 'Your personalized culinary feed on Chefkix',
		type: 'website',
		locale: 'en_US',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Dashboard | Chefkix',
		description: 'Your personalized culinary feed on Chefkix',
	},
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
