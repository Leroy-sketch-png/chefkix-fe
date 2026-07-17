import type { Metadata } from 'next'
import { Suspense } from 'react'
import ExploreClient from './ExploreClient'

export const metadata: Metadata = {
	title: 'Explore recipes',
	description:
		'Find cookable recipes, trending dishes, pantry-friendly ideas, and community-tested inspiration on Chefkix.',
	alternates: {
		canonical: '/explore',
	},
	openGraph: {
		title: 'Explore recipes on Chefkix',
		description:
			'Find cookable recipes, trending dishes, pantry-friendly ideas, and community-tested inspiration on Chefkix.',
		url: '/explore',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Explore recipes on Chefkix',
		description:
			'Find cookable recipes, trending dishes, pantry-friendly ideas, and community-tested inspiration on Chefkix.',
	},
}

export default function ExplorePage() {
	return (
		<Suspense fallback={null}>
			<ExploreClient />
		</Suspense>
	)
}
