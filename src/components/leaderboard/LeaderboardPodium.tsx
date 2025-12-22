'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ChefHat } from 'lucide-react'
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
// PODIUM CONSTANTS - Premium Metallic Design
// ============================================================================

const podiumConfig = {
	1: {
		order: 2,
		avatarSize: 80,
		baseHeight: 80,
		// Premium gold - shimmering treasure
		baseStyle: {
			background: 'var(--gradient-medal-gold)',
			boxShadow: `
				0 4px 20px rgba(234, 179, 8, 0.5),
				inset 0 2px 4px rgba(254, 243, 199, 0.4),
				inset 0 -2px 4px rgba(161, 98, 7, 0.3)
			`,
			borderTop: '2px solid rgba(254, 243, 199, 0.6)',
		},
		// Level badge styling
		levelBadge: {
			background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
			boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
		},
		// Rank badge styling
		rankBadge: {
			background: 'linear-gradient(135deg, #eab308 0%, #fde047 100%)',
			boxShadow: '0 2px 6px rgba(234, 179, 8, 0.5)',
		},
		showCrown: true,
	},
	2: {
		order: 1,
		avatarSize: 64,
		baseHeight: 56,
		// Premium silver - polished metal
		baseStyle: {
			background: 'var(--gradient-medal-silver)',
			boxShadow: `
				0 4px 16px rgba(148, 163, 184, 0.5),
				inset 0 2px 4px rgba(241, 245, 249, 0.5),
				inset 0 -2px 4px rgba(71, 85, 105, 0.3)
			`,
			borderTop: '2px solid rgba(241, 245, 249, 0.7)',
		},
		levelBadge: {
			background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
			boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
		},
		rankBadge: {
			background: 'linear-gradient(135deg, #94a3b8 0%, #e2e8f0 100%)',
			boxShadow: '0 2px 6px rgba(148, 163, 184, 0.5)',
		},
		showCrown: false,
	},
	3: {
		order: 3,
		avatarSize: 64,
		baseHeight: 40,
		// Premium bronze - burnished copper
		baseStyle: {
			background: 'var(--gradient-medal-bronze)',
			boxShadow: `
				0 4px 14px rgba(217, 119, 6, 0.5),
				inset 0 2px 4px rgba(254, 243, 199, 0.4),
				inset 0 -2px 4px rgba(146, 64, 14, 0.3)
			`,
			borderTop: '2px solid rgba(251, 191, 36, 0.5)',
		},
		levelBadge: {
			background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
			boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
		},
		rankBadge: {
			background: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
			boxShadow: '0 2px 6px rgba(217, 119, 6, 0.5)',
		},
		showCrown: false,
	},
} as const

// ============================================================================
// DEFAULT AVATAR COMPONENT - Bulletproof fallback
// ============================================================================

function DefaultAvatar({
	size,
	className,
}: {
	size: number
	className?: string
}) {
	return (
		<div
			className={cn(
				'flex items-center justify-center rounded-full',
				'bg-gradient-to-br from-bg-elevated to-bg-hover',
				'border-4 border-bg-card',
				className,
			)}
			style={{ width: size, height: size }}
		>
			<ChefHat
				className='text-text-muted'
				style={{ width: size * 0.45, height: size * 0.45 }}
			/>
		</div>
	)
}

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
	const [imgError, setImgError] = useState(false)
	const hasValidAvatar = entry.avatarUrl && !imgError

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
			{/* Crown for 1st place - TIGHTENED spacing */}
			{config.showCrown && (
				<motion.div
					animate={{
						y: [0, -3, 0],
					}}
					transition={{
						duration: DURATIONS.slow / 1000,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
					className='text-icon-lg mb-0.5'
				>
					👑
				</motion.div>
			)}

			{/* Avatar Container */}
			<div className='relative mb-2.5'>
				<motion.div
					whileHover={BUTTON_SUBTLE_HOVER}
					transition={TRANSITION_SPRING}
					className='rounded-full overflow-hidden'
					style={{
						width: config.avatarSize,
						height: config.avatarSize,
					}}
				>
					{hasValidAvatar ? (
						<Image
							src={entry.avatarUrl}
							alt={entry.displayName}
							width={config.avatarSize}
							height={config.avatarSize}
							className='rounded-full border-4 border-bg-card shadow-lg object-cover size-full'
							onError={() => setImgError(true)}
						/>
					) : (
						<DefaultAvatar size={config.avatarSize} className='shadow-lg' />
					)}
				</motion.div>

				{/* Rank Badge - with inline gradient styling */}
				<div
					className='absolute -bottom-1 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full text-xs font-extrabold text-white border-2 border-bg-card'
					style={{
						...config.rankBadge,
						textShadow: '0 1px 2px rgba(0,0,0,0.4)',
					}}
				>
					{entry.rank}
				</div>

				{/* Level Badge - BULLETPROOF inline styling */}
				<div
					className='absolute top-0 -right-1 px-1.5 py-0.5 rounded-lg text-2xs font-bold text-white'
					style={{
						...config.levelBadge,
						textShadow: '0 1px 2px rgba(0,0,0,0.3)',
					}}
				>
					{entry.level}
				</div>
			</div>

			{/* Name */}
			<span className='mb-1 max-w-thumbnail-lg truncate text-sm font-bold text-text'>
				{entry.displayName}
			</span>

			{/* XP */}
			<div className='mb-3 flex flex-col items-center'>
				<span className='text-lg font-extrabold text-text'>
					{entry.xp.toLocaleString()}
				</span>
				<span className='text-xs text-text-tertiary'>XP</span>
			</div>

			{/* Podium Base - Premium metallic with 3D effect */}
			<motion.div
				initial={{ height: 0 }}
				animate={{ height: config.baseHeight }}
				transition={{ delay: 0.8, ...TRANSITION_SPRING }}
				className='w-20 rounded-t-xl'
				style={config.baseStyle}
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
				<div className='w-16 h-16 bg-bg-elevated rounded-full animate-pulse mb-2' />
				<div className='w-14 h-4 bg-bg-elevated rounded animate-pulse mb-1' />
				<div className='w-10 h-5 bg-bg-elevated rounded animate-pulse mb-3' />
				<div className='w-16 h-14 bg-bg-elevated rounded-t-xl animate-pulse' />
			</div>

			{/* 1st place */}
			<div className='flex flex-col items-center' style={{ order: 2 }}>
				<div className='w-7 h-7 bg-bg-elevated rounded animate-pulse mb-2' />
				<div className='w-20 h-20 bg-bg-elevated rounded-full animate-pulse mb-2' />
				<div className='w-16 h-4 bg-bg-elevated rounded animate-pulse mb-1' />
				<div className='w-12 h-5 bg-bg-elevated rounded animate-pulse mb-3' />
				<div className='w-20 h-20 bg-bg-elevated rounded-t-xl animate-pulse' />
			</div>

			{/* 3rd place */}
			<div className='flex flex-col items-center' style={{ order: 3 }}>
				<div className='w-16 h-16 bg-bg-elevated rounded-full animate-pulse mb-2' />
				<div className='w-14 h-4 bg-bg-elevated rounded animate-pulse mb-1' />
				<div className='w-10 h-5 bg-bg-elevated rounded animate-pulse mb-3' />
				<div className='w-16 h-10 bg-bg-elevated rounded-t-xl animate-pulse' />
			</div>
		</div>
	)
}

export default LeaderboardPodium
