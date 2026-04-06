'use client'

import { useTranslations } from 'next-intl'

import { motion } from 'framer-motion'
import { Clock, Users, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCompactTimeRemaining } from '@/lib/challenge-time'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_FEED_HOVER,
	STAT_ITEM_HOVER,
	LIST_ITEM_TAP,
	DURATION_S,
} from '@/lib/motion'
import { AnimatedNumber } from '@/components/ui/animated-number'

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



const typeConfig: Record<
	ChallengeType,
	{ gradient: string; labelColor: string; labelKey: string }
> = {
	daily: {
		gradient: 'from-xp via-accent-teal to-info',
		labelColor: 'text-xp',
		labelKey: 'dailyChallenge',
	},
	weekly: {
		gradient: 'from-rare via-accent-purple to-brand',
		labelColor: 'text-rare',
		labelKey: 'weeklyChallenge',
	},
	community: {
		gradient: 'from-combo via-brand to-brand',
		labelColor: 'text-combo',
		labelKey: 'communityChallenge',
	},
	seasonal: {
		gradient: 'from-legendary via-warning to-bonus',
		labelColor: 'text-legendary',
		labelKey: 'seasonalEvent',
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
	const t = useTranslations('challenge')

	return (
		<motion.div
			whileHover={{
				...CARD_FEED_HOVER,
				boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
			}}
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
						{t(config.labelKey as Parameters<typeof t>[0])}
					</span>
					<span className='text-3xl'>{icon}</span>
				</div>

				{/* Title */}
				<h3 className='mb-2 text-lg font-display font-extrabold leading-tight'>{title}</h3>

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
							<span className='opacity-80'>{t('progress')}</span>
						<span className='font-semibold tabular-nums'>
							<AnimatedNumber value={progress.current} />/{progress.total}
							</span>
						</div>
						<div className='h-2.5 overflow-hidden rounded-full bg-white/20'>
							<motion.div
								className='h-full rounded-full bg-white'
								initial={{ width: 0 }}
								animate={{ width: `${progressPercent}%` }}
								transition={{ duration: DURATION_S.slow, delay: 0.2 }}
							/>
						</div>
					</div>
				)}

				{/* Meta Row */}
				<div className='mb-4 flex items-center gap-4 text-xs'>
					{/* Bonus XP */}
					<div className='flex items-center gap-1 rounded-full bg-bonus/30 px-3 py-1.5 shadow-card shadow-bonus/20'>
						<span>⚡</span>
						<span className='font-bold tabular-nums text-bonus'>+<AnimatedNumber value={bonusXp} /> XP</span>
					</div>

					{/* Time Remaining */}
					{endsAt && (
						<div className='flex items-center gap-1 opacity-80'>
							<Clock className='size-3.5' />
							<span>{formatCompactTimeRemaining(endsAt, t)}</span>
						</div>
					)}

					{/* Participants */}
					{participants !== undefined && (
						<div className='flex items-center gap-1 opacity-80'>
							<Users className='size-3.5' />
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
						<Trophy className='size-4' />
							{t('completed')}
					</div>
				) : isExpired ? (
					<div className='flex items-center justify-center rounded-full bg-white/10 py-2.5 text-sm font-semibold opacity-60'>
						{t('expired')}
					</div>
				) : (
					<motion.button
						type='button'
						onClick={e => {
							e.stopPropagation()
							onJoin?.()
						}}
						whileHover={STAT_ITEM_HOVER}
						whileTap={LIST_ITEM_TAP}
						className={cn(
							'w-full rounded-full py-2.5 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
							isJoined
								? 'bg-white/20 text-white'
								: 'bg-bg-card text-info hover:bg-bg-card/90',
						)}
					>
						{isJoined ? t('viewChallenge') : t('joinChallenge')}
					</motion.button>
				)}
			</div>

			{/* Completed overlay */}
			{isCompleted && (
				<div className='absolute inset-0 flex items-center justify-center bg-black/30'>
					<div className='rounded-full bg-success px-4 py-2 text-sm font-bold shadow-lg'>
						✓ {t('completedOverlay')}
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
	<div className='animate-pulse rounded-2xl bg-bg-elevated p-6'>
		<div className='mb-4 flex items-start justify-between'>
			<div className='h-4 w-24 rounded bg-border-subtle' />
			<div className='size-8 rounded-lg bg-border-subtle' />
		</div>
		<div className='mb-2 h-6 w-3/4 rounded bg-border-subtle' />
		<div className='mb-4 h-4 w-full rounded bg-border-subtle' />
		<div className='mb-4 h-2.5 rounded-full bg-border-subtle/60' />
		<div className='flex gap-2'>
			<div className='h-7 w-20 rounded-full bg-border-subtle' />
			<div className='h-7 w-16 rounded-full bg-border-subtle' />
		</div>
		<div className='mt-4 h-10 rounded-full bg-border-subtle' />
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
