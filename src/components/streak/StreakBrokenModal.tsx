'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'

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
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-modal flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm'
				>
					<motion.div
						initial={{ opacity: 0, y: 30, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 30, scale: 0.95 }}
						transition={TRANSITION_SPRING}
						className='w-full max-w-modal-md bg-panel-bg rounded-3xl p-10 text-center'
					>
						{/* Sad Icon */}
						<div className='relative mb-6'>
							<span className='text-icon-emoji-xl block'>😢</span>
							<div className='absolute top-[-10px] right-[30%]'>
								<span className='text-2xl opacity-30 grayscale'>🔥</span>
							</div>
						</div>

						{/* Title */}
						<h2 className='text-2xl font-extrabold text-text mb-2'>
							Your streak ended
						</h2>
						<p className='text-sm text-muted-foreground mb-6'>
							Your {lostStreak}-day cooking streak has reset to 0
						</p>

						{/* Stats Lost */}
						<div className='flex justify-center gap-6 py-5 px-6 bg-bg rounded-xl mb-5'>
							<div className='flex flex-col gap-1'>
								<span className='text-xs text-muted-foreground'>
									Streak Length
								</span>
								<span className='text-lg font-bold text-text'>
									{lostStreak} days
								</span>
							</div>
							<div className='flex flex-col gap-1'>
								<span className='text-xs text-muted-foreground'>
									Streak Bonuses Earned
								</span>
								<span className='text-lg font-bold text-text'>
									+{totalBonusXpEarned} XP
								</span>
							</div>
						</div>

						{/* Motivation */}
						<div className='mb-5 space-y-2 text-sm text-muted-foreground'>
							<p>Don&apos;t worry — every great chef has off days.</p>
							<p>
								Your skills and XP are still there. Let&apos;s start fresh! 💪
							</p>
						</div>

						{/* Best Streak */}
						{bestStreak && bestStreak > lostStreak && (
							<div className='flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 rounded-lg mb-6'>
								<span className='text-xs text-muted-foreground'>
									Your best streak:
								</span>
								<span className='text-sm font-bold text-emerald-500'>
									{bestStreak} days
								</span>
								<span className='text-xs text-emerald-500'>
									You can beat it!
								</span>
							</div>
						)}

						{/* Actions */}
						<div className='flex flex-col gap-2.5'>
							<motion.button
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								onClick={onStartNewStreak}
								className={cn(
									'flex items-center justify-center gap-2 py-4 px-6 rounded-xl',
									'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
									'text-base font-bold shadow-lg shadow-orange-500/30',
								)}
							>
								<Flame className='w-5 h-5' />
								Start New Streak
							</motion.button>
							<button
								onClick={onDismiss}
								className='py-3.5 text-sm text-muted-foreground hover:text-text transition-colors'
							>
								Maybe Later
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default StreakBrokenModal
