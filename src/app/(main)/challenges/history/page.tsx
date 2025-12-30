'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import {
	ChallengeHistoryPage,
	type ChallengeDay,
} from '@/components/challenges'
import {
	getChallengeHistory,
	ChallengeHistoryItem,
	ChallengeStats,
} from '@/services/challenge'

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
				imageUrl: '/placeholder-recipe.jpg', // API doesn't provide imageUrl in history
			}
		: undefined,
})

// ============================================
// PAGE
// ============================================

export default function ChallengeHistoryPageRoute() {
	const router = useRouter()
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
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
		const fetchHistory = async () => {
			setIsLoading(true)
			try {
				const response = await getChallengeHistory(30) // Get last 30 days
				if (response.success && response.data) {
					const { challenges, stats: apiStats } = response.data
					setDays(challenges.map(transformToChallengeDay))
					setStats({
						currentStreak: apiStats.currentStreak,
						completedThisWeek: 0, // Calculate from challenges
						totalDays: 7,
						bonusXpEarned: apiStats.totalBonusXp,
						bestStreak: apiStats.longestStreak,
						totalCompleted: apiStats.totalCompleted,
						totalBonusXp: apiStats.totalBonusXp,
					})
				}
			} catch (err) {
				console.error('Failed to fetch challenge history:', err)
			} finally {
				setIsLoading(false)
			}
		}

		fetchHistory()
	}, [currentMonth])

	const handleMonthChange = (direction: 'prev' | 'next') => {
		const newMonth = new Date(currentMonth)
		newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1))
		setCurrentMonth(newMonth)
	}

	// NOTE: Load more disabled until pagination API is implemented
	// When ready, add: onLoadMore={handleLoadMore} to ChallengeHistoryPage

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<ChallengeHistoryPage
					days={days}
					stats={stats}
					currentMonth={currentMonth}
					onMonthChange={handleMonthChange}
					onBack={() => router.back()}
					isLoadingMore={isLoadingMore}
				/>
			</PageContainer>
		</PageTransition>
	)
}
