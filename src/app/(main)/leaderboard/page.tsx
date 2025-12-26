'use client'

import { useState, useEffect } from 'react'
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
import {
	getLeaderboard,
	type LeaderboardTimeframe,
} from '@/services/leaderboard'

// ============================================
// PAGE
// ============================================

export default function LeaderboardRoute() {
	const { user } = useAuth()
	const router = useRouter()
	const [type, setType] = useState<LeaderboardType>('global')
	const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
	const [entries, setEntries] = useState<LeaderboardEntry[]>([])
	const [myRank, setMyRank] = useState<
		| {
				rank: number
				xpThisWeek: number
				recipesCooked: number
				xpToNextRank: number
				nextRankPosition: number
		  }
		| undefined
	>(undefined)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchLeaderboard = async () => {
			setIsLoading(true)
			try {
				const response = await getLeaderboard({
					type: type as 'global' | 'friends' | 'league',
					timeframe: timeframe as LeaderboardTimeframe,
					limit: 50,
				})

				if (response.success && response.data) {
					// Transform API response to component format
					setEntries(
						response.data.entries.map(e => ({
							rank: e.rank,
							userId: e.userId,
							username: e.username,
							displayName: e.displayName,
							avatarUrl: e.avatarUrl,
							level: e.level,
							xpThisWeek: e.xpThisWeek,
							recipesCooked: e.recipesCooked,
							streak: e.streak,
							badge: undefined, // API doesn't return per-entry badges
						})),
					)

					if (response.data.myRank) {
						setMyRank({
							rank: response.data.myRank.rank,
							xpThisWeek: response.data.myRank.xpThisWeek,
							recipesCooked: response.data.myRank.recipesCooked ?? 0,
							xpToNextRank: response.data.myRank.xpToNextRank ?? 0,
							nextRankPosition: response.data.myRank.nextRankPosition ?? 0,
						})
					}
				}
			} catch (err) {
				console.error('Failed to fetch leaderboard:', err)
			} finally {
				setIsLoading(false)
			}
		}

		fetchLeaderboard()
	}, [type, timeframe])

	// Calculate reset timer (weekly resets on Sunday midnight UTC)
	const getResetInfo = () => {
		const now = new Date()
		const nextSunday = new Date(now)
		nextSunday.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7))
		nextSunday.setUTCHours(0, 0, 0, 0)
		if (nextSunday <= now) {
			nextSunday.setUTCDate(nextSunday.getUTCDate() + 7)
		}
		const diff = nextSunday.getTime() - now.getTime()
		const days = Math.floor(diff / (1000 * 60 * 60 * 24))
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
		return { days, hours, minutes }
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<LeaderboardPage
					entries={entries}
					myRank={myRank}
					resetInfo={getResetInfo()}
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
