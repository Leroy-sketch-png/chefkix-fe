'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Zap } from 'lucide-react'

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
	const [followedIds, setFollowedIds] = useState<number[]>([])

	const handleFollow = (id: number) => {
		setFollowedIds(prev =>
			prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id],
		)
	}

	// Calculate XP progress if we have user statistics - with null safety
	const xpProgress =
		user?.statistics?.currentXP != null && user?.statistics?.currentXPGoal
			? (user.statistics.currentXP / user.statistics.currentXPGoal) * 100
			: 57 // Default value for display

	const currentXP = user?.statistics?.currentXP ?? 20
	const xpGoal = user?.statistics?.currentXPGoal ?? 35
	const xpToNext = Math.max(0, xpGoal - currentXP)

	return (
		<aside className='hidden w-right flex-shrink-0 overflow-y-auto border-l border-border-subtle bg-bg-card p-6 xl:flex xl:flex-col xl:gap-6'>
			{/* Progress Card */}
			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-lg backdrop-blur-sm backdrop-saturate'>
				<div className='mb-4 text-sm font-bold uppercase leading-tight tracking-[0.5px] text-text-primary'>
					Your Progress
				</div>
				<div className='mb-2 flex items-center gap-3'>
					<Zap className='h-7 w-7 fill-gold text-gold' />
					<div className='text-lg leading-tight text-text-primary'>
						<strong>{currentXP}</strong> / {xpGoal} XP
					</div>
				</div>
				<div className='h-2.5 overflow-hidden rounded-sm bg-bg-hover relative'>
					<div
						className='h-full rounded-sm bg-mint transition-all duration-500 ease-out relative overflow-hidden'
						style={{ width: `${Math.min(xpProgress, 100)}%` }}
					>
						{/* Shimmer effect on progress bar */}
						<div className='absolute inset-0 animate-xp-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent' />
					</div>
				</div>
				<div className='mt-2 text-sm leading-normal text-text-secondary'>
					{xpToNext} XP to next level!
				</div>
			</div>

			{/* Trending Creators Card */}
			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-lg backdrop-blur-sm backdrop-saturate'>
				<div className='mb-4 text-sm font-bold uppercase leading-tight tracking-[0.5px] text-text-primary'>
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
									className='relative h-11 overflow-hidden rounded-lg border-none bg-gradient-primary px-3 text-xs font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] before:absolute before:left-[-100%] before:top-0 before:h-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-card/30 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]'
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
