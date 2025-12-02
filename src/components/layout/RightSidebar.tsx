'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { StreakWidget } from '@/components/streak'
import { ExpandableDailyChallengeBanner } from '@/components/challenges'
import { useRouter } from 'next/navigation'
import { getTodaysChallenge } from '@/services/challenge'
import { getAllProfiles } from '@/services/profile'
import { getSessionHistory } from '@/services/cookingSession'
import { Profile } from '@/lib/types'

// ============================================
// HELPER: Compute week progress from cooking session history
// ============================================

type DayStatus = 'cooked' | 'today' | 'future'

function computeWeekProgress(
	cookDates: Date[],
	lastCookDate?: string,
): { weekProgress: DayStatus[]; isActiveToday: boolean } {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	// Get start of week (Monday)
	const dayOfWeek = today.getDay()
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
	const monday = new Date(today)
	monday.setDate(today.getDate() + mondayOffset)

	// Create set of cooked dates (as date strings for comparison)
	const cookedDateSet = new Set(
		cookDates.map(d => {
			const normalized = new Date(d)
			normalized.setHours(0, 0, 0, 0)
			return normalized.toDateString()
		}),
	)

	// Check if last cook was today
	const isActiveToday = lastCookDate
		? new Date(lastCookDate).toDateString() === today.toDateString()
		: cookedDateSet.has(today.toDateString())

	// Build week progress array (Mon-Sun)
	const weekProgress: DayStatus[] = []
	for (let i = 0; i < 7; i++) {
		const date = new Date(monday)
		date.setDate(monday.getDate() + i)
		date.setHours(0, 0, 0, 0)

		if (date.toDateString() === today.toDateString()) {
			weekProgress.push('today')
		} else if (date > today) {
			weekProgress.push('future')
		} else if (cookedDateSet.has(date.toDateString())) {
			weekProgress.push('cooked')
		} else {
			weekProgress.push('future') // Missed days show as future (no special state)
		}
	}

	return { weekProgress, isActiveToday }
}

// ============================================
// COMPONENT
// ============================================

export const RightSidebar = () => {
	const { user } = useAuth()
	const router = useRouter()
	const [followedIds, setFollowedIds] = useState<string[]>([])
	const [suggestions, setSuggestions] = useState<Profile[]>([])
	const [cookDates, setCookDates] = useState<Date[]>([])
	const [dailyChallenge, setDailyChallenge] = useState<{
		id: string
		title: string
		description: string
		icon: string
		bonusXp: number
		endsAt: Date
	} | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch daily challenge, profile suggestions, and session history in parallel
				const [challengeResponse, profilesResponse, sessionResponse] =
					await Promise.all([
						getTodaysChallenge(),
						getAllProfiles(),
						getSessionHistory({ status: 'all', size: 100 }),
					])

				if (challengeResponse.success && challengeResponse.data) {
					const data = challengeResponse.data
					setDailyChallenge({
						id: data.id,
						title: data.title,
						description: data.description,
						icon: data.icon,
						bonusXp: data.bonusXp,
						endsAt: new Date(data.endsAt),
					})
				}

				if (profilesResponse.success && profilesResponse.data) {
					// Filter out current user and limit to 5 suggestions
					const filtered = profilesResponse.data
						.filter(p => p.userId !== user?.userId)
						.slice(0, 5)
					setSuggestions(filtered)
				}

				// Extract completed session dates for streak calculation
				if (sessionResponse.success && sessionResponse.data?.sessions) {
					const completedDates = sessionResponse.data.sessions
						.filter(s => s.status === 'completed' || s.status === 'posted')
						.map(s => new Date(s.completedAt || s.startedAt))
					setCookDates(completedDates)
				}
			} catch (err) {
				console.error('Failed to fetch sidebar data:', err)
			}
		}

		fetchData()
	}, [user?.userId])

	const handleFollow = (userId: string) => {
		setFollowedIds(prev =>
			prev.includes(userId)
				? prev.filter(id => id !== userId)
				: [...prev, userId],
		)
	}

	// Compute streak data from user stats + cooking session history
	const streakData = useMemo(() => {
		const { weekProgress, isActiveToday } = computeWeekProgress(
			cookDates,
			user?.lastCookDate,
		)
		const currentStreak = user?.statistics?.streakCount ?? 0

		// Determine streak status (must match StreakWidget props: 'active' | 'at-risk')
		let status: 'active' | 'at-risk' = 'active'
		if (currentStreak > 0 && !isActiveToday) {
			status = 'at-risk' // Has streak but hasn't cooked today
		}

		return {
			currentStreak,
			weekProgress,
			isActiveToday,
			status,
		}
	}, [cookDates, user?.statistics?.streakCount, user?.lastCookDate])

	return (
		<aside className='hidden w-right flex-shrink-0 overflow-y-auto border-l border-border-subtle bg-bg-card p-4 xl:flex xl:flex-col xl:gap-4'>
			{/* Streak Widget */}
			<StreakWidget
				currentStreak={streakData.currentStreak}
				weekProgress={streakData.weekProgress}
				isActiveToday={streakData.isActiveToday}
				status={streakData.status}
			/>

			{/* Daily Challenge Banner (Expandable) */}
			{dailyChallenge && (
				<ExpandableDailyChallengeBanner
					challenge={dailyChallenge}
					onFindRecipe={() => router.push('/explore?challenge=pasta')}
				/>
			)}

			{/* Trending Creators Card */}
			{suggestions.length > 0 && (
				<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-lg backdrop-blur-sm backdrop-saturate'>
					<div className='mb-4 text-sm font-bold uppercase leading-tight tracking-wide text-text-primary'>
						Trending Creators
					</div>
					<div className='flex flex-col gap-3'>
						{suggestions.map(suggestion => {
							const isFollowed = followedIds.includes(suggestion.userId)
							return (
								<div
									key={suggestion.userId}
									className='flex items-center gap-3'
								>
									<div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg'>
										<Image
											src={suggestion.avatarUrl || '/placeholder-avatar.png'}
											alt={suggestion.displayName || suggestion.username}
											fill
											className='object-cover'
										/>
									</div>
									<div className='min-w-0 flex-1'>
										<strong className='block text-sm leading-tight text-text-primary'>
											{suggestion.displayName || suggestion.username}
										</strong>
										<span className='block overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-normal text-text-secondary'>
											@{suggestion.username}
										</span>
									</div>
									<button
										onClick={() => handleFollow(suggestion.userId)}
										className='relative h-9 overflow-hidden rounded-lg border-none bg-gradient-primary px-3 text-xs font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]'
									>
										{isFollowed ? 'Following' : 'Follow'}
									</button>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</aside>
	)
}
