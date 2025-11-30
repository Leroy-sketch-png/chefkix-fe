'use client'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CreatorDashboard } from '@/components/creator'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function CreatorRoute() {
	const { user } = useAuth()
	const router = useRouter()

	// Mock creator stats - in production, fetch from backend
	const creatorStats = {
		totalRecipes: 12,
		totalCooks: 847,
		totalLikes: 2341,
		avgRating: 4.7,
		xpFromTips: 1250,
		weeklyViews: 523,
		weeklyChange: '+15%',
	}

	// Mock top recipes - in production, fetch from backend
	const topRecipes = [
		{
			id: 'recipe-1',
			name: 'Spicy Tomato Ramen',
			imageUrl: 'https://i.imgur.com/v8SjYfT.jpeg',
			cooks: 234,
			likes: 567,
			rating: 4.8,
			xpEarned: 450,
		},
		{
			id: 'recipe-2',
			name: 'Creamy Carbonara',
			imageUrl: 'https://i.imgur.com/bBDxvxd.jpeg',
			cooks: 189,
			likes: 423,
			rating: 4.6,
			xpEarned: 380,
		},
		{
			id: 'recipe-3',
			name: 'Thai Green Curry',
			imageUrl: 'https://i.imgur.com/3VhVxqG.jpeg',
			cooks: 156,
			likes: 312,
			rating: 4.5,
			xpEarned: 290,
		},
	]

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<div className='mb-6 space-y-2'>
					<h1 className='text-3xl font-bold text-text-primary'>
						Creator Dashboard
					</h1>
					<p className='text-muted-foreground'>
						Track your recipe performance and see how your creations are
						inspiring others.
					</p>
				</div>
				<CreatorDashboard
					stats={creatorStats}
					topRecipes={topRecipes}
					onCreateRecipe={() => router.push('/create')}
					onViewRecipe={id => router.push(`/recipes/${id}`)}
					onViewAnalytics={id => router.push(`/recipes/${id}?tab=analytics`)}
				/>
			</PageContainer>
		</PageTransition>
	)
}
