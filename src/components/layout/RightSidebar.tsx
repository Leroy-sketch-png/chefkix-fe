'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { StreakWidget } from '@/components/streak'
import { ExpandableDailyChallengeBanner } from '@/components/challenges'
import { useRouter } from 'next/navigation'
import { getTodaysChallenge, DailyChallenge } from '@/services/challenge'
import { getAllProfiles } from '@/services/profile'
import { Profile } from '@/lib/types'

// ============================================
// COMPONENT
// ============================================

export const RightSidebar = () => {
	const { user } = useAuth()
	const router = useRouter()
	const [followedIds, setFollowedIds] = useState<string[]>([])
	const [suggestions, setSuggestions] = useState<Profile[]>([])
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
				// Fetch daily challenge and profile suggestions in parallel
				const [challengeResponse, profilesResponse] = await Promise.all([
					getTodaysChallenge(),
					getAllProfiles(),
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

	// TODO: Fetch streak data from user stats API
	const streakData = {
		currentStreak: user?.statistics?.streakCount ?? 0,
		weekProgress: [
			'future',
			'future',
			'future',
			'future',
			'today',
			'future',
			'future',
		] as ('cooked' | 'today' | 'future')[],
		isActiveToday: false,
		status: 'active' as const, // Default to active, will be computed from API
	}

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
