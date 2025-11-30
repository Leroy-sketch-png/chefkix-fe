'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { StreakWidget } from '@/components/streak'
import { ExpandableDailyChallengeBanner } from '@/components/challenges'
import { useRouter } from 'next/navigation'

const suggestions = [
	{
		id: 1,
		name: 'RamenKing',
		description: 'Makes amazing noodles',
		avatar: 'https://i.pravatar.cc/40?u=follow1',
	},
	{
		id: 2,
		name: 'PastryQueen',
		description: 'Desserts and pastries',
		avatar: 'https://i.pravatar.cc/40?u=follow2',
	},
]

export const RightSidebar = () => {
	const { user } = useAuth()
	const router = useRouter()
	const [followedIds, setFollowedIds] = useState<number[]>([])

	const handleFollow = (id: number) => {
		setFollowedIds(prev =>
			prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id],
		)
	}

	// Mock streak data - in production, this comes from user stats
	const streakData = {
		currentStreak: user?.statistics?.streakCount ?? 5,
		weekProgress: [
			'cooked',
			'cooked',
			'cooked',
			'cooked',
			'today',
			'future',
			'future',
		] as ('cooked' | 'today' | 'future')[],
		isActiveToday: true,
		status: 'active' as const,
	}

	// Mock daily challenge - in production, fetch from API
	const dailyChallenge = {
		id: 'daily-pasta',
		title: 'Pasta Master',
		description: 'Cook any pasta dish today to earn bonus XP!',
		icon: '🍝',
		bonusXp: 25,
		endsAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
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
			<ExpandableDailyChallengeBanner
				challenge={dailyChallenge}
				onFindRecipe={() => router.push('/explore?challenge=pasta')}
			/>

			{/* Trending Creators Card */}
			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-lg backdrop-blur-sm backdrop-saturate'>
				<div className='mb-4 text-sm font-bold uppercase leading-tight tracking-wide text-text-primary'>
					Trending Creators
				</div>
				<div className='flex flex-col gap-3'>
					{suggestions.map(suggestion => {
						const isFollowed = followedIds.includes(suggestion.id)
						return (
							<div key={suggestion.id} className='flex items-center gap-3'>
								<div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg'>
									<Image
										src={suggestion.avatar}
										alt={suggestion.name}
										fill
										className='object-cover'
									/>
								</div>
								<div className='min-w-0 flex-1'>
									<strong className='block text-sm leading-tight text-text-primary'>
										{suggestion.name}
									</strong>
									<span className='block overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-normal text-text-secondary'>
										{suggestion.description}
									</span>
								</div>
								<button
									onClick={() => handleFollow(suggestion.id)}
									className='relative h-9 overflow-hidden rounded-lg border-none bg-gradient-primary px-3 text-xs font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]'
								>
									{isFollowed ? 'Following' : 'Follow'}
								</button>
							</div>
						)
					})}
				</div>
			</div>
		</aside>
	)
}
