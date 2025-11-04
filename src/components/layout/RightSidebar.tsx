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

	// Calculate XP progress if we have user statistics
	const xpProgress =
		user?.statistics?.currentXP && user?.statistics?.currentXPGoal
			? (user.statistics.currentXP / user.statistics.currentXPGoal) * 100
			: 57 // Default value for display

	const currentXP = user?.statistics?.currentXP || 20
	const xpGoal = user?.statistics?.currentXPGoal || 35
	const xpToNext = xpGoal - currentXP

	return (
		<aside className='hidden border-l border-border-color bg-panel-bg p-6 lg:flex lg:flex-col lg:gap-6'>
			{/* Progress Card */}
			<div className='rounded-radius border border-white/[0.18] bg-white/70 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-[10px] backdrop-saturate-[180%]'>
				<div className='mb-4 text-[14px] font-bold uppercase tracking-[0.5px]'>
					Your Progress
				</div>
				<div className='mb-2 flex items-center gap-3'>
					<Zap className='h-7 w-7 fill-gold text-gold' />
					<div className='text-lg'>
						<strong>{currentXP}</strong> / {xpGoal} XP
					</div>
				</div>
				<div className='h-2.5 overflow-hidden rounded-[5px] bg-black/10'>
					<div
						className='h-full rounded-[5px] bg-mint transition-all duration-500 ease-out'
						style={{ width: `${Math.min(xpProgress, 100)}%` }}
					/>
				</div>
				<div className='mt-2 text-[13px] text-muted'>
					{xpToNext} XP to next level!
				</div>
			</div>

			{/* Trending Creators Card */}
			<div className='rounded-radius border border-white/[0.18] bg-white/70 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-[10px] backdrop-saturate-[180%]'>
				<div className='mb-4 text-[14px] font-bold uppercase tracking-[0.5px]'>
					Trending Creators
				</div>
				<div className='flex flex-col gap-3'>
					{suggestions.map(suggestion => {
						const isFollowed = followedIds.includes(suggestion.id)
						return (
							<div key={suggestion.id} className='flex items-center gap-3'>
								<div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full shadow-[0_0_0_2px_var(--panel-bg),0_0_0_3px_#667eea,0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_0_2px_var(--panel-bg),0_0_0_3px_#667eea,0_6px_16px_rgba(102,126,234,0.3)]'>
									<Image
										src={suggestion.avatar}
										alt={suggestion.name}
										fill
										className='object-cover'
									/>
								</div>
								<div className='min-w-0 flex-1'>
									<strong className='block text-[14px]'>
										{suggestion.name}
									</strong>
									<span className='block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-muted'>
										{suggestion.description}
									</span>
								</div>
								<button
									onClick={() => handleFollow(suggestion.id)}
									className='relative overflow-hidden rounded-[20px] border-none bg-gradient-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_4px_15px_0_rgba(102,126,234,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(102,126,234,0.6)] active:translate-y-0 active:scale-[0.98] before:absolute before:left-[-100%] before:top-0 before:h-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]'
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
