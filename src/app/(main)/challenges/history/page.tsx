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
// MOCK DATA
// ============================================

const generateMockDays = (): ChallengeDay[] => {
	const today = new Date()
	const days: ChallengeDay[] = []

	const challenges = [
		{ title: 'Spice Master', emoji: '🌶️', xp: 75 },
		{ title: 'Seafood Splash', emoji: '🍣', xp: 50 },
		{ title: 'Italian Night', emoji: '🇮🇹', xp: 50 },
		{ title: 'Plant Power', emoji: '🥬', xp: 75 },
		{ title: 'Quick Bite', emoji: '⏱️', xp: 25 },
		{ title: 'Noodle Day', emoji: '🍜', xp: 50 },
		{ title: 'Sweet Treat', emoji: '🍰', xp: 50 },
		{ title: 'Comfort Food', emoji: '🍲', xp: 50 },
		{ title: 'Grill Master', emoji: '🥩', xp: 75 },
		{ title: 'Breakfast Club', emoji: '🥞', xp: 50 },
	]

	for (let i = 0; i < 14; i++) {
		const date = new Date(today)
		date.setDate(date.getDate() - i)

		const challenge = challenges[i % challenges.length]

		let status: ChallengeDay['status']
		if (i === 0) {
			status = 'today'
		} else if (i === 3 || i === 8) {
			status = 'missed'
		} else {
			status = 'completed'
		}

		days.push({
			date,
			status,
			challenge,
			recipeCooked:
				status !== 'missed'
					? {
							id: `recipe-${i}`,
							title: `${challenge.title} Recipe`,
							imageUrl: `https://i.imgur.com/v8SjYfT.jpeg`,
						}
					: undefined,
		})
	}

	// Add a future day
	const tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)
	days.unshift({
		date: tomorrow,
		status: 'upcoming',
		challenge: { title: 'Sweet Treat', emoji: '🍰', xp: 50 },
	})

	return days
}

// ============================================
// PAGE
// ============================================

export default function ChallengeHistoryPageRoute() {
	const router = useRouter()
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [isLoadingMore, setIsLoadingMore] = useState(false)

	const mockDays = generateMockDays()

	const stats = {
		currentStreak: 5,
		completedThisWeek: 5,
		totalDays: 7,
		bonusXpEarned: 275,
		bestStreak: 12,
		totalCompleted: 47,
		totalBonusXp: 2450,
	}

	const handleMonthChange = (direction: 'prev' | 'next') => {
		const newMonth = new Date(currentMonth)
		newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1))
		setCurrentMonth(newMonth)
	}

	const handleLoadMore = () => {
		setIsLoadingMore(true)
		// Simulate loading
		setTimeout(() => setIsLoadingMore(false), 1000)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<ChallengeHistoryPage
					days={mockDays}
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
