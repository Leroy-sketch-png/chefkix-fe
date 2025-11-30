'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'

// ============================================================================
// TYPES
// ============================================================================

export interface CreatorStatsWidgetProps {
	recipesCount: number
	totalCooks: number
	xpEarned: number
	topRecipe?: {
		id: string
		title: string
		imageUrl: string
		cookCount: number
	}
	dashboardUrl?: string
	className?: string
}

// ============================================================================
// CREATOR STATS WIDGET (Compact for Profile/Sidebar)
// ============================================================================

export function CreatorStatsWidget({
	recipesCount,
	totalCooks,
	xpEarned,
	topRecipe,
	dashboardUrl = '/creator/dashboard',
	className,
}: CreatorStatsWidgetProps) {
	return (
		<div className={cn('bg-panel-bg rounded-2xl p-5', className)}>
			{/* Header */}
			<div className='flex items-center gap-2 mb-4'>
				<span className='text-xl'>📝</span>
				<span className='flex-1 text-base font-bold text-text'>
					Creator Stats
				</span>
				<Link
					href={dashboardUrl}
					className='w-7 h-7 flex items-center justify-center bg-bg rounded-lg text-muted hover:text-text transition-colors'
				>
					<ArrowRight className='w-4 h-4' />
				</Link>
			</div>

			{/* Stats Row */}
			<div className='flex gap-3 mb-4'>
				<div className='flex-1 flex flex-col items-center py-3 px-2 bg-bg rounded-lg'>
					<span className='text-lg font-extrabold text-text'>
						{recipesCount}
					</span>
					<span className='text-2xs text-muted'>Recipes</span>
				</div>
				<div className='flex-1 flex flex-col items-center py-3 px-2 bg-bg rounded-lg'>
					<span className='text-lg font-extrabold text-text'>
						{totalCooks.toLocaleString()}
					</span>
					<span className='text-2xs text-muted'>Cooks</span>
				</div>
				<div className='flex-1 flex flex-col items-center py-3 px-2 bg-gradient-to-b from-emerald-500/10 to-teal-500/5 rounded-lg'>
					<span className='text-lg font-extrabold text-emerald-500'>
						+{xpEarned.toLocaleString()}
					</span>
					<span className='text-2xs text-muted'>XP Earned</span>
				</div>
			</div>

			{/* Top Recipe Highlight */}
			{topRecipe && (
				<div className='flex items-center gap-3 p-3 bg-bg rounded-xl'>
					<Image
						src={topRecipe.imageUrl || '/images/recipe-placeholder.jpg'}
						alt={topRecipe.title}
						width={40}
						height={40}
						className='w-10 h-10 rounded-lg object-cover'
					/>
					<div className='flex-1 flex flex-col'>
						<span className='text-2xs text-muted'>Top Recipe</span>
						<span className='text-sm font-bold text-text truncate'>
							{topRecipe.title}
						</span>
					</div>
					<span className='text-sm font-semibold text-primary'>
						{topRecipe.cookCount} cooks
					</span>
				</div>
			)}
		</div>
	)
}

// ============================================================================
// CREATOR XP NOTIFICATION (Inline Toast Style)
// ============================================================================

export interface CreatorXPNotificationProps {
	cookersCount: number
	cookerAvatars: string[] // Max 2 shown
	totalXpEarned: number
	onView?: () => void
	className?: string
}

export function CreatorXPNotification({
	cookersCount,
	cookerAvatars,
	totalXpEarned,
	onView,
	className,
}: CreatorXPNotificationProps) {
	const remainingCount = cookersCount - cookerAvatars.length

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex items-center gap-3.5 py-3.5 px-4',
				'bg-gradient-to-r from-purple-500/10 to-indigo-500/5',
				'border border-purple-500/20 rounded-2xl',
				className,
			)}
		>
			{/* Avatar Stack */}
			<div className='flex items-center'>
				{cookerAvatars.slice(0, 2).map((avatar, index) => (
					<Image
						key={index}
						src={avatar || '/images/default-avatar.png'}
						alt=''
						width={32}
						height={32}
						className={cn(
							'w-8 h-8 rounded-full border-[3px] border-panel-bg',
							index > 0 && '-ml-2.5',
						)}
					/>
				))}
				{remainingCount > 0 && (
					<div className='w-8 h-8 flex items-center justify-center bg-indigo-500 rounded-full border-[3px] border-panel-bg -ml-2.5 text-xs font-bold text-white'>
						+{remainingCount}
					</div>
				)}
			</div>

			{/* Content */}
			<div className='flex-1 flex flex-col'>
				<span className='text-sm font-semibold text-text'>
					{cookersCount} people cooked your recipes today!
				</span>
				<span className='text-sm font-bold text-emerald-500'>
					+{totalXpEarned} XP earned as creator
				</span>
			</div>

			{/* View Button */}
			{onView && (
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={onView}
					className='py-2 px-3.5 bg-purple-500 rounded-lg text-sm font-semibold text-white'
				>
					View
				</motion.button>
			)}
		</motion.div>
	)
}

export default CreatorStatsWidget
