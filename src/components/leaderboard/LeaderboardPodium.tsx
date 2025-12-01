'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, DURATIONS, BUTTON_SUBTLE_HOVER } from '@/lib/motion'

// ============================================================================
// TYPES
// ============================================================================

export interface PodiumEntry {
	rank: 1 | 2 | 3
	userId: string
	username: string
	displayName: string
	avatarUrl: string
	level: number
	xp: number
}

export interface LeaderboardPodiumProps {
	entries: PodiumEntry[]
	onUserClick?: (entry: PodiumEntry) => void
	className?: string
}

// ============================================================================
// PODIUM CONSTANTS
// ============================================================================

const podiumConfig = {
	1: {
		order: 2,
		avatarSize: 80,
		baseHeight: 80,
		baseGradient: 'from-amber-400/30 to-amber-400/10',
		badgeGradient: 'from-amber-400 to-amber-500',
		showCrown: true,
	},
	2: {
		order: 1,
		avatarSize: 64,
		baseHeight: 56,
		baseGradient: 'from-gray-400/30 to-gray-400/10',
		badgeGradient: 'from-gray-400 to-gray-500',
		showCrown: false,
	},
	3: {
		order: 3,
		avatarSize: 64,
		baseHeight: 40,
		baseGradient: 'from-amber-600/30 to-amber-600/10',
		badgeGradient: 'from-amber-600 to-amber-700',
		showCrown: false,
	},
} as const

// ============================================================================
// PODIUM SPOT COMPONENT
// ============================================================================

function PodiumSpot({
	entry,
	onUserClick,
}: {
	entry: PodiumEntry
	onUserClick?: (entry: PodiumEntry) => void
}) {
	const config = podiumConfig[entry.rank]

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				delay: entry.rank === 1 ? 0.2 : entry.rank === 2 ? 0.4 : 0.6,
				...TRANSITION_SPRING,
			}}
			className='flex flex-col items-center relative cursor-pointer'
			style={{ order: config.order }}
			onClick={() => onUserClick?.(entry)}
		>
			{/* Crown for 1st place */}
			{config.showCrown && (
				<motion.div
					animate={{
						y: [0, -5, 0],
					}}
					transition={{
						duration: DURATIONS.slow / 1000,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
					className='text-icon-lg mb-2'
				>
					👑
				</motion.div>
			)}

			{/* Avatar Container */}
			<div className='relative mb-2.5'>
				<motion.div
					whileHover={BUTTON_SUBTLE_HOVER}
					transition={TRANSITION_SPRING}
				>
					<Image
						src={entry.avatarUrl || '/images/default-avatar.png'}
						alt={entry.displayName}
						width={config.avatarSize}
						height={config.avatarSize}
						className='rounded-full border-4 border-panel-bg shadow-lg object-cover'
					/>
				</motion.div>

				{/* Rank Badge */}
				<div
					className={cn(
						'absolute -bottom-1 left-1/2 -translate-x-1/2',
						'w-6 h-6 flex items-center justify-center rounded-full',
						'text-xs font-extrabold text-white border-3 border-panel-bg',
						`bg-gradient-to-br ${config.badgeGradient}`,
					)}
				>
					{entry.rank}
				</div>

				{/* Level Badge */}
				<div className='absolute top-0 -right-1 px-1.5 py-0.5 bg-indigo-500 rounded-lg text-2xs font-bold text-white'>
					{entry.level}
				</div>
			</div>

			{/* Name */}
			<span className='text-sm font-bold text-text mb-1 max-w-thumbnail-lg truncate'>
				{entry.displayName}
			</span>

			{/* XP */}
			<div className='flex flex-col items-center mb-3'>
				<span className='text-lg font-extrabold text-text'>
					{entry.xp.toLocaleString()}
				</span>
				<span className='text-xs text-muted-foreground'>XP</span>
			</div>

			{/* Podium Base */}
			<motion.div
				initial={{ height: 0 }}
				animate={{ height: config.baseHeight }}
				transition={{ delay: 0.8, ...TRANSITION_SPRING }}
				className={cn(
					'w-20 rounded-t-xl bg-gradient-to-t',
					config.baseGradient,
				)}
			/>
		</motion.div>
	)
}

// ============================================================================
// LEADERBOARD PODIUM COMPONENT
// ============================================================================

export function LeaderboardPodium({
	entries,
	onUserClick,
	className,
}: LeaderboardPodiumProps) {
	// Ensure we have exactly 3 entries sorted by rank
	const sortedEntries = [...entries]
		.sort((a, b) => a.rank - b.rank)
		.slice(0, 3) as PodiumEntry[]

	if (sortedEntries.length < 3) {
		return null // Don't render if we don't have top 3
	}

	return (
		<div
			className={cn('flex items-end justify-center gap-3 py-6 px-4', className)}
		>
			{sortedEntries.map(entry => (
				<PodiumSpot
					key={entry.userId}
					entry={entry}
					onUserClick={onUserClick}
				/>
			))}
		</div>
	)
}

// ============================================================================
// PODIUM SKELETON
// ============================================================================

export function LeaderboardPodiumSkeleton({
	className,
}: {
	className?: string
}) {
	return (
		<div
			className={cn('flex items-end justify-center gap-3 py-6 px-4', className)}
		>
			{/* 2nd place */}
			<div className='flex flex-col items-center' style={{ order: 1 }}>
				<div className='w-16 h-16 bg-muted/20 rounded-full animate-pulse mb-2' />
				<div className='w-14 h-4 bg-muted/20 rounded animate-pulse mb-1' />
				<div className='w-10 h-5 bg-muted/20 rounded animate-pulse mb-3' />
				<div className='w-16 h-14 bg-muted/20 rounded-t-xl animate-pulse' />
			</div>

			{/* 1st place */}
			<div className='flex flex-col items-center' style={{ order: 2 }}>
				<div className='w-7 h-7 bg-muted/20 rounded animate-pulse mb-2' />
				<div className='w-20 h-20 bg-muted/20 rounded-full animate-pulse mb-2' />
				<div className='w-16 h-4 bg-muted/20 rounded animate-pulse mb-1' />
				<div className='w-12 h-5 bg-muted/20 rounded animate-pulse mb-3' />
				<div className='w-20 h-20 bg-muted/20 rounded-t-xl animate-pulse' />
			</div>

			{/* 3rd place */}
			<div className='flex flex-col items-center' style={{ order: 3 }}>
				<div className='w-16 h-16 bg-muted/20 rounded-full animate-pulse mb-2' />
				<div className='w-14 h-4 bg-muted/20 rounded animate-pulse mb-1' />
				<div className='w-10 h-5 bg-muted/20 rounded animate-pulse mb-3' />
				<div className='w-16 h-10 bg-muted/20 rounded-t-xl animate-pulse' />
			</div>
		</div>
	)
}

export default LeaderboardPodium
