'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/i18n/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { ErrorState } from '@/components/ui/error-state'
import {
	ChallengeHistoryPage,
	type ChallengeDay,
} from '@/components/challenges'
import {
	getChallengeHistory,
	countCompletedDaysThisUtcWeek,
	ChallengeHistoryItem,
} from '@/services/challenge'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
	PremiumSurface,
	SurfaceSectionHeader,
} from '@/components/layout/PremiumSurface'

// ============================================
// HELPERS
// ============================================

/**
 * Transform API response to UI format
 */
const transformToChallengeDay = (item: ChallengeHistoryItem): ChallengeDay => ({
	id: item.id,
	date: new Date(item.date),
	status: item.completed ? 'completed' : 'missed',
	challenge: {
		title: item.title,
		emoji: '🎯', // Default emoji, API should provide this
		xp: item.bonusXpEarned,
	},
	recipeCooked: item.recipeCooked
		? {
				id: item.recipeCooked.id,
				title: item.recipeCooked.title,
				imageUrl: item.recipeCooked.imageUrl || '/placeholder-recipe.svg',
			}
		: undefined,
})

// ============================================
// PAGE
// ============================================

const HISTORY_PAGE_SIZE = 100

export default function ChallengeHistoryPageRoute() {
	const router = useRouter()
	const t = useTranslations('challenges')
	const tc = useTranslations('common')
	const [isLoading, setIsLoading] = useState(true)
	const [fetchError, setFetchError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState(false)
	const [currentPage, setCurrentPage] = useState(0)
	const [hasMore, setHasMore] = useState(false)
	const loadMoreInFlightRef = useRef(false)
	const [days, setDays] = useState<ChallengeDay[]>([])
	const [stats, setStats] = useState({
		currentStreak: 0,
		completedThisWeek: 0,
		totalDays: 7,
		bonusXpEarned: 0,
		bestStreak: 0,
		totalCompleted: 0,
		totalBonusXp: 0,
	})

	useEffect(() => {
		let cancelled = false
		const fetchHistory = async () => {
			setIsLoading(true)
			setFetchError(false)
			try {
				const response = await getChallengeHistory({
					page: 0,
					size: HISTORY_PAGE_SIZE,
				})
				if (cancelled) return
				if (response.success && response.data) {
					const { challenges, stats: apiStats } = response.data
					setDays(challenges.map(transformToChallengeDay))
					setCurrentPage(response.data.pagination.page)
					setHasMore(response.data.pagination.hasNext)
					setStats({
						currentStreak: apiStats.currentStreak,
						completedThisWeek: countCompletedDaysThisUtcWeek(challenges),
						totalDays: 7,
						bonusXpEarned: apiStats.totalBonusXp,
						bestStreak: apiStats.longestStreak,
						totalCompleted: apiStats.totalCompleted,
						totalBonusXp: apiStats.totalBonusXp,
					})
				} else {
					setFetchError(true)
				}
			} catch (err) {
				if (!cancelled) {
					logDevError('Failed to fetch challenge history:', err)
					toast.error(t('toastLoadHistoryFailed'))
					setFetchError(true)
				}
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchHistory()
		return () => {
			cancelled = true
		}
	}, [retryKey, t])

	const handleLoadMore = async () => {
		if (!hasMore || loadMoreInFlightRef.current) return

		loadMoreInFlightRef.current = true
		setIsLoadingMore(true)
		setLoadMoreError(false)
		const nextPage = currentPage + 1

		try {
			const response = await getChallengeHistory({
				page: nextPage,
				size: HISTORY_PAGE_SIZE,
			})
			if (!response.success || !response.data) {
				setLoadMoreError(true)
				return
			}

			const incomingDays = response.data.challenges.map(transformToChallengeDay)
			setDays(previousDays => {
				const knownIds = new Set(previousDays.map(day => day.id))
				return [
					...previousDays,
					...incomingDays.filter(day => !day.id || !knownIds.has(day.id)),
				]
			})
			setCurrentPage(response.data.pagination.page)
			setHasMore(response.data.pagination.hasNext)
		} catch (err) {
			logDevError('Failed to load more challenge history:', err)
			setLoadMoreError(true)
		} finally {
			loadMoreInFlightRef.current = false
			setIsLoadingMore(false)
		}
	}

	if (fetchError) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title={t('errorLoadHistory')}
						message={t('errorLoadHistoryDesc')}
						onRetry={() => setRetryKey(key => key + 1)}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	if (isLoading) {
		return (
			<PageContainer maxWidth='lg'>
				<div className='mx-auto max-w-3xl space-y-6 p-6'>
					<Skeleton className='h-10 w-64 rounded-xl' />
					<Skeleton className='h-56 w-full rounded-xl' />
					<Skeleton className='h-72 w-full rounded-xl' />
				</div>
			</PageContainer>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<PremiumSurface
					eyebrow={tc('eyebrows.challengeTimeline')}
					chipText={tc('eyebrows.nLoggedDays', {
						n: stats.totalCompleted,
					})}
					tone='streak'
					className='p-3 md:p-4'
				>
					<ChallengeHistoryPage
						days={days}
						stats={stats}
						hasMore={hasMore}
						isLoadingMore={isLoadingMore}
						loadMoreError={loadMoreError}
						onLoadMore={handleLoadMore}
						onBack={() => router.push('/challenges')}
					/>
				</PremiumSurface>

				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
