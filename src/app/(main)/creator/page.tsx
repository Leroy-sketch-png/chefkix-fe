'use client'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CreatorDashboard } from '@/components/creator'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function CreatorRoute() {
	const { user } = useAuth()
	const router = useRouter()

	// Mock data matching CreatorDashboardProps interface
	const weekHighlight = {
		newCooks: 47,
		newCooksChange: 12,
		xpEarned: 235,
		xpEarnedChange: 8,
		dateRange: 'Nov 25 - Dec 1',
	}

	const lifetimeStats = {
		recipesPublished: 12,
		totalCooks: 847,
		creatorXpEarned: 4250,
		avgRating: 4.7,
	}

	const creatorBadges = [
		{
			id: 'badge-1',
			icon: '🍝',
			name: 'Pasta Master',
			description: 'Created 5 pasta recipes',
			isEarned: true,
		},
		{
			id: 'badge-2',
			icon: '🔥',
			name: 'Trending Creator',
			description: 'Recipe in top 10',
			isEarned: true,
		},
		{
			id: 'badge-3',
			icon: '👨‍🍳',
			name: '100 Cooks',
			description: 'Recipes cooked 100+ times',
			isEarned: false,
		},
	]

	const topRecipe = {
		id: 'recipe-1',
		title: 'Spicy Tomato Ramen',
		imageUrl: 'https://i.imgur.com/v8SjYfT.jpeg',
		cookTime: 35,
		difficulty: 'Medium' as const,
		cookCount: 234,
		xpGenerated: 1170,
		rating: 4.8,
	}

	const recipePerformance = [
		{
			id: 'recipe-1',
			rank: 1,
			title: 'Spicy Tomato Ramen',
			imageUrl: 'https://i.imgur.com/v8SjYfT.jpeg',
			cookCount: 234,
			xpGenerated: 1170,
			badge: { type: 'milestone' as const, label: '200+ cooks' },
		},
		{
			id: 'recipe-2',
			rank: 2,
			title: 'Creamy Carbonara',
			imageUrl: 'https://i.imgur.com/bBDxvxd.jpeg',
			cookCount: 189,
			xpGenerated: 945,
			badge: { type: 'trending' as const, label: 'Trending' },
		},
		{
			id: 'recipe-3',
			rank: 3,
			title: 'Thai Green Curry',
			imageUrl: 'https://i.imgur.com/3VhVxqG.jpeg',
			cookCount: 156,
			xpGenerated: 780,
			needsAttention: true,
		},
	]

	const recentCooks = [
		{
			id: 'cook-1',
			userId: 'user-1',
			userName: 'ChefMaria',
			userAvatar: 'https://i.pravatar.cc/40?u=1',
			recipeTitle: 'Spicy Tomato Ramen',
			xpEarned: 5,
			timeAgo: '2h ago',
		},
		{
			id: 'cook-2',
			userId: 'user-2',
			userName: 'PastaLover',
			userAvatar: 'https://i.pravatar.cc/40?u=2',
			recipeTitle: 'Creamy Carbonara',
			xpEarned: 5,
			timeAgo: '5h ago',
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
					weekHighlight={weekHighlight}
					lifetimeStats={lifetimeStats}
					creatorBadges={creatorBadges}
					topRecipe={topRecipe}
					recipePerformance={recipePerformance}
					recentCooks={recentCooks}
					onBack={() => router.push('/dashboard')}
					onCreateRecipe={() => router.push('/create')}
					onRecipeClick={id => router.push(`/recipes/${id}`)}
				/>
			</PageContainer>
		</PageTransition>
	)
}
