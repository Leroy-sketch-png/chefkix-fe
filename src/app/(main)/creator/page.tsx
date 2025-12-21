'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CreatorDashboard } from '@/components/creator'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { getCreatorStats, CreatorStats } from '@/services/creator'

// ============================================
// HELPERS
// ============================================

const getDateRangeThisWeek = (): string => {
	const now = new Date()
	const startOfWeek = new Date(now)
	startOfWeek.setDate(now.getDate() - now.getDay())
	const endOfWeek = new Date(startOfWeek)
	endOfWeek.setDate(startOfWeek.getDate() + 6)

	return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

// ============================================
// PAGE
// ============================================

export default function CreatorRoute() {
	const { user } = useAuth()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [stats, setStats] = useState<CreatorStats | null>(null)

	useEffect(() => {
		const fetchStats = async () => {
			setIsLoading(true)
			try {
				const response = await getCreatorStats()
				if (response.success && response.data) {
					setStats(response.data)
				}
			} catch (err) {
				console.error('Failed to fetch creator stats:', err)
			} finally {
				setIsLoading(false)
			}
		}

		fetchStats()
	}, [])

	// Transform API data to component format
	const weekHighlight = {
		newCooks: stats?.thisWeek.newCooks ?? 0,
		newCooksChange: 0, // API doesn't provide change percentage
		xpEarned: stats?.thisWeek.xpEarned ?? 0,
		xpEarnedChange: 0,
		dateRange: getDateRangeThisWeek(),
	}

	const lifetimeStats = {
		recipesPublished: stats?.totalRecipesPublished ?? 0,
		totalCooks: stats?.totalCooksOfYourRecipes ?? 0,
		creatorXpEarned: stats?.xpEarnedAsCreator ?? 0,
		avgRating: 0, // API doesn't provide this yet
	}

	const creatorBadges = (stats?.creatorBadges ?? []).map((badge, idx) => ({
		id: `badge-${idx}`,
		icon: badge.icon,
		name: badge.name,
		description: `Earned from ${badge.recipeTitle}`,
		isEarned: true,
	}))

	const topRecipe = stats?.topRecipe
		? {
				id: stats.topRecipe.id,
				title: stats.topRecipe.title,
				imageUrl: '/placeholder-recipe.jpg', // API doesn't provide image
				cookTime: 30, // Default - API doesn't provide this
				difficulty: 'Medium' as const,
				cookCount: stats.topRecipe.cookCount,
				xpGenerated: stats.topRecipe.xpGenerated,
				rating: 4.5, // Default - API doesn't provide this
			}
		: null

	// These need additional API endpoints - leaving empty for now
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
					onViewAllRecipes={() => router.push('/creator/recipes')}
				/>
			</PageContainer>
		</PageTransition>
	)
}
