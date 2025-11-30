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

export default function LeaderboardRoute() {
	const { user } = useAuth()
	const router = useRouter()
	const [type, setType] = useState<LeaderboardType>('global')
	const [timeframe, setTimeframe] = useState<Timeframe>('weekly')

	// Mock leaderboard entries - in production, fetch from API
	const mockEntries: LeaderboardEntry[] = [
		{
			rank: 1,
			userId: 'user-1',
			username: 'chefmasterx',
			displayName: 'ChefMasterX',
			avatarUrl: 'https://i.pravatar.cc/48?u=1',
			xpThisWeek: 2450,
			recipesCooked: 28,
			level: 15,
			streak: 21,
		},
		{
			rank: 2,
			userId: 'user-2',
			username: 'pastaqueen',
			displayName: 'PastaQueen',
			avatarUrl: 'https://i.pravatar.cc/48?u=2',
			xpThisWeek: 2180,
			recipesCooked: 24,
			level: 14,
			streak: 18,
		},
		{
			rank: 3,
			userId: 'user-3',
			username: 'ramenking',
			displayName: 'RamenKing',
			avatarUrl: 'https://i.pravatar.cc/48?u=3',
			xpThisWeek: 1920,
			recipesCooked: 21,
			level: 13,
			streak: 14,
		},
		{
			rank: 4,
			userId: 'user-4',
			username: 'spicelord',
			displayName: 'SpiceLord',
			avatarUrl: 'https://i.pravatar.cc/48?u=4',
			xpThisWeek: 1650,
			recipesCooked: 18,
			level: 12,
			streak: 9,
		},
		{
			rank: 5,
			userId: 'user-5',
			username: 'bakemaster',
			displayName: 'BakeMaster',
			avatarUrl: 'https://i.pravatar.cc/48?u=5',
			xpThisWeek: 1420,
			recipesCooked: 16,
			level: 11,
			streak: 7,
		},
	]

	// Mock my rank info
	const myRank = user
		? {
				rank: 42,
				xpThisWeek: user.statistics?.currentXP ?? 500,
				recipesCooked: 5,
				xpToNextRank: 120,
				nextRankPosition: 41,
			}
		: undefined

	// Reset timer info
	const resetInfo = {
		days: 2,
		hours: 14,
		minutes: 32,
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<LeaderboardPage
					entries={mockEntries}
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
