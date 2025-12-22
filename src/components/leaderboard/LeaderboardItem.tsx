'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
	Flame,
	Utensils,
	TrendingUp,
	TrendingDown,
	ChefHat,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, LIST_ITEM_TAP } from '@/lib/motion'

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
// AVATAR WITH FALLBACK - Bulletproof
// ============================================================================

function AvatarWithFallback({
	src,
	alt,
	size = 44,
}: {
	src?: string
	alt: string
	size?: number
}) {
	const [imgError, setImgError] = useState(false)
	const hasValidAvatar = src && !imgError

	if (!hasValidAvatar) {
		return (
			<div
				className='flex items-center justify-center rounded-full bg-gradient-to-br from-bg-elevated to-bg-hover'
				style={{ width: size, height: size }}
			>
				<ChefHat
					className='text-text-muted'
					style={{ width: size * 0.5, height: size * 0.5 }}
				/>
			</div>
		)
	}

	return (
		<Image
			src={src}
			alt={alt}
			width={size}
			height={size}
			className='rounded-full object-cover'
			style={{ width: size, height: size }}
			onError={() => setImgError(true)}
		/>
	)
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
			whileHover={{ backgroundColor: 'var(--bg-elevated)' }}
			whileTap={LIST_ITEM_TAP}
			transition={TRANSITION_SPRING}
			onClick={() => onClick?.(entry)}
			className={cn(
				'flex cursor-pointer items-center gap-3 rounded-xl p-3.5 transition-colors',
				isCurrentUser &&
					!isLeading &&
					'border-2 border-xp/30 bg-gradient-to-r from-xp/15 to-rare/8',
				isLeading &&
					'border-2 border-medal-gold/30 bg-gradient-to-r from-medal-gold/10 to-medal-gold/5',
				isPromotion && 'border-l-4 border-l-medal-gold',
				isDemotion && 'border-l-4 border-l-error',
				className,
			)}
		>
			{/* Rank */}
			<span
				className={cn(
					'w-8 text-center text-base font-extrabold',
					isCurrentUser ? 'text-xp' : 'text-text-tertiary',
				)}
			>
				{entry.rank}
			</span>

			{/* Promotion/Demotion Indicator */}
			{(isPromotion || isDemotion) && (
				<div
					className={cn(
						'flex size-6 items-center justify-center rounded-full',
						isPromotion && 'bg-medal-gold/20 text-medal-gold',
						isDemotion && 'bg-error/20 text-error',
					)}
				>
					{isPromotion ? (
						<TrendingUp className='size-3.5' />
					) : (
						<TrendingDown className='size-3.5' />
					)}
				</div>
			)}

			{/* User Info */}
			<div className='flex flex-1 items-center gap-3'>
				<div className='relative size-11 flex-shrink-0 overflow-hidden rounded-full'>
					<AvatarWithFallback
						src={entry.avatarUrl}
						alt={entry.displayName}
						size={44}
					/>
				</div>
				<div className='flex flex-col'>
					<span className='text-base font-bold text-text'>
						{isCurrentUser ? 'You' : entry.displayName}
					</span>
					<span className='text-xs text-text-tertiary'>
						Level {entry.level}
					</span>
				</div>

				{/* Badges */}
				{isCurrentUser && !isLeading && (
					<span className='rounded-lg bg-xp px-2 py-0.5 text-xs font-bold text-white shadow-sm shadow-xp/30'>
						You
					</span>
				)}
				{isLeading && (
					<span className='rounded-lg bg-gradient-gold px-2.5 py-1 text-xs font-bold text-white shadow-sm shadow-medal-gold/30'>
						🔥 Leading!
					</span>
				)}
			</div>

			{/* Stats (hidden on mobile) */}
			{showStats && (
				<div className='hidden gap-3 sm:flex'>
					<div className='flex items-center gap-1 text-sm text-streak'>
						<Flame className='size-3.5' />
						<span>{entry.streak}</span>
					</div>
					<div className='flex items-center gap-1 text-sm text-text-secondary'>
						<Utensils className='size-3.5' />
						<span>{entry.recipesCooked}</span>
					</div>
				</div>
			)}

			{/* XP */}
			<div className='min-w-thumbnail-md text-right'>
				<span className='block text-base font-extrabold text-text'>
					{entry.xpThisWeek.toLocaleString()}
				</span>
				<span className='text-xs text-text-muted'>XP</span>
				{xpDiff !== undefined && xpDiff < 0 && (
					<span className='block text-xs text-error'>
						{Math.round(xpDiff).toLocaleString()}
					</span>
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
		<div className={cn('flex items-center gap-3 rounded-xl p-3.5', className)}>
			<div className='h-5 w-8 animate-pulse rounded bg-bg-elevated' />
			<div className='size-11 animate-pulse rounded-full bg-bg-elevated' />
			<div className='flex-1 space-y-2'>
				<div className='h-4 w-24 animate-pulse rounded bg-bg-elevated' />
				<div className='h-3 w-16 animate-pulse rounded bg-bg-elevated' />
			</div>
			<div className='space-y-1 text-right'>
				<div className='ml-auto h-5 w-14 animate-pulse rounded bg-bg-elevated' />
				<div className='ml-auto h-3 w-8 animate-pulse rounded bg-bg-elevated' />
			</div>
		</div>
	)
}

// ============================================================================
// LIST DIVIDER
// ============================================================================

export function ListDivider({ className }: { className?: string }) {
	return (
		<div className={cn('py-3 text-center text-xs text-text-muted', className)}>
			<span>• • •</span>
		</div>
	)
}

export default LeaderboardItem
