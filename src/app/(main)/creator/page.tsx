'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CreatorDashboard } from '@/components/creator'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
	getCreatorStats,
	getCreatorPerformance,
	getRecentCooks,
	CreatorStats,
	CreatorPerformanceResponse,
	RecentCooksResponse,
} from '@/services/creator'
import { motion } from 'framer-motion'
import { ArrowLeft, ChefHat, Sparkles } from 'lucide-react'
import { TRANSITION_SPRING } from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'

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
	const [performanceData, setPerformanceData] =
		useState<CreatorPerformanceResponse | null>(null)
	const [recentCooksData, setRecentCooksData] =
		useState<RecentCooksResponse | null>(null)

	useEffect(() => {
		const fetchAll = async () => {
			setIsLoading(true)
			try {
				const [statsRes, perfRes, cooksRes] = await Promise.all([
					getCreatorStats(),
					getCreatorPerformance(),
					getRecentCooks(0, 10),
				])
				if (statsRes.success && statsRes.data) setStats(statsRes.data)
				if (perfRes.success && perfRes.data) setPerformanceData(perfRes.data)
				if (cooksRes.success && cooksRes.data) setRecentCooksData(cooksRes.data)
			} catch (err) {
				logDevError('Failed to fetch creator data:', err)
			} finally {
				setIsLoading(false)
			}
		}

		fetchAll()
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
	const recipePerformance = (performanceData?.recipes ?? []).map((r, idx) => ({
		id: r.id,
		rank: idx + 1,
		title: r.title,
		imageUrl: r.coverImageUrl?.[0] ?? '/placeholder-recipe.jpg',
		cookCount: r.cookCount,
		xpGenerated: r.creatorXpEarned ?? 0,
		badge:
			r.cookCount >= 100
				? { type: 'milestone' as const, label: '100+ Cooks' }
				: r.cookCount >= 50
					? { type: 'trending' as const, label: 'Popular' }
					: undefined,
		needsAttention: r.cookCount === 0 && r.viewCount > 10,
	}))

	const formatTimeAgo = (dateStr: string): string => {
		const date = new Date(dateStr)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMin = Math.floor(diffMs / 60000)
		if (diffMin < 60) return `${diffMin}m ago`
		const diffHrs = Math.floor(diffMin / 60)
		if (diffHrs < 24) return `${diffHrs}h ago`
		const diffDays = Math.floor(diffHrs / 24)
		if (diffDays < 7) return `${diffDays}d ago`
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	}

	const recentCooks = (recentCooksData?.cooks ?? []).map(c => ({
		id: c.sessionId,
		userId: c.cookUserId,
		userName: c.cookDisplayName ?? c.cookUsername ?? 'Chef',
		userAvatar: c.cookAvatarUrl ?? '/placeholder-avatar.png',
		recipeTitle: c.recipeTitle,
		xpEarned: 0, // Creator XP is tracked per-recipe, not per-session
		timeAgo: formatTimeAgo(c.completedAt),
	}))

	if (isLoading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl'>
					<div className='mb-6 flex items-center gap-3'>
						<div className='size-10 animate-pulse rounded-xl bg-bg-elevated' />
						<div className='size-12 animate-pulse rounded-2xl bg-bg-elevated' />
						<div className='h-8 w-48 animate-pulse rounded-lg bg-bg-elevated' />
					</div>
					<div className='space-y-4'>
						{[0, 1, 2, 3].map(i => (
							<div
								key={i}
								className='h-32 animate-pulse rounded-xl bg-bg-elevated'
							/>
						))}
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

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
