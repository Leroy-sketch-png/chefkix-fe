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
import { toggleFollow as toggleFollowApi } from '@/services/social'
import { Profile } from '@/lib/types'
import { logDevError } from '@/lib/dev-log'
import { cn } from '@/lib/utils'
import { FriendsOnlineWidget } from '@/components/social/FriendsOnlineWidget'
import { usePresence } from '@/hooks/usePresence'

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
	usePresence() // Send heartbeat while sidebar is mounted
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
		// Don't fetch until user is authenticated
		if (!user) return

		const fetchData = async () => {
			try {
				// Fetch daily challenge, profile suggestions, and session history in parallel
				const [challengeResponse, profilesResponse, sessionResponse] =
					await Promise.all([
						getTodaysChallenge(),
						// TODO(perf): getAllProfiles() fetches all users just to take 5.
						// Replace with a dedicated suggestions endpoint with size=5.
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
				logDevError('Failed to fetch sidebar data:', err)
			}
		}

		fetchData()
	}, [user]) // Re-fetch when user changes (login/logout)

	const handleFollow = async (userId: string) => {
		// Optimistic UI update
		setFollowedIds(prev =>
			prev.includes(userId)
				? prev.filter(id => id !== userId)
				: [...prev, userId],
		)
		try {
			const response = await toggleFollowApi(userId)
			if (!response.success) {
				// Revert on failure
				setFollowedIds(prev =>
					prev.includes(userId)
						? prev.filter(id => id !== userId)
						: [...prev, userId],
				)
			}
		} catch (err) {
			// Revert on error
			setFollowedIds(prev =>
				prev.includes(userId)
					? prev.filter(id => id !== userId)
					: [...prev, userId],
			)
			logDevError('Failed to toggle follow:', err)
		}
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
		<aside
			className='hidden w-right flex-shrink-0 overflow-y-auto border-l border-border-subtle bg-bg-card p-5 xl:flex xl:flex-col xl:gap-5'
			aria-label='Complementary content'
		>
			{/* Friends Online Widget — real-time via presence heartbeat */}
			<FriendsOnlineWidget />

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
					onFindRecipe={() => router.push(`/explore?search=${encodeURIComponent(dailyChallenge.title)}`)}
				/>
			)}

			{/* Trending Creators Card */}
			{suggestions.length > 0 && (
				<div className='rounded-radius border border-border-subtle bg-bg-card p-5 shadow-card'>
					<div className='mb-4 text-sm font-bold uppercase leading-tight tracking-wide text-text-primary'>
						Suggested Creators
					</div>
					<div className='flex flex-col gap-3'>
						{suggestions.map(suggestion => {
							const isFollowed = followedIds.includes(suggestion.userId)
							return (
								<div
									key={suggestion.userId}
									className='flex items-center gap-3'
								>
									<div className='relative size-10 flex-shrink-0 overflow-hidden rounded-full shadow-sm transition-transform duration-200 hover:scale-105'>
										<Image
											src={suggestion.avatarUrl || '/placeholder-avatar.svg'}
											alt={suggestion.displayName || suggestion.username}
											fill
											sizes='40px'
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
										aria-pressed={isFollowed}
										className={cn(
											'relative h-9 overflow-hidden rounded-radius px-4 text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95',
											isFollowed
												? 'border border-border-medium bg-bg-card text-text-secondary hover:border-error/50 hover:text-error'
												: 'border-none bg-gradient-primary text-primary-foreground hover:shadow-md',
										)}
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
