'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { StreakWidget } from '@/components/streak'
import { ExpandableDailyChallengeBanner } from '@/components/challenges'
import { useRouter } from 'next/navigation'
import { getTodaysChallenge } from '@/services/challenge'
import {
	getSuggestedFollows,
	toggleFollow as toggleFollowApi,
} from '@/services/social'
import { getSessionHistory } from '@/services/cookingSession'
import { Profile } from '@/lib/types'
import { logDevError } from '@/lib/dev-log'
import { cn } from '@/lib/utils'
import { FriendsOnlineWidget } from '@/components/social/FriendsOnlineWidget'
import { usePresence } from '@/hooks/usePresence'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { FOLLOW_PULSE, TRANSITION_SPRING } from '@/lib/motion'

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
	const followingLockRef = useRef(new Set<string>())
	const [suggestions, setSuggestions] = useState<Profile[]>([])
	const [cookDates, setCookDates] = useState<Date[]>([])
	const [sidebarError, setSidebarError] = useState(false)
	const [retryCount, setRetryCount] = useState(0)
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
			setSidebarError(false)
			try {
				// Fetch daily challenge, profile suggestions, and session history in parallel
				const [challengeResponse, profilesResponse, sessionResponse] =
					await Promise.all([
						getTodaysChallenge(),
						getSuggestedFollows(5),
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
					setSuggestions(profilesResponse.data)
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
				setSidebarError(true)
			}
		}

		fetchData()
	}, [user, retryCount]) // Re-fetch when user changes or on retry

	const handleFollow = useCallback(
		async (userId: string) => {
			if (followingLockRef.current.has(userId)) return
			followingLockRef.current.add(userId)
			const wasFollowed = followedIds.includes(userId)
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
					toast.error(wasFollowed ? 'Failed to unfollow' : 'Failed to follow')
				}
			} catch (err) {
				// Revert on error
				setFollowedIds(prev =>
					prev.includes(userId)
						? prev.filter(id => id !== userId)
						: [...prev, userId],
				)
				logDevError('Failed to toggle follow:', err)
				toast.error(
					wasFollowed
						? 'Failed to unfollow. Please try again.'
						: 'Failed to follow. Please try again.',
				)
			} finally {
				followingLockRef.current.delete(userId)
			}
		},
		[followedIds],
	)

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
			{/* Sidebar error state — shown when data fetch fails entirely */}
			{sidebarError && (
				<div className='flex flex-col items-center gap-3 rounded-radius border border-border-subtle bg-bg-elevated p-4 text-center'>
					<AlertTriangle className='size-5 text-text-muted' />
					<p className='text-xs text-text-secondary'>Failed to load sidebar</p>
					<button
						type='button'
						onClick={() => setRetryCount(c => c + 1)}
						className='flex items-center gap-1.5 rounded-lg bg-bg-card px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-bg-hover'
					>
						<RefreshCw className='size-3' />
						Retry
					</button>
				</div>
			)}

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
					onFindRecipe={() =>
						router.push(
							`/explore?search=${encodeURIComponent(dailyChallenge.title)}`,
						)
					}
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
									<div className='relative size-10 flex-shrink-0 overflow-hidden rounded-full shadow-card transition-transform duration-200 hover:scale-105'>
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
									<motion.button
										onClick={() => handleFollow(suggestion.userId)}
										aria-pressed={isFollowed}
										animate={isFollowed ? FOLLOW_PULSE.followed : undefined}
										initial={false}
										transition={TRANSITION_SPRING}
										className={cn(
											'relative h-9 overflow-hidden rounded-radius px-4 text-xs font-semibold shadow-card transition-all duration-200 active:scale-95',
											isFollowed
												? 'border border-border-medium bg-bg-card text-text-secondary hover:border-error/50 hover:text-error'
												: 'border-none bg-gradient-primary text-white hover:shadow-card',
										)}
									>
										{isFollowed ? 'Following' : 'Follow'}
									</motion.button>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</aside>
	)
}
