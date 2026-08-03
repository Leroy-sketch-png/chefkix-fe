'use client'

import { useState, useEffect } from 'react'
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

export default function ChallengeHistoryPageRoute() {
	const router = useRouter()
	const t = useTranslations('challenges')
	const tc = useTranslations('common')
	const [isLoading, setIsLoading] = useState(true)
	const [fetchError, setFetchError] = useState(false)
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
				const response = await getChallengeHistory(100)
				if (cancelled) return
				if (response.success && response.data) {
					const { challenges, stats: apiStats } = response.data
					setDays(challenges.map(transformToChallengeDay))
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
	}, [t])

	if (fetchError) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title={t('errorLoadHistory')}
						message={t('errorLoadHistoryDesc')}
						onRetry={() => {
							setIsLoading(true)
							setFetchError(false)
							window.location.reload()
						}}
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
					chipText={tc('eyebrows.nLoggedDays', { n: days.length })}
					tone='streak'
					className='p-3 md:p-4'
				>
					<ChallengeHistoryPage
						days={days}
						stats={stats}
						onBack={() => router.back()}
					/>
				</PremiumSurface>

				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
