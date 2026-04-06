'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useTranslations } from 'next-intl'

// ============================================================================
// TYPES
// ============================================================================

export interface StreakBrokenModalProps {
	lostStreak: number
	totalBonusXpEarned: number
	bestStreak?: number
	isOpen: boolean
	onStartNewStreak?: () => void
	onDismiss?: () => void
}

// ============================================================================
// STREAK BROKEN MODAL
// ============================================================================

export function StreakBrokenModal({
	lostStreak,
	totalBonusXpEarned,
	bestStreak,
	isOpen,
	onStartNewStreak,
	onDismiss,
}: StreakBrokenModalProps) {
	const t = useTranslations('streak')
	useEscapeKey(isOpen, onDismiss ?? (() => {}))

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center p-6 bg-black/60'
					>
						<motion.div
							initial={{ opacity: 0, y: 30, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 30, scale: 0.95 }}
							transition={TRANSITION_SPRING}
							className='w-full max-w-modal-md bg-bg-card rounded-2xl p-10 text-center'
						>
							{/* Sad Icon */}
							<div className='relative mb-6'>
								<span className='text-icon-emoji-xl block'>😢</span>
								<div className='absolute top-[-10px] right-[30%]'>
									<span className='text-2xl opacity-30 grayscale'>🔥</span>
								</div>
							</div>

							{/* Title */}
							<h2 className='text-2xl font-display font-extrabold text-text mb-2'>
								{t('sbTitle')}
							</h2>
							<p className='text-sm text-text-secondary mb-6'>
								{t('sbDescription', { count: lostStreak })}
							</p>

							{/* Stats Lost */}
							<div className='flex justify-center gap-6 py-5 px-6 bg-bg rounded-xl mb-5'>
								<div className='flex flex-col gap-1'>
									<span className='text-xs text-text-secondary'>
										{t('sbStreakLength')}
									</span>
									<span className='text-lg font-bold text-text'>
										{t('sbDays', { count: lostStreak })}
									</span>
								</div>
								<div className='flex flex-col gap-1'>
									<span className='text-xs text-text-secondary'>
										{t('sbBonusesEarned')}
									</span>
									<span className='text-lg font-bold text-text'>
										{t('sbBonusXp', { count: totalBonusXpEarned })}
									</span>
								</div>
							</div>

							{/* Motivation */}
							<div className='mb-5 space-y-2 text-sm text-text-secondary'>
								<p>{t('sbMotivation1')}</p>
								<p>
									{t('sbMotivation2')} 💪
								</p>
							</div>

							{/* Best Streak */}
							{bestStreak && bestStreak > lostStreak && (
								<div className='mb-6 flex items-center justify-center gap-2 rounded-lg bg-success/10 px-4 py-3'>
									<span className='text-xs text-text-secondary'>
										{t('sbBestStreak')}
									</span>
									<span className='text-sm font-bold text-success'>
										{t('sbDays', { count: bestStreak })}
									</span>
									<span className='text-xs text-success'>{t('sbCanBeatIt')}</span>
								</div>
							)}

							{/* Actions */}
							<div className='flex flex-col gap-2.5'>
								<motion.button
									type='button'
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									transition={TRANSITION_SPRING}
									onClick={onStartNewStreak}
									className={cn(
										'flex items-center justify-center gap-2 py-4 px-6 rounded-xl focus-visible:ring-2 focus-visible:ring-brand/50',
										'bg-gradient-streak text-white',
										'text-base font-bold shadow-lg shadow-streak/30',
									)}
								>
									<Flame className='size-5' />
									{t('sbStartNew')}
								</motion.button>
								<button
									type='button'
									onClick={onDismiss}
									className='py-3.5 text-sm text-text-secondary hover:text-text transition-colors'
								>
									{t('sbMaybeLater')}
								</button>
							</div>
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}

export default StreakBrokenModal
