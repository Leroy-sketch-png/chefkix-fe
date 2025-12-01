'use client'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CreatorDashboard } from '@/components/creator'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

// ============================================
// MOCK DATA - TODO: Replace with API integration (MSW ready)
// ============================================

// Default empty state data for MSW preparation
const defaultWeekHighlight = {
	newCooks: 0,
	newCooksChange: 0,
	xpEarned: 0,
	xpEarnedChange: 0,
	dateRange: new Date().toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	}),
}

const defaultLifetimeStats = {
	recipesPublished: 0,
	totalCooks: 0,
	creatorXpEarned: 0,
	avgRating: 0,
}

// ============================================
// PAGE
// ============================================

export default function CreatorRoute() {
	const { user } = useAuth()
	const router = useRouter()

	// TODO: Fetch from API - /api/v1/creator/stats
	const weekHighlight = defaultWeekHighlight
	const lifetimeStats = defaultLifetimeStats
	const creatorBadges: Array<{
		id: string
		icon: string
		name: string
		description: string
		isEarned: boolean
	}> = []
	const topRecipe = null
	const recipePerformance: Array<{
		id: string
		rank: number
		title: string
		imageUrl: string
		cookCount: number
		xpGenerated: number
		badge?: { type: 'milestone' | 'trending'; label: string }
		needsAttention?: boolean
	}> = []
	const recentCooks: Array<{
		id: string
		userId: string
		userName: string
		userAvatar: string
		recipeTitle: string
		xpEarned: number
		timeAgo: string
	}> = []

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
