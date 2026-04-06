'use client'

import { useTranslations } from 'next-intl'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, LIST_ITEM_HOVER, LIST_ITEM_TAP } from '@/lib/motion'
import { AnimatedNumber } from '@/components/ui/animated-number'

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
	const t = useTranslations('creator')
	return (
		<div className={cn('bg-bg-card rounded-2xl p-5', className)}>
			{/* Header */}
			<div className='flex items-center gap-2 mb-4'>
				<span className='text-xl'>??</span>
				<span className='flex-1 text-base font-bold text-text'>
					Creator Stats
				</span>
				<Link
					href={dashboardUrl}
					className='size-7 flex items-center justify-center bg-bg rounded-lg text-text-secondary hover:text-text transition-colors'
				>
					<ArrowRight className='size-4' />
				</Link>
			</div>

			{/* Stats Row */}
			<div className='flex gap-3 mb-4'>
				<div className='flex-1 flex flex-col items-center py-3 px-2 bg-bg rounded-lg'>
					<span className='text-lg font-display font-extrabold text-text'>
						<AnimatedNumber value={recipesCount} className='tabular-nums' />
					</span>
					<span className='text-2xs text-text-secondary'>{t('recipesLabel')}</span>
				</div>
				<div className='flex-1 flex flex-col items-center py-3 px-2 bg-bg rounded-lg'>
					<span className='text-lg font-display font-extrabold text-text'>
						<AnimatedNumber value={totalCooks} format={n => n.toLocaleString()} className='tabular-nums' />
					</span>
					<span className='text-2xs text-text-secondary'>{t('cooksLabel')}</span>
				</div>
				<div className='flex-1 flex flex-col items-center py-3 px-2 bg-success/10 rounded-lg'>
					<span className='text-lg font-display font-extrabold text-success'>
						+<AnimatedNumber value={xpEarned} format={n => n.toLocaleString()} className='tabular-nums' />
					</span>
					<span className='text-2xs text-text-secondary'>{t('xpEarned')}</span>
				</div>
			</div>

			{/* Top Recipe Highlight */}
			{topRecipe && (
				<div className='flex items-center gap-3 p-3 bg-bg rounded-xl'>
					<Image
						src={topRecipe.imageUrl || '/placeholder-recipe.svg'}
						alt={topRecipe.title}
						width={40}
						height={40}
						className='size-10 rounded-lg object-cover'
					/>
					<div className='flex-1 flex flex-col'>
						<span className='text-2xs text-text-secondary'>{t('topRecipe')}</span>
						<span className='text-sm font-bold text-text truncate'>
							{topRecipe.title}
						</span>
					</div>
					<span className='text-sm font-semibold text-brand'>
						<AnimatedNumber value={topRecipe.cookCount} className='tabular-nums' /> cooks
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
	const t = useTranslations('creator')
	const remainingCount = cookersCount - cookerAvatars.length

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex items-center gap-3.5 py-3.5 px-4',
				'bg-gradient-to-r from-xp/10 to-xp/5',
				'border border-xp/20 rounded-2xl',
				className,
			)}
		>
			{/* Avatar Stack */}
			<div className='flex items-center'>
				{cookerAvatars.slice(0, 2).map((avatar, index) => (
					<Image
						key={index}
						src={avatar || '/placeholder-avatar.svg'}
						alt=''
						width={32}
						height={32}
						className={cn(
							'size-8 rounded-full border-3 border-bg-card',
							index > 0 && '-ml-2.5',
						)}
					/>
				))}
				{remainingCount > 0 && (
					<div className='size-8 flex items-center justify-center bg-xp rounded-full border-3 border-bg-card -ml-2.5 text-xs font-bold text-white'>
						+{remainingCount}
					</div>
				)}
			</div>

			{/* Content */}
			<div className='flex-1 flex flex-col'>
				<span className='text-sm font-semibold text-text'>
					{cookersCount} people cooked your recipes today!
				</span>
				<span className='text-sm font-bold text-success'>
					+{totalXpEarned} XP earned as creator
				</span>
			</div>

			{/* View Button */}
			{onView && (
				<motion.button
					type='button'
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					onClick={onView}
					className='py-2 px-3.5 bg-xp rounded-lg text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					View
				</motion.button>
			)}
		</motion.div>
	)
}

export default CreatorStatsWidget
