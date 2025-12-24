'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CreatorDashboard } from '@/components/creator'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { getCreatorStats, CreatorStats } from '@/services/creator'
import { motion } from 'framer-motion'
import { ArrowLeft, ChefHat, Sparkles } from 'lucide-react'
import { TRANSITION_SPRING } from '@/lib/motion'

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
	// Per vision_and_spec/03-social.txt - using real data from BE
	const weekHighlight = {
		newCooks: stats?.thisWeek.newCooks ?? 0,
		// Phase 2: newCooksChange, xpEarnedChange (requires historical data storage)
		xpEarned: stats?.thisWeek.xpEarned ?? 0,
		dateRange: getDateRangeThisWeek(),
	}

	const lifetimeStats = {
		recipesPublished: stats?.totalRecipesPublished ?? 0,
		totalCooks: stats?.totalCooksOfYourRecipes ?? 0,
		creatorXpEarned: stats?.xpEarnedAsCreator ?? 0,
		avgRating: stats?.avgRating ?? null,
	}

	const creatorBadges = (stats?.creatorBadges ?? []).map((badge, idx) => ({
		id: `badge-${idx}`,
		icon: badge.icon,
		name: badge.name,
		description: badge.recipeTitle
			? `Earned from ${badge.recipeTitle}`
			: 'Creator achievement',
		isEarned: true,
	}))

	// Map difficulty from BE format to component format
	const mapDifficulty = (
		difficulty: string | null,
	): 'Easy' | 'Medium' | 'Hard' | 'Expert' => {
		switch (difficulty) {
			case 'Beginner':
				return 'Easy'
			case 'Intermediate':
				return 'Medium'
			case 'Advanced':
				return 'Hard'
			case 'Expert':
				return 'Expert'
			default:
				return 'Medium'
		}
	}

	const topRecipe = stats?.topRecipe
		? {
				id: stats.topRecipe.id,
				title: stats.topRecipe.title,
				imageUrl: stats.topRecipe.coverImageUrl ?? '/placeholder-recipe.jpg',
				cookTime: stats.topRecipe.cookTimeMinutes ?? 0,
				difficulty: mapDifficulty(stats.topRecipe.difficulty),
				cookCount: stats.topRecipe.cookCount,
				xpGenerated: stats.topRecipe.xpGenerated,
				rating: stats.topRecipe.averageRating ?? 0,
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
				{/* Header - Secondary page pattern with back button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-6'
				>
					<div className='mb-2 flex items-center gap-3'>
						<button
							onClick={() => router.push('/dashboard')}
							className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
						>
							<ArrowLeft className='size-5' />
						</button>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.1, ...TRANSITION_SPRING }}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-xp shadow-md shadow-xp/25'
						>
							<ChefHat className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>Creator Dashboard</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Track your recipe performance and inspire others
					</p>
				</motion.div>
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
