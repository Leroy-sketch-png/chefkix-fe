'use client'

import { motion } from 'framer-motion'
import { Clock, Users, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type ChallengeType = 'daily' | 'weekly' | 'community' | 'seasonal'
type ChallengeStatus = 'active' | 'completed' | 'expired' | 'upcoming'

interface ChallengeCardProps {
	id: string
	type: ChallengeType
	title: string
	description: string
	icon: string
	bonusXp: number
	progress?: {
		current: number
		total: number
	}
	participants?: number
	endsAt?: Date
	status?: ChallengeStatus
	isJoined?: boolean
	onJoin?: () => void
	onView?: () => void
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatTimeRemaining = (date: Date): string => {
	const now = new Date()
	const diffMs = date.getTime() - now.getTime()

	if (diffMs <= 0) return 'Expired'

	const hours = Math.floor(diffMs / 3600000)
	const mins = Math.floor((diffMs % 3600000) / 60000)

	if (hours >= 24) {
		const days = Math.floor(hours / 24)
		return `${days}d`
	}

	return `${hours}h ${mins}m`
}

const typeConfig: Record<
	ChallengeType,
	{ gradient: string; label: string; labelColor: string }
> = {
	daily: {
		gradient: 'from-indigo-500 to-purple-500',
		label: '🎯 Daily Challenge',
		labelColor: 'text-indigo-400',
	},
	weekly: {
		gradient: 'from-violet-500 to-purple-600',
		label: '📅 Weekly Challenge',
		labelColor: 'text-violet-400',
	},
	community: {
		gradient: 'from-pink-500 to-rose-500',
		label: '👥 Community Challenge',
		labelColor: 'text-pink-400',
	},
	seasonal: {
		gradient: 'from-amber-500 to-orange-500',
		label: '🌟 Seasonal Event',
		labelColor: 'text-amber-400',
	},
}

// ============================================
// CHALLENGE CARD COMPONENT
// ============================================

export const ChallengeCard = ({
	type,
	title,
	description,
	icon,
	bonusXp,
	progress,
	participants,
	endsAt,
	status = 'active',
	isJoined = false,
	onJoin,
	onView,
}: ChallengeCardProps) => {
	const config = typeConfig[type]
	const progressPercent = progress
		? (progress.current / progress.total) * 100
		: 0
	const isCompleted = status === 'completed'
	const isExpired = status === 'expired'

	return (
		<motion.div
			whileHover={{ y: -4, boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)' }}
			transition={TRANSITION_SPRING}
			onClick={onView}
			className={cn(
				'relative cursor-pointer overflow-hidden rounded-2xl p-6 text-white shadow-lg',
				`bg-gradient-to-br ${config.gradient}`,
				(isCompleted || isExpired) && 'opacity-70',
			)}
		>
			{/* Rotating gradient effect */}
			<div className='pointer-events-none absolute -inset-1/2 bg-conic-gradient from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

			{/* Content */}
			<div className='relative z-10'>
				{/* Label + Icon Row */}
				<div className='mb-2 flex items-start justify-between'>
					<span
						className={cn(
							'text-xs font-semibold opacity-80',
							config.labelColor,
						)}
					>
						{config.label}
					</span>
					<span className='text-3xl'>{icon}</span>
				</div>

				{/* Title */}
				<h3 className='mb-2 text-lg font-extrabold leading-tight'>{title}</h3>

				{/* Description */}
				{description && (
					<p className='mb-4 text-sm leading-relaxed opacity-80'>
						{description}
					</p>
				)}

				{/* Progress Bar (if applicable) */}
				{progress && (
					<div className='mb-4'>
						<div className='mb-1.5 flex justify-between text-xs'>
							<span className='opacity-80'>Progress</span>
							<span className='font-semibold'>
								{progress.current}/{progress.total}
							</span>
						</div>
						<div className='h-2.5 overflow-hidden rounded-full bg-white/20'>
							<motion.div
								className='h-full rounded-full bg-white'
								initial={{ width: 0 }}
								animate={{ width: `${progressPercent}%` }}
								transition={{ duration: 0.5, delay: 0.2 }}
							/>
						</div>
					</div>
				)}

				{/* Meta Row */}
				<div className='mb-4 flex items-center gap-4 text-xs'>
					{/* Bonus XP */}
					<div className='flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5'>
						<span>⚡</span>
						<span className='font-bold'>+{bonusXp} XP</span>
					</div>

					{/* Time Remaining */}
					{endsAt && (
						<div className='flex items-center gap-1 opacity-80'>
							<Clock className='h-3.5 w-3.5' />
							<span>{formatTimeRemaining(endsAt)}</span>
						</div>
					)}

					{/* Participants */}
					{participants !== undefined && (
						<div className='flex items-center gap-1 opacity-80'>
							<Users className='h-3.5 w-3.5' />
							<span>
								{participants >= 1000
									? `${(participants / 1000).toFixed(1)}k`
									: participants}
							</span>
						</div>
					)}
				</div>

				{/* Action Button */}
				{isCompleted ? (
					<div className='flex items-center justify-center gap-2 rounded-full bg-white/20 py-2.5 text-sm font-bold'>
						<Trophy className='h-4 w-4' />
						Completed!
					</div>
				) : isExpired ? (
					<div className='flex items-center justify-center rounded-full bg-white/10 py-2.5 text-sm font-semibold opacity-60'>
						Expired
					</div>
				) : (
					<motion.button
						onClick={e => {
							e.stopPropagation()
							onJoin?.()
						}}
						whileHover={{ y: -2 }}
						whileTap={{ scale: 0.98 }}
						className={cn(
							'w-full rounded-full py-2.5 text-sm font-bold transition-all',
							isJoined
								? 'bg-white/20 text-white'
								: 'bg-white text-indigo-600 hover:bg-white/90',
						)}
					>
						{isJoined ? 'View Challenge' : 'Join Challenge'}
					</motion.button>
				)}
			</div>

			{/* Completed overlay */}
			{isCompleted && (
				<div className='absolute inset-0 flex items-center justify-center bg-black/30'>
					<div className='rounded-full bg-success px-4 py-2 text-sm font-bold shadow-lg'>
						✓ Completed
					</div>
				</div>
			)}
		</motion.div>
	)
}

// ============================================
// CHALLENGE CARD SKELETON
// ============================================

export const ChallengeCardSkeleton = () => (
	<div className='animate-pulse rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 p-6'>
		<div className='mb-4 flex items-start justify-between'>
			<div className='h-4 w-24 rounded bg-white/30' />
			<div className='h-8 w-8 rounded-lg bg-white/30' />
		</div>
		<div className='mb-2 h-6 w-3/4 rounded bg-white/30' />
		<div className='mb-4 h-4 w-full rounded bg-white/30' />
		<div className='mb-4 h-2.5 rounded-full bg-white/20' />
		<div className='flex gap-2'>
			<div className='h-7 w-20 rounded-full bg-white/30' />
			<div className='h-7 w-16 rounded-full bg-white/30' />
		</div>
		<div className='mt-4 h-10 rounded-full bg-white/30' />
	</div>
)

// ============================================
// CHALLENGE CARD GRID
// ============================================

interface ChallengeCardGridProps {
	challenges: ChallengeCardProps[]
	loading?: boolean
}

export const ChallengeCardGrid = ({
	challenges,
	loading,
}: ChallengeCardGridProps) => {
	if (loading) {
		return (
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{[1, 2, 3].map(i => (
					<ChallengeCardSkeleton key={i} />
				))}
			</div>
		)
	}

	return (
		<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
			{challenges.map(challenge => (
				<ChallengeCard key={challenge.id} {...challenge} />
			))}
		</div>
	)
}

// Export types
export type { ChallengeCardProps, ChallengeType, ChallengeStatus }
