'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { triggerAchievementConfetti } from '@/lib/confetti'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	BUTTON_HOVER,
	BUTTON_TAP,
	CONFETTI_BURST,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

interface StreakDay {
	label: string
	isCompleted: boolean
	isToday?: boolean
	isMilestone?: boolean
}

interface ChallengeCompleteProps {
	challengeTitle: string
	challengeIcon: string
	recipeName: string
	bonusXp: number
	streakDays: StreakDay[]
	daysToMilestone: number
	milestoneReward: string
	onContinue?: () => void
	onShare?: () => void
}

interface ChallengeCompleteInlineProps {
	challengeTitle: string
	challengeIcon: string
	bonusXp: number
	streakCount: number
	daysToMilestone: number
}

// ============================================
// CONFETTI COMPONENT
// ============================================

const Confetti = () => {
	const emojis = ['🎉', '✨', '🎯', 'â­', '🍊']

	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden'>
			{emojis.map((emoji, i) => (
				<motion.span
					key={i}
					className='absolute text-icon-lg'
					style={{ left: `${10 + i * 20}%` }}
					initial={{ y: -40, opacity: 0, rotate: 0, scale: 0 }}
					animate={{
						y: 300,
						opacity: [0, 1, 0],
						rotate: 360,
						scale: [0, 1, 0.5],
					}}
					transition={{
						duration: 2,
						delay: i * 0.1,
						ease: 'easeOut',
					}}
				>
					{emoji}
				</motion.span>
			))}
		</div>
	)
}

// ============================================
// CHALLENGE COMPLETE OVERLAY
// ============================================

export const ChallengeComplete = ({
	challengeTitle,
	challengeIcon,
	recipeName,
	bonusXp,
	streakDays,
	daysToMilestone,
	milestoneReward,
	onContinue,
	onShare,
}: ChallengeCompleteProps) => {
	const t = useTranslations('challenge')
	// Fire gold confetti burst on mount
	useEffect(() => {
		const timer = setTimeout(() => triggerAchievementConfetti(), 200)
		return () => clearTimeout(timer)
	}, [])

	return (
		<AnimatePresence>
			<Portal>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-modal flex items-center justify-center'
				>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='absolute inset-0 bg-black/80 backdrop-blur-lg'
					/>

					{/* Modal */}
					<motion.div
						initial={{ scale: 0.5, y: 50, opacity: 0 }}
						animate={{ scale: 1, y: 0, opacity: 1 }}
						transition={{ ...TRANSITION_SPRING, delay: 0.1 }}
						className='relative w-full max-w-modal-md overflow-hidden rounded-2xl bg-bg-card p-8 text-center shadow-warm'
						role='alertdialog'
						aria-modal='true'
						aria-label={t('challengeComplete')}
					>
						{/* Confetti */}
						<Confetti />

						{/* Challenge Badge */}
						<div className='relative mx-auto mb-5 size-thumbnail-xl'>
							{/* Glow */}
							<motion.div
								className='absolute -inset-5 rounded-2xl bg-xp/30 blur-xl'
								animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
								transition={{ duration: 1.5, repeat: Infinity }}
							/>
							{/* Badge */}
							<div className='relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-indigo shadow-warm shadow-accent-purple/40'>
								<span className='text-5xl'>{challengeIcon}</span>
							</div>
							{/* Checkmark */}
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ ...TRANSITION_BOUNCY, delay: 0.3 }}
								className='absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full border-4 border-bg-card bg-success text-white'
							>
								<Check className='size-icon-sm' />
							</motion.div>
						</div>

						{/* Title */}
						<div className='mb-4'>
							<span className='mb-1 block text-xs font-bold uppercase tracking-wider text-xp'>
								{t('dailyChallengeTitle')}
							</span>
							<h2 className='text-2xl font-display font-extrabold'>
								{t('completeTitle')} 🎯
							</h2>
						</div>

						{/* Challenge Info */}
						<div className='mb-6 flex flex-col items-center gap-1'>
							<span className='text-lg font-bold'>{challengeTitle}</span>
							<span className='text-sm text-text-muted'>
								{t('completedWithRecipe')}
							</span>
							<span className='text-base font-semibold text-brand'>
								{recipeName}
							</span>
						</div>

						{/* Bonus XP Award */}
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.4 }}
							className='mb-6 flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-success/10 to-success/5 p-5'
						>
							<div className='relative flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-success to-success'>
								<span className='text-2xl'>⚡</span>
								{/* Particles */}
								{[0, 1, 2].map(i => (
									<motion.span
										key={i}
										className='absolute size-2 rounded-full bg-success'
										initial={{ scale: 0, opacity: 1 }}
										animate={{ scale: [0, 1.5, 2], opacity: [1, 0.5, 0] }}
										transition={{
											duration: 1,
											delay: 0.5 + i * 0.1,
											repeat: Infinity,
											repeatDelay: 1,
										}}
										style={{
											top: i === 0 ? 0 : '50%',
											left: i === 1 ? '100%' : '50%',
											bottom: i === 2 ? 0 : undefined,
										}}
									/>
								))}
							</div>
							<div className='text-left'>
								<span className='block tabular-nums text-3xl font-black leading-none text-success'>
									+{bonusXp}
								</span>
								<span className='text-sm text-text-muted'>{t('bonusXP')}</span>
							</div>
						</motion.div>

						{/* Streak Progress */}
						<div className='mb-6 rounded-xl bg-bg-elevated p-4'>
							<div className='mb-3.5 flex items-center justify-center gap-2'>
								<span className='text-xl'>🔥</span>
								<span className='text-sm font-bold'>
									{t('challengeStreak')}
								</span>
							</div>

							{/* Days */}
							<div className='mb-3 flex justify-between'>
								{streakDays.map((day, i) => (
									<div key={i} className='flex flex-col items-center gap-1.5'>
										<div
											className={cn(
												'flex size-7 items-center justify-center rounded-full text-xs',
												day.isCompleted
													? 'bg-success text-white'
													: day.isMilestone
														? 'bg-warning/20 text-warning'
														: 'bg-border text-text-muted',
												day.isToday && 'ring-3 ring-success/30',
											)}
										>
											{day.isCompleted ? '✓' : day.isMilestone ? '🏆' : ''}
										</div>
										<span
											className={cn(
												'text-2xs font-medium',
												day.isCompleted ? 'text-success' : 'text-text-muted',
											)}
										>
											{day.label}
										</span>
									</div>
								))}
							</div>

							{/* Milestone message */}
							<p className='text-sm font-semibold text-warning'>
								{t('milestoneProgress', {
									days: daysToMilestone,
									reward: milestoneReward,
								})}
							</p>
						</div>

						{/* Actions */}
						<div className='flex gap-3'>
							<motion.button
								type='button'
								onClick={onContinue}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-indigo py-3.5 text-base font-bold text-white shadow-warm shadow-accent-purple/30 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
							>
								{t('continueButton')}
								<ArrowRight className='size-icon-sm' />
							</motion.button>
							<motion.button
								type='button'
								onClick={onShare}
								whileHover={BUTTON_SUBTLE_HOVER}
								whileTap={BUTTON_SUBTLE_TAP}
								className='flex items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-sm font-semibold text-text-muted transition-colors hover:bg-border hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
							>
								<Share2 className='size-icon-sm' />
								{t('share')}
							</motion.button>
						</div>
					</motion.div>
				</motion.div>
			</Portal>
		</AnimatePresence>
	)
}

