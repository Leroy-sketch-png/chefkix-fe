'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import {
	LeaderboardPage,
	type LeaderboardType,
	type Timeframe,
} from '@/components/leaderboard'
import type { LeaderboardEntry } from '@/components/leaderboard/LeaderboardItem'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

// ============================================
// MOCK DATA - TODO: Replace with API integration (MSW ready)
// ============================================

// Empty array for MSW preparation - will be replaced with API call
const mockEntries: LeaderboardEntry[] = []

// ============================================
// PAGE
// ============================================

export default function LeaderboardRoute() {
	const { user } = useAuth()
	const router = useRouter()
	const [type, setType] = useState<LeaderboardType>('global')
	const [timeframe, setTimeframe] = useState<Timeframe>('weekly')

	// TODO: Fetch from API - /api/v1/leaderboard
	const entries = mockEntries

	// TODO: Fetch my rank from API
	const myRank = user
		? {
				rank: 0,
				xpThisWeek: user.statistics?.currentXP ?? 0,
				recipesCooked: 0,
				xpToNextRank: 0,
				nextRankPosition: 0,
			}
		: undefined

	// Reset timer info - calculate from server time
	const resetInfo = {
		days: 0,
		hours: 0,
		minutes: 0,
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<LeaderboardPage
					entries={entries}
					myRank={myRank}
					resetInfo={resetInfo}
					type={type}
					timeframe={timeframe}
					onTypeChange={setType}
					onTimeframeChange={setTimeframe}
					onUserClick={entry => router.push(`/${entry.userId}`)}
					onBack={() => router.push('/dashboard')}
					onCookNow={() => router.push('/explore')}
				/>
			</PageContainer>
		</PageTransition>
	)
}
