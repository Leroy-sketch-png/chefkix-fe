import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Discover Chefs | Chefkix',
	description:
		'Connect with talented home chefs and culinary creators. Build your cooking network and get inspired.',
	openGraph: {
		title: 'Discover Chefs | Chefkix',
		description: 'Connect with talented chefs and culinary creators',
		type: 'website',
		locale: 'en_US',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Discover Chefs | Chefkix',
		description: 'Connect with talented chefs and culinary creators',
	},
}

export default function DiscoverLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
