'use client'

import { motion } from 'framer-motion'
import { Flame, Utensils, TrendingUp, TrendingDown } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'

// ============================================================================
// TYPES
// ============================================================================

export interface LeaderboardEntry {
	rank: number
	userId: string
	username: string
	displayName: string
	avatarUrl: string
	level: number
	xpThisWeek: number
	xpThisMonth?: number
	xpAllTime?: number
	recipesCooked: number
	streak: number
	isCurrentUser?: boolean
}

export interface LeaderboardItemProps {
	entry: LeaderboardEntry
	variant?: 'default' | 'promotion' | 'demotion' | 'leading'
	showStats?: boolean
	xpDiff?: number
	onClick?: (entry: LeaderboardEntry) => void
	className?: string
}

// ============================================================================
// LEADERBOARD ITEM COMPONENT
// ============================================================================

export function LeaderboardItem({
	entry,
	variant = 'default',
	showStats = true,
	xpDiff,
	onClick,
	className,
}: LeaderboardItemProps) {
	const isCurrentUser = entry.isCurrentUser
	const isLeading = variant === 'leading'
	const isPromotion = variant === 'promotion'
	const isDemotion = variant === 'demotion'

	return (
		<motion.div
			whileHover={{ backgroundColor: 'var(--bg)' }}
			whileTap={{ scale: 0.99 }}
			transition={TRANSITION_SPRING}
			onClick={() => onClick?.(entry)}
			className={cn(
				'flex items-center gap-3 p-3.5 rounded-xl transition-colors cursor-pointer',
				isCurrentUser &&
					!isLeading &&
					'bg-gradient-to-r from-indigo-500/15 to-purple-500/8 border-2 border-indigo-500/30',
				isLeading &&
					'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-2 border-emerald-500/30',
				isPromotion && 'border-l-[3px] border-l-emerald-500',
				isDemotion && 'border-l-[3px] border-l-red-500',
				className,
			)}
		>
			{/* Rank */}
			<span
				className={cn(
					'w-8 text-base font-extrabold text-center',
					isCurrentUser ? 'text-indigo-500' : 'text-muted',
				)}
			>
				{entry.rank}
			</span>

			{/* Promotion/Demotion Indicator */}
			{(isPromotion || isDemotion) && (
				<div
					className={cn(
						'w-6 h-6 flex items-center justify-center rounded-full',
						isPromotion && 'bg-emerald-500/20 text-emerald-500',
						isDemotion && 'bg-red-500/20 text-red-500',
					)}
				>
					{isPromotion ? (
						<TrendingUp className='w-3.5 h-3.5' />
					) : (
						<TrendingDown className='w-3.5 h-3.5' />
					)}
				</div>
			)}

			{/* User Info */}
			<div className='flex-1 flex items-center gap-3'>
				<div className='relative'>
					<Image
						src={entry.avatarUrl || '/images/default-avatar.png'}
						alt={entry.displayName}
						width={44}
						height={44}
						className='rounded-full object-cover'
					/>
				</div>
				<div className='flex flex-col'>
					<span className='text-[15px] font-bold text-text'>
						{isCurrentUser ? 'You' : entry.displayName}
					</span>
					<span className='text-xs text-muted'>Level {entry.level}</span>
				</div>

				{/* Badges */}
				{isCurrentUser && !isLeading && (
					<span className='px-2 py-0.5 bg-indigo-500 rounded-lg text-[11px] font-bold text-white'>
						You
					</span>
				)}
				{isLeading && (
					<span className='px-2.5 py-1 bg-emerald-500 rounded-lg text-[11px] font-bold text-white'>
						🔥 Leading!
					</span>
				)}
			</div>

			{/* Stats (hidden on mobile) */}
			{showStats && (
				<div className='hidden sm:flex gap-3'>
					<div className='flex items-center gap-1 text-[13px] text-orange-500'>
						<Flame className='w-3.5 h-3.5' />
						<span>{entry.streak}</span>
					</div>
					<div className='flex items-center gap-1 text-[13px] text-muted'>
						<Utensils className='w-3.5 h-3.5' />
						<span>{entry.recipesCooked}</span>
					</div>
				</div>
			)}

			{/* XP */}
			<div className='text-right min-w-[70px]'>
				<span className='block text-base font-extrabold text-text'>
					{entry.xpThisWeek.toLocaleString()}
				</span>
				<span className='text-[11px] text-muted'>XP</span>
				{xpDiff !== undefined && xpDiff < 0 && (
					<span className='block text-[11px] text-red-500'>{xpDiff}</span>
				)}
			</div>
		</motion.div>
	)
}

// ============================================================================
// LEADERBOARD ITEM SKELETON
// ============================================================================

export function LeaderboardItemSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn('flex items-center gap-3 p-3.5 rounded-xl', className)}>
			<div className='w-8 h-5 bg-muted/20 rounded animate-pulse' />
			<div className='w-11 h-11 bg-muted/20 rounded-full animate-pulse' />
			<div className='flex-1 space-y-2'>
				<div className='h-4 w-24 bg-muted/20 rounded animate-pulse' />
				<div className='h-3 w-16 bg-muted/20 rounded animate-pulse' />
			</div>
			<div className='space-y-1 text-right'>
				<div className='h-5 w-14 bg-muted/20 rounded animate-pulse ml-auto' />
				<div className='h-3 w-8 bg-muted/20 rounded animate-pulse ml-auto' />
			</div>
		</div>
	)
}

// ============================================================================
// LIST DIVIDER
// ============================================================================

export function ListDivider({ className }: { className?: string }) {
	return (
		<div className={cn('text-center py-3 text-muted text-xs', className)}>
			<span>• • •</span>
		</div>
	)
}

export default LeaderboardItem