// ============================================
// CHALLENGE COMPLETE INLINE (Alternative)
// For use within cooking complete flow
// ============================================

export const ChallengeCompleteInline = ({
	challengeTitle,
	challengeIcon,
	bonusXp,
	streakCount,
	daysToMilestone,
}: ChallengeCompleteInlineProps) => {
	const t = useTranslations('challenge')
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className='my-4 rounded-2xl border-2 border-accent-purple/30 bg-accent-purple/10 p-4 px-5'
		>
			{/* Header */}
			<div className='mb-3 flex items-center gap-3.5'>
				<div className='flex size-12 items-center justify-center rounded-xl bg-gradient-indigo'>
					<span className='text-2xl'>{challengeIcon}</span>
				</div>
				<div className='flex-1'>
					<span className='text-sm font-bold text-xp'>
						{t('dailyChallengeComplete')}
					</span>
					<span className='block text-sm text-text-muted'>
						{challengeTitle}
					</span>
				</div>
				<div className='text-right'>
					<span className='block tabular-nums text-xl font-display font-extrabold text-success'>
						+{bonusXp} XP
					</span>
					<span className='text-xs text-text-muted'>{t('bonus')}</span>
				</div>
			</div>

			{/* Streak Info */}
			<div className='flex items-center gap-2 rounded-lg bg-streak/10 px-3.5 py-2.5 text-sm'>
				<span className='text-base'>🔥</span>
				<span className='tabular-nums font-semibold text-streak'>
					{t('streakCount', { count: streakCount })}
				</span>
				<span className='text-text-muted'>
					• {t('milestoneCompact', { count: daysToMilestone })}
				</span>
			</div>
		</motion.div>
	)
}

// Export types
export type { ChallengeCompleteProps, ChallengeCompleteInlineProps, StreakDay }
