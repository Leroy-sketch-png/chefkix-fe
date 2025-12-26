'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
	Clock,
	X,
	Zap,
	ChefHat,
	Flame,
	Share2,
	CheckCircle2,
	AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	DURATIONS,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'

// ============================================================================
// TYPES
// ============================================================================

export interface StreakRiskBannerProps {
	currentStreak: number
	timeRemaining: { hours: number; minutes: number }
	isUrgent?: boolean // Less than 2 hours
	onQuickCook?: () => void
	onDismiss?: () => void
	className?: string
}

export interface StreakSavedToastProps {
	newStreak: number
	bonusXp: number
	isNewStreak?: boolean
	isVisible: boolean
	onClose?: () => void
}

export interface StreakMilestoneCardProps {
	days: number
	badgeName: string
	badgeEmoji: string
	nextMilestone?: { days: number; badgeName: string }
	onShare?: () => void
	className?: string
}

export interface StreakWidgetProps {
	currentStreak: number
	weekProgress: ('cooked' | 'today' | 'future')[] // 7 days, Mon-Sun
	isActiveToday: boolean
	status: 'active' | 'at-risk'
	className?: string
}

// ============================================================================
// STREAK AT RISK BANNER
// ============================================================================

export function StreakRiskBanner({
	currentStreak,
	timeRemaining,
	isUrgent = false,
	onQuickCook,
	onDismiss,
	className,
}: StreakRiskBannerProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className={cn(
				'relative flex flex-col sm:flex-row items-center gap-4 p-3.5 sm:p-5 rounded-2xl mb-4',
				isUrgent
					? 'bg-gradient-to-r from-streak-urgent/15 to-streak-urgent/10 border border-streak-urgent/40'
					: 'bg-gradient-to-r from-streak/10 to-streak/5 border border-streak/30',
				isUrgent && 'animate-pulse',
				className,
			)}
		>
			{/* Content */}
			<div className='flex flex-col sm:flex-row items-center gap-4 flex-1'>
				{/* Fire Icon */}
				<div className='relative flex-shrink-0'>
					<motion.span
						animate={isUrgent ? { x: [-3, 3, -3] } : { rotate: [-5, 5, -5] }}
						transition={{
							duration: isUrgent ? 0.3 : 1,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
						className='text-icon-xl block'
					>
						🔥
					</motion.span>
					<div
						className={cn(
							'absolute -inset-2 border-2 border-dashed rounded-full opacity-50',
							isUrgent
								? 'border-streak-urgent animate-ping'
								: 'border-streak animate-spin-slow',
						)}
					/>
				</div>

				{/* Info */}
				<div className='flex flex-col text-center sm:text-left'>
					<span className='text-base font-bold text-text'>
						{isUrgent ? (
							<>⚠️ LAST CHANCE! {currentStreak}-day streak ending soon</>
						) : (
							<>Your {currentStreak}-day streak is at risk!</>
						)}
					</span>
					<span className='text-sm text-muted-foreground'>
						{isUrgent
							? `Don't lose ${currentStreak} days of progress!`
							: 'Cook something today to keep it alive'}
					</span>
				</div>

				{/* Timer */}
				<div
					className={cn(
						'flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-sm',
						isUrgent
							? 'bg-streak-urgent/15 text-streak-urgent'
							: 'bg-streak/15 text-streak',
					)}
				>
					<Clock className='w-4 h-4' />
					<span className='font-bold'>
						{timeRemaining.hours}h {timeRemaining.minutes}m
					</span>
					{!isUrgent && <span className='text-xs opacity-80'>left today</span>}
				</div>
			</div>

			{/* CTA Button */}
			<motion.button
				whileHover={BUTTON_HOVER}
				whileTap={BUTTON_TAP}
				transition={TRANSITION_SPRING}
				onClick={onQuickCook}
				className={cn(
					'flex items-center justify-center gap-2 py-3 px-5 rounded-xl',
					'text-sm font-bold text-white flex-shrink-0 w-full sm:w-auto',
					isUrgent
						? 'bg-gradient-to-r from-streak-urgent to-streak-urgent/90 shadow-lg shadow-streak-urgent/30'
						: 'bg-gradient-to-r from-streak to-streak/90 shadow-lg shadow-streak/30',
				)}
			>
				{isUrgent ? (
					<Zap className='size-icon-sm' />
				) : (
					<ChefHat className='size-icon-sm' />
				)}
				{isUrgent ? 'Save Streak Now!' : 'Quick Cook'}
			</motion.button>

			{/* Dismiss Button */}
			{onDismiss && !isUrgent && (
				<button
					onClick={onDismiss}
					className='absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-muted-foreground opacity-60 hover:opacity-100 transition-opacity'
				>
					<X className='w-4 h-4' />
				</button>
			)}
		</motion.div>
	)
}

// ============================================================================
// STREAK SAVED TOAST
// ============================================================================

export function StreakSavedToast({
	newStreak,
	bonusXp,
	isNewStreak = false,
	isVisible,
	onClose,
}: StreakSavedToastProps) {
	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: 30, scale: 0.9 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 30, scale: 0.9 }}
					transition={TRANSITION_SPRING}
					className={cn(
						'fixed bottom-24 left-1/2 -translate-x-1/2 z-notification',
						'flex items-center gap-4 py-4 px-6',
						'bg-panel-bg border-2 border-emerald-500 rounded-2xl',
						'shadow-2xl shadow-black/30',
					)}
				>
					{/* Celebration */}
					<div className='relative'>
						<motion.span
							initial={{ scale: 0, rotate: -30 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ delay: 0.1, ...TRANSITION_SPRING }}
							className='text-4xl block'
						>
							{isNewStreak ? '🌱' : '🔥'}
						</motion.span>
						{!isNewStreak && (
							<motion.div
								initial={{ scale: 0.5, opacity: 1 }}
								animate={{ scale: 2, opacity: 0 }}
								transition={{ duration: 0.8 }}
								className='absolute -inset-2.5 bg-streak/30 rounded-full'
							/>
						)}
					</div>

					{/* Content */}
					<div className='flex flex-col'>
						<span className='text-base font-extrabold text-emerald-500'>
							{isNewStreak ? 'New Streak Started!' : 'Streak Saved!'}
						</span>
						<span className='text-sm text-text'>
							{isNewStreak ? (
								<>Day 1 — Let&apos;s go!</>
							) : (
								<>
									<strong>{newStreak} days</strong> and counting
								</>
							)}
						</span>
					</div>

					{/* Bonus XP */}
					{!isNewStreak && bonusXp > 0 && (
						<div className='flex flex-col items-center py-2.5 px-4 bg-emerald-500/10 rounded-lg'>
							<span className='text-2xs text-muted-foreground uppercase tracking-wide'>
								Streak Bonus
							</span>
							<span className='text-base font-extrabold text-emerald-500'>
								+{bonusXp} XP
							</span>
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	)
}

