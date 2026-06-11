import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Explore Recipes | Chefkix',
	description:
		'Discover community recipes and filter by cuisine, dietary restrictions, and difficulty level.',
	openGraph: {
		title: 'Explore Recipes | Chefkix',
		description: 'Discover amazing recipes from chefs worldwide',
		type: 'website',
		locale: 'en_US',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Explore Recipes | Chefkix',
		description: 'Discover amazing recipes from chefs worldwide',
	},
}

export default function ExploreLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
