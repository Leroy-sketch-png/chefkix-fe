'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useTransition } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreatorDashboard, StepHeatmap, TipHistory } from '@/components/creator'
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
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChefHat, BookOpen, Loader2 } from 'lucide-react'
import { TRANSITION_SPRING, BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import { formatShortTimeAgo } from '@/lib/utils'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'

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
	const t = useTranslations('creator')
	const { user } = useAuth()
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()
	const [isLoading, setIsLoading] = useState(true)
	const [fetchError, setFetchError] = useState(false)
	const [stats, setStats] = useState<CreatorStats | null>(null)
	const [performanceData, setPerformanceData] =
		useState<CreatorPerformanceResponse | null>(null)
	const [recentCooksData, setRecentCooksData] =
		useState<RecentCooksResponse | null>(null)
	const [heatmapRecipeId, setHeatmapRecipeId] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		const fetchAll = async () => {
			setIsLoading(true)
			setFetchError(false)
			try {
				const [statsRes, perfRes, cooksRes] = await Promise.all([
					getCreatorStats(),
					getCreatorPerformance(),
					getRecentCooks(0, 10),
				])
				if (cancelled) return
				const anySuccess =
					statsRes.success || perfRes.success || cooksRes.success
				if (!anySuccess) {
					setFetchError(true)
					return
				}
				if (statsRes.success && statsRes.data) setStats(statsRes.data)
				if (perfRes.success && perfRes.data) setPerformanceData(perfRes.data)
				if (cooksRes.success && cooksRes.data) setRecentCooksData(cooksRes.data)
			} catch (err) {
				if (cancelled) return
				logDevError('Failed to fetch creator data:', err)
				setFetchError(true)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchAll()
		return () => {
			cancelled = true
		}
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
				imageUrl: stats.topRecipe.coverImageUrl ?? '/placeholder-recipe.svg',
				cookTime: stats.topRecipe.cookTimeMinutes ?? 0,
				difficulty: mapDifficulty(stats.topRecipe.difficulty),
				cookCount: stats.topRecipe.cookCount,
				xpGenerated: stats.topRecipe.xpGenerated,
				rating: stats.topRecipe.averageRating ?? 0,
			}
		: null

	// Recipe performance from API
	const recipePerformance = (performanceData?.recipes ?? []).map((r, idx) => ({
		id: r.id,
		rank: idx + 1,
		title: r.title,
		imageUrl: r.coverImageUrl?.[0] ?? '/placeholder-recipe.svg',
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

	const recentCooks = (recentCooksData?.cooks ?? []).map(c => ({
		id: c.sessionId,
		userId: c.cookUserId,
		userName: c.cookDisplayName ?? c.cookUsername ?? 'Chef',
		userAvatar: c.cookAvatarUrl ?? '/placeholder-avatar.svg',
		recipeTitle: c.recipeTitle,
		xpEarned: c.xpEarned ?? 0,
		timeAgo: formatShortTimeAgo(c.completedAt),
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

	if (fetchError) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl'>
					<ErrorState
						title={t('failedToLoadAnalytics')}
						message={t('failedToLoadAnalyticsMessage')}
						onRetry={() => {
							setFetchError(false)
							setIsLoading(true)
							Promise.all([
								getCreatorStats(),
								getCreatorPerformance(),
								getRecentCooks(0, 10),
							])
								.then(([statsRes, perfRes, cooksRes]) => {
									const anySuccess =
										statsRes.success || perfRes.success || cooksRes.success
									if (!anySuccess) {
										setFetchError(true)
										return
									}
									if (statsRes.success && statsRes.data) setStats(statsRes.data)
									if (perfRes.success && perfRes.data)
										setPerformanceData(perfRes.data)
									if (cooksRes.success && cooksRes.data)
										setRecentCooksData(cooksRes.data)
								})
								.catch(() => setFetchError(true))
								.finally(() => setIsLoading(false))
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	// New creator with no recipes — show onboarding
	if (
		!stats ||
		(stats.totalRecipesPublished === 0 && recipePerformance.length === 0)
	) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl'>
					<EmptyStateGamified
						variant='custom'
						emoji='👨‍🍳'
						title={t('creatorStudioReady')}
						description={t('creatorStudioReadyDesc')}
						primaryAction={{
							label: t('createYourFirstRecipe'),
							href: '/create',
							icon: <BookOpen className='size-4' />,
						}}
						quickActions={[
							{ label: 'Explore top recipes', emoji: '🔥', href: '/explore' },
							{ label: 'Browse challenges', emoji: '🏆', href: '/challenges' },
						]}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			{/* Global navigation loading indicator */}
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed top-20 left-1/2 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='xl'>
				{/* Header with back button using PageHeader */}
				<div className='mb-6 flex items-center gap-3'>
					<motion.button
						type='button'
						onClick={() =>
							startNavigationTransition(() => {
								router.push('/dashboard')
							})
						}
						disabled={isNavigating}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
						aria-label={t('ariaGoToDashboard')}
					>
						<ArrowLeft className='size-5' />
					</motion.button>
					<div className='flex-1'>
						<PageHeader
							icon={ChefHat}
							title={t('dashboardTitle')}
							subtitle={t('dashboardSubtitle')}
							gradient='purple'
							marginBottom='sm'
							className='mb-0'
						/>
					</div>
				</div>
				<CreatorDashboard
					weekHighlight={weekHighlight}
					lifetimeStats={lifetimeStats}
					creatorBadges={creatorBadges}
					topRecipe={topRecipe}
					recipePerformance={recipePerformance}
					recentCooks={recentCooks}
					onCreateRecipe={() =>
						startNavigationTransition(() => {
							router.push('/create')
						})
					}
					onRecipeClick={id =>
						startNavigationTransition(() => {
							router.push(`/recipes/${id}`)
						})
					}
					onViewAllRecipes={() =>
						startNavigationTransition(() => {
							router.push('/creator/recipes')
						})
					}
					onViewStepAnalytics={id =>
						setHeatmapRecipeId(prev => (prev === id ? null : id))
					}
				/>
				{heatmapRecipeId && (
					<StepHeatmap
						recipeId={heatmapRecipeId}
						recipeTitle={
							recipePerformance.find(r => r.id === heatmapRecipeId)?.title
						}
						className='mt-6'
					/>
				)}
				<TipHistory className='mt-6' />
			</PageContainer>
		</PageTransition>
	)
}