// ============================================================================
// STREAK MILESTONE CARD
// ============================================================================

export function StreakMilestoneCard({
	days,
	badgeName,
	badgeEmoji,
	nextMilestone,
	onShare,
	className,
}: StreakMilestoneCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className={cn(
				'flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6',
				'bg-gradient-to-r from-streak/10 to-streak/5',
				'border-2 border-streak/30 rounded-xl mb-4',
				className,
			)}
		>
			{/* Badge */}
			<div className='relative size-thumbnail-lg flex items-center justify-center bg-gradient-to-br from-streak to-streak/90 rounded-full flex-shrink-0'>
				{/* Glow */}
				<motion.div
					animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
					transition={{ duration: 2, repeat: Infinity }}
					className='absolute -inset-2 bg-gradient-to-r from-streak/40 to-transparent rounded-full'
				/>
				<span className='text-icon-lg relative z-10'>{badgeEmoji}</span>
				<div className='absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center bg-panel-bg border-3 border-streak rounded-full text-xs font-black text-streak'>
					{days}
				</div>
			</div>

			{/* Content */}
			<div className='flex-1 text-center sm:text-left'>
				<h3 className='text-lg font-extrabold text-text mb-1'>
					{days}-Day Streak! 🎉
				</h3>
				<p className='text-sm text-muted-foreground mb-3'>
					You cooked every day for{' '}
					{days === 7 ? 'a week' : days === 14 ? 'two weeks' : `${days} days`}!
				</p>

				{/* Badge Reward */}
				<div className='flex items-center gap-2.5 p-2.5 bg-panel-bg rounded-xl mb-2.5 justify-center sm:justify-start'>
					<span className='text-2xl'>🎖️</span>
					<div className='flex flex-col'>
						<span className='text-sm font-bold text-text'>{badgeName}</span>
						<span className='text-xs text-muted-foreground'>
							Added to your collection
						</span>
					</div>
				</div>

				{/* Next Milestone */}
				{nextMilestone && (
					<div className='text-xs text-muted-foreground'>
						<span>Next milestone: </span>
						<span className='text-streak font-semibold'>
							{nextMilestone.days}-day streak → {nextMilestone.badgeName}
						</span>
					</div>
				)}
			</div>

			{/* Share Button */}
			{onShare && (
				<motion.button
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					transition={TRANSITION_SPRING}
					onClick={onShare}
					className='flex items-center gap-1.5 py-2.5 px-4 bg-panel-bg border border-border rounded-lg text-sm font-semibold text-text flex-shrink-0'
				>
					<Share2 className='w-4 h-4' />
					Share
				</motion.button>
			)}
		</motion.div>
	)
}

