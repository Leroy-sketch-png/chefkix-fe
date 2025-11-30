'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
	X,
	Pause,
	Play,
	Sparkles,
	Clock,
	AlertTriangle,
	ChefHat,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	STEP_DOT,
	GLOW_PULSE,
	TIMER_URGENT,
} from '@/lib/motion'
import type { CookingSession, Timer } from '@/lib/types'

// ============================================
// TYPES
// ============================================

type SessionState = 'IN_PROGRESS' | 'PAUSED' | 'IDLE_WARNING'

export interface SessionHeaderProps {
	session: CookingSession
	activeTimers: Timer[]
	onPause: () => void
	onResume: () => void
	onClose: () => void
	onAiAssist: () => void
	className?: string
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface StepDotsProps {
	totalSteps: number
	currentStep: number
	completedSteps: number[]
}

const StepDots = ({
	totalSteps,
	currentStep,
	completedSteps,
}: StepDotsProps) => {
	return (
		<div className='flex items-center gap-1.5'>
			{Array.from({ length: totalSteps }, (_, i) => {
				const stepNum = i + 1
				const isCompleted = completedSteps.includes(stepNum)
				const isCurrent = stepNum === currentStep

				return (
					<motion.div
						key={stepNum}
						initial={false}
						animate={
							isCompleted ? 'completed' : isCurrent ? 'active' : 'inactive'
						}
						variants={STEP_DOT}
						className={cn(
							'h-2 rounded-full transition-all',
							isCompleted
								? 'w-2 bg-success'
								: isCurrent
									? 'w-6 bg-brand'
									: 'w-2 bg-border-medium',
						)}
					/>
				)
			})}
		</div>
	)
}

interface ActiveTimerBadgeProps {
	timer: Timer
	isUrgent?: boolean
}

const ActiveTimerBadge = ({ timer, isUrgent }: ActiveTimerBadgeProps) => {
	const minutes = Math.floor(timer.remaining / 60)
	const seconds = timer.remaining % 60
	const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`

	return (
		<motion.div
			animate={isUrgent ? TIMER_URGENT.animate : undefined}
			className={cn(
				'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold',
				isUrgent ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning',
			)}
		>
			<Clock className='h-3.5 w-3.5' />
			<span>{timeDisplay}</span>
			{timer.label && (
				<span className='max-w-nav truncate text-xs opacity-70'>
					{timer.label}
				</span>
			)}
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export const SessionHeader = ({
	session,
	activeTimers,
	onPause,
	onResume,
	onClose,
	onAiAssist,
	className,
}: SessionHeaderProps) => {
	const isPaused = session.status === 'PAUSED'
	const isIdleWarning = session.idleWarningShown
	const hasActiveTimers = activeTimers.some(t => t.isRunning)
	const urgentTimer = activeTimers.find(t => t.isRunning && t.remaining < 30)

	// Determine visual state
	const getState = (): SessionState => {
		if (isPaused) return 'PAUSED'
		if (isIdleWarning) return 'IDLE_WARNING'
		return 'IN_PROGRESS'
	}

	const state = getState()

	// Progress percentage
	const progress =
		(session.completedSteps.length / session.recipe.totalSteps) * 100

	return (
		<motion.header
			layout
			className={cn(
				'relative overflow-hidden rounded-2xl',
				state === 'PAUSED' && 'ring-2 ring-warning/50',
				state === 'IDLE_WARNING' && 'ring-2 ring-error/50',
				className,
			)}
		>
			{/* Background gradient */}
			<div
				className={cn(
					'absolute inset-0 transition-colors duration-300',
					state === 'IN_PROGRESS' && 'bg-gradient-brand',
					state === 'PAUSED' && 'bg-gradient-to-r from-amber-500 to-orange-500',
					state === 'IDLE_WARNING' &&
						'bg-gradient-to-r from-red-500 to-orange-500',
				)}
			/>

			{/* Content */}
			<div className='relative z-10 p-4'>
				{/* Top row: Recipe info + Actions */}
				<div className='flex items-start justify-between'>
					{/* Recipe info */}
					<div className='flex items-center gap-3'>
						<div className='relative h-12 w-12 overflow-hidden rounded-xl ring-2 ring-white/20'>
							<Image
								src={session.recipe.imageUrl}
								alt={session.recipe.title}
								fill
								className='object-cover'
							/>
						</div>
						<div className='text-white'>
							<h2 className='text-lg font-bold leading-tight'>
								{session.recipe.title}
							</h2>
							<div className='flex items-center gap-2 text-sm text-white/80'>
								<span>
									Step {session.currentStep} of {session.recipe.totalSteps}
								</span>
								<span>•</span>
								<span>~{session.recipe.estimatedTime} min</span>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className='flex items-center gap-2'>
						{/* AI Assist Button */}
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={onAiAssist}
							className='flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30'
						>
							<Sparkles className='h-4 w-4' />
							<span className='hidden sm:inline'>AI Help</span>
						</motion.button>

						{/* Pause/Resume Button */}
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={isPaused ? onResume : onPause}
							disabled={hasActiveTimers && !isPaused}
							className={cn(
								'flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors',
								isPaused
									? 'bg-success hover:bg-success/90'
									: hasActiveTimers
										? 'cursor-not-allowed bg-white/10 opacity-50'
										: 'bg-white/20 hover:bg-white/30',
							)}
							title={
								hasActiveTimers && !isPaused
									? 'Cannot pause while timers are running'
									: isPaused
										? 'Resume cooking'
										: 'Pause session'
							}
						>
							{isPaused ? (
								<Play className='h-5 w-5' />
							) : (
								<Pause className='h-5 w-5' />
							)}
						</motion.button>

						{/* Close Button */}
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={onClose}
							className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30'
						>
							<X className='h-5 w-5' />
						</motion.button>
					</div>
				</div>

				{/* Status banner (when paused or idle warning) */}
				<AnimatePresence>
					{(state === 'PAUSED' || state === 'IDLE_WARNING') && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className='mt-3 overflow-hidden'
						>
							<div
								className={cn(
									'flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold',
									state === 'PAUSED' && 'bg-black/20 text-white',
									state === 'IDLE_WARNING' && 'bg-black/30 text-white',
								)}
							>
								{state === 'PAUSED' ? (
									<>
										<Pause className='h-4 w-4' />
										<span>Session Paused</span>
									</>
								) : (
									<>
										<AlertTriangle className='h-4 w-4' />
										<span>Still there? Session will auto-pause soon</span>
									</>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Progress bar + Step dots */}
				<div className='mt-4 space-y-2'>
					{/* Progress bar */}
					<div className='relative h-1.5 overflow-hidden rounded-full bg-white/20'>
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={TRANSITION_SPRING}
							className='absolute inset-y-0 left-0 rounded-full bg-white'
						/>
					</div>

					{/* Step dots + Active timers */}
					<div className='flex items-center justify-between'>
						<StepDots
							totalSteps={session.recipe.totalSteps}
							currentStep={session.currentStep}
							completedSteps={session.completedSteps}
						/>

						{/* Active timer badges */}
						<div className='flex items-center gap-2'>
							{activeTimers
								.filter(t => t.isRunning)
								.slice(0, 2)
								.map(timer => (
									<ActiveTimerBadge
										key={timer.id}
										timer={timer}
										isUrgent={timer.remaining < 30}
									/>
								))}
							{activeTimers.filter(t => t.isRunning).length > 2 && (
								<span className='text-sm text-white/70'>
									+{activeTimers.filter(t => t.isRunning).length - 2} more
								</span>
							)}
						</div>
					</div>
				</div>

				{/* XP Preview */}
				<div className='mt-3 flex items-center justify-center gap-4 text-sm text-white/80'>
					<div className='flex items-center gap-1.5'>
						<span className='text-lg'>⚡</span>
						<span>
							<span className='font-bold text-white'>
								+{session.baseXP + session.bonusXP}
							</span>{' '}
							XP on completion
						</span>
					</div>
					{session.challengeId && (
						<div className='flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5'>
							<span>🎯</span>
							<span className='font-semibold'>Challenge</span>
						</div>
					)}
				</div>
			</div>
		</motion.header>
	)
}

// ============================================
// COMPACT VARIANT (for mobile/minimized view)
// ============================================

interface SessionHeaderCompactProps {
	session: CookingSession
	activeTimers: Timer[]
	onExpand: () => void
}

export const SessionHeaderCompact = ({
	session,
	activeTimers,
	onExpand,
}: SessionHeaderCompactProps) => {
	const progress =
		(session.completedSteps.length / session.recipe.totalSteps) * 100
	const hasActiveTimers = activeTimers.some(t => t.isRunning)

	return (
		<motion.button
			onClick={onExpand}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className='flex w-full items-center gap-3 rounded-xl bg-gradient-brand p-3 text-left text-white shadow-lg'
		>
			{/* Mini progress ring */}
			<div className='relative h-10 w-10'>
				<svg className='h-full w-full -rotate-90' viewBox='0 0 36 36'>
					<circle
						cx='18'
						cy='18'
						r='15'
						fill='none'
						stroke='rgba(255,255,255,0.2)'
						strokeWidth='3'
					/>
					<circle
						cx='18'
						cy='18'
						r='15'
						fill='none'
						stroke='white'
						strokeWidth='3'
						strokeDasharray={`${progress} 100`}
						strokeLinecap='round'
					/>
				</svg>
				<ChefHat className='absolute inset-0 m-auto h-5 w-5' />
			</div>

			{/* Info */}
			<div className='min-w-0 flex-1'>
				<p className='truncate font-semibold'>{session.recipe.title}</p>
				<p className='text-sm text-white/80'>
					Step {session.currentStep}/{session.recipe.totalSteps}
				</p>
			</div>

			{/* Timer indicator */}
			{hasActiveTimers && (
				<motion.div
					animate={GLOW_PULSE.animate}
					className='flex h-8 w-8 items-center justify-center rounded-full bg-warning'
				>
					<Clock className='h-4 w-4 text-white' />
				</motion.div>
			)}
		</motion.button>
	)
}
