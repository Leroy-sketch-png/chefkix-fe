'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import {
	ChallengeHistoryPage,
	type ChallengeDay,
} from '@/components/challenges'

// ============================================
// MOCK DATA - TODO: Replace with API integration (MSW ready)
// ============================================

// Empty array for MSW preparation - will be replaced with API call
const mockDays: ChallengeDay[] = []

// Default stats for empty state
const defaultStats = {
	currentStreak: 0,
	completedThisWeek: 0,
	totalDays: 7,
	bonusXpEarned: 0,
	bestStreak: 0,
	totalCompleted: 0,
	totalBonusXp: 0,
}

// ============================================
// PAGE
// ============================================

export default function ChallengeHistoryPageRoute() {
	const router = useRouter()
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [isLoadingMore, setIsLoadingMore] = useState(false)

	// TODO: Fetch from API - /api/v1/challenges/history
	const days = mockDays
	const stats = defaultStats

	const handleMonthChange = (direction: 'prev' | 'next') => {
		const newMonth = new Date(currentMonth)
		newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1))
		setCurrentMonth(newMonth)
	}

	const handleLoadMore = () => {
		setIsLoadingMore(true)
		// TODO: Fetch next page from API
		setTimeout(() => setIsLoadingMore(false), 1000)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<ChallengeHistoryPage
					days={days}
					stats={stats}
					currentMonth={currentMonth}
					onMonthChange={handleMonthChange}
					onBack={() => router.back()}
					onLoadMore={handleLoadMore}
					isLoadingMore={isLoadingMore}
				/>
			</PageContainer>
		</PageTransition>
	)
}