// ============================================================================
// STREAK MILESTONE MINI (Inline Notification)
// ============================================================================

export function StreakMilestoneMini({
	days,
	onViewBadge,
	className,
}: {
	days: number
	onViewBadge?: () => void
	className?: string
}) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			className={cn(
				'flex items-center gap-3 py-3 px-4',
				'bg-gradient-to-r from-streak/15 to-streak/10 rounded-xl mb-3',
				className,
			)}
		>
			<span className='py-1.5 px-2.5 bg-gradient-to-r from-streak to-streak/90 rounded-lg text-sm font-extrabold text-white'>
				🔥 {days}
			</span>
			<span className='flex-1 text-sm font-semibold text-text'>
				{days}-day streak! You&apos;re on fire!
			</span>
			{onViewBadge && (
				<button
					onClick={onViewBadge}
					className='py-2 px-3.5 bg-panel-bg border border-border rounded-lg text-xs font-semibold text-text hover:bg-border transition-colors'
				>
					View Badge
				</button>
			)}
		</motion.div>
	)
}

// ============================================================================
// STREAK WIDGET (Sidebar/Dashboard)
// ============================================================================

export function StreakWidget({
	currentStreak,
	weekProgress,
	isActiveToday,
	status,
	className,
}: StreakWidgetProps) {
	const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

	return (
		<div
			className={cn(
				'bg-panel-bg border border-border rounded-2xl p-5',
				className,
			)}
		>
			{/* Header */}
			<div className='flex justify-between items-center mb-4'>
				<span className='text-sm font-bold text-text'>Cooking Streak</span>
				<span
					className={cn(
						'py-1 px-2.5 rounded-full text-xs font-bold uppercase tracking-wide',
						status === 'active'
							? 'bg-success/15 text-success'
							: 'bg-streak/15 text-streak',
					)}
				>
					{status === 'active' ? 'Active' : 'At Risk'}
				</span>
			</div>

			{/* Streak Display */}
			<div className='flex items-baseline justify-center gap-2 mb-5'>
				<span className='text-4xl'>🔥</span>
				<span className='text-5xl font-black text-orange-500 leading-none'>
					{currentStreak}
				</span>
				<span className='text-base font-semibold text-muted-foreground'>
					days
				</span>
			</div>

			{/* Week Progress */}
			<div className='mb-4'>
				<span className='block text-xs text-muted-foreground uppercase tracking-wide mb-2.5 text-center'>
					This Week
				</span>
				<div className='flex justify-between gap-1.5'>
					{weekProgress.map((day, index) => (
						<div
							key={index}
							className={cn(
								'flex-1 aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all',
								day === 'cooked' &&
									'bg-gradient-streak text-white shadow-sm shadow-streak/30',
								day === 'today' &&
									(isActiveToday
										? 'bg-gradient-success text-white shadow-sm shadow-success/30'
										: 'bg-panel-bg border-2 border-dashed border-success text-success'),
								day === 'future' &&
									'bg-bg border-2 border-border text-muted-foreground',
							)}
							title={`${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}${day === 'today' ? ' (Today)' : ''}`}
						>
							{dayLabels[index]}
						</div>
					))}
				</div>
			</div>

			{/* Footer Status */}
			<div className='pt-4 border-t border-border'>
				<div
					className={cn(
						'flex items-center justify-center gap-2 text-sm font-semibold',
						isActiveToday ? 'text-success' : 'text-streak',
					)}
				>
					{isActiveToday ? (
						<>
							<CheckCircle2 className='size-icon-sm' />
							Cooked today ✓
						</>
					) : (
						<>
							<AlertCircle className='size-icon-sm' />
							Cook today to extend streak
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default StreakWidget
