'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Clock,
	Play,
	Pause,
	RotateCcw,
	X,
	ChevronUp,
	ChevronDown,
	Bell,
	Volume2,
	VolumeX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	TIMER_URGENT,
	GLOW_PULSE,
} from '@/lib/motion'
import type { Timer } from '@/lib/types'

// ============================================
// TYPES
// ============================================

interface ConcurrentTimersProps {
	timers: Timer[]
	onAddTimer: (label: string, duration: number) => void
	onStartTimer: (id: string) => void
	onPauseTimer: (id: string) => void
	onResetTimer: (id: string) => void
	onDeleteTimer: (id: string) => void
	onTimerComplete: (timer: Timer) => void
	className?: string
}

type TimerState = 'RUNNING' | 'PAUSED' | 'COMPLETE' | 'URGENT'

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getTimerState = (timer: Timer): TimerState => {
	if (timer.remaining === 0) return 'COMPLETE'
	if (timer.remaining <= 30 && timer.isRunning) return 'URGENT'
	if (timer.isRunning) return 'RUNNING'
	return 'PAUSED'
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface TimerItemProps {
	timer: Timer
	onStart: () => void
	onPause: () => void
	onReset: () => void
	onDelete: () => void
	isExpanded: boolean
}

const TimerItem = ({
	timer,
	onStart,
	onPause,
	onReset,
	onDelete,
	isExpanded,
}: TimerItemProps) => {
	const state = getTimerState(timer)
	const progress = (timer.remaining / timer.duration) * 100

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'relative overflow-hidden rounded-xl border transition-colors',
				state === 'RUNNING' && 'border-brand/30 bg-brand/5',
				state === 'URGENT' && 'border-error/50 bg-error/10',
				state === 'COMPLETE' && 'border-success/50 bg-success/10',
				state === 'PAUSED' && 'border-border bg-bg-card',
			)}
		>
			{/* Progress bar background */}
			<div className='absolute inset-0 overflow-hidden'>
				<motion.div
					className={cn(
						'absolute inset-y-0 left-0 opacity-20',
						state === 'RUNNING' && 'bg-brand',
						state === 'URGENT' && 'bg-error',
						state === 'COMPLETE' && 'bg-success',
					)}
					initial={{ width: '100%' }}
					animate={{ width: `${progress}%` }}
					transition={{ duration: 0.5, ease: 'linear' }}
				/>
			</div>

			{/* Content */}
			<div className='relative z-10 p-3'>
				<div className='flex items-center gap-3'>
					{/* Timer icon with state indicator */}
					<motion.div
						animate={
							state === 'URGENT'
								? TIMER_URGENT.animate
								: state === 'COMPLETE'
									? GLOW_PULSE.animate
									: undefined
						}
						className={cn(
							'flex h-10 w-10 items-center justify-center rounded-full',
							state === 'RUNNING' && 'bg-brand text-white',
							state === 'URGENT' && 'bg-error text-white',
							state === 'COMPLETE' && 'bg-success text-white',
							state === 'PAUSED' && 'bg-border text-text-secondary',
						)}
					>
						{state === 'COMPLETE' ? (
							<Bell className='h-5 w-5' />
						) : (
							<Clock className='h-5 w-5' />
						)}
					</motion.div>

					{/* Timer info */}
					<div className='min-w-0 flex-1'>
						<p
							className={cn(
								'truncate font-medium',
								state === 'COMPLETE' && 'text-success',
								state === 'URGENT' && 'text-error',
							)}
						>
							{timer.label || `Timer ${timer.stepNumber || ''}`}
						</p>
						<p
							className={cn(
								'text-2xl font-bold tabular-nums',
								state === 'RUNNING' && 'text-brand',
								state === 'URGENT' && 'text-error',
								state === 'COMPLETE' && 'text-success',
								state === 'PAUSED' && 'text-text-secondary',
							)}
						>
							{formatTime(timer.remaining)}
						</p>
					</div>

					{/* Controls */}
					<div className='flex items-center gap-1'>
						{state !== 'COMPLETE' && (
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								onClick={timer.isRunning ? onPause : onStart}
								className={cn(
									'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
									timer.isRunning
										? 'bg-brand/20 text-brand hover:bg-brand/30'
										: 'bg-success/20 text-success hover:bg-success/30',
								)}
							>
								{timer.isRunning ? (
									<Pause className='h-5 w-5' />
								) : (
									<Play className='h-5 w-5 ml-0.5' />
								)}
							</motion.button>
						)}

						{isExpanded && (
							<>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									onClick={onReset}
									className='flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-bg-hover hover:text-text'
								>
									<RotateCcw className='h-4 w-4' />
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									onClick={onDelete}
									className='flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-error/10 hover:text-error'
								>
									<X className='h-4 w-4' />
								</motion.button>
							</>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	)
}

// Timer complete alert overlay
interface TimerCompleteAlertProps {
	timer: Timer
	onDismiss: () => void
	onSnooze: (seconds: number) => void
}

const TimerCompleteAlert = ({
	timer,
	onDismiss,
	onSnooze,
}: TimerCompleteAlertProps) => {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9, y: 20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: 20 }}
			transition={TRANSITION_BOUNCY}
			className='fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm overflow-hidden rounded-2xl bg-panel-bg shadow-lg ring-2 ring-success/50 md:inset-x-auto md:right-4 md:bottom-4'
		>
			{/* Animated background glow */}
			<motion.div
				animate={{
					opacity: [0.3, 0.6, 0.3],
				}}
				transition={{ duration: 1.5, repeat: Infinity }}
				className='absolute inset-0 bg-success/10'
			/>

			<div className='relative z-10 p-4'>
				<div className='flex items-start gap-3'>
					{/* Pulsing bell */}
					<motion.div
						animate={{
							scale: [1, 1.2, 1],
							rotate: [0, 10, -10, 0],
						}}
						transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
						className='flex h-12 w-12 items-center justify-center rounded-full bg-success text-white'
					>
						<Bell className='h-6 w-6' />
					</motion.div>

					<div className='flex-1'>
						<p className='font-bold text-success'>Timer Complete!</p>
						<p className='text-text-secondary'>
							{timer.label || 'Your timer has finished'}
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className='mt-4 flex gap-2'>
					<button
						onClick={() => onSnooze(60)}
						className='flex-1 rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover'
					>
						+1 min
					</button>
					<button
						onClick={() => onSnooze(300)}
						className='flex-1 rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover'
					>
						+5 min
					</button>
					<button
						onClick={onDismiss}
						className='flex-1 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90'
					>
						Done
					</button>
				</div>
			</div>
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export const ConcurrentTimers = ({
	timers,
	onAddTimer,
	onStartTimer,
	onPauseTimer,
	onResetTimer,
	onDeleteTimer,
	onTimerComplete,
	className,
}: ConcurrentTimersProps) => {
	const [isExpanded, setIsExpanded] = useState(false)
	const [isMuted, setIsMuted] = useState(false)
	const [completedTimer, setCompletedTimer] = useState<Timer | null>(null)

	const runningCount = timers.filter(t => t.isRunning).length
	const urgentCount = timers.filter(
		t => t.isRunning && t.remaining <= 30,
	).length

	// Handle timer completion
	useEffect(() => {
		const justCompleted = timers.find(t => t.remaining === 0 && t.isRunning)
		if (justCompleted) {
			setCompletedTimer(justCompleted)
			onTimerComplete(justCompleted)
			if (!isMuted) {
				// Play notification sound (you'd implement this with Web Audio API)
				// playTimerCompleteSound()
			}
		}
	}, [timers, isMuted, onTimerComplete])

	const handleDismissAlert = useCallback(() => {
		setCompletedTimer(null)
	}, [])

	const handleSnooze = useCallback(
		(seconds: number) => {
			if (completedTimer) {
				onResetTimer(completedTimer.id)
				// Would need to modify the timer duration here
				setCompletedTimer(null)
			}
		},
		[completedTimer, onResetTimer],
	)

	// No timers - don't render
	if (timers.length === 0) return null

	return (
		<>
			{/* Timer Panel */}
			<motion.div
				layout
				className={cn(
					'overflow-hidden rounded-2xl bg-panel-bg shadow-lg',
					urgentCount > 0 && 'ring-2 ring-error/50',
					className,
				)}
			>
				{/* Header */}
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className='flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-bg-hover'
				>
					<div className='flex items-center gap-3'>
						<div
							className={cn(
								'flex h-10 w-10 items-center justify-center rounded-full',
								runningCount > 0
									? 'bg-brand text-white'
									: 'bg-bg-elevated text-text-secondary',
							)}
						>
							<Clock className='h-5 w-5' />
						</div>
						<div>
							<p className='font-semibold text-text'>
								{runningCount} Active Timer{runningCount !== 1 ? 's' : ''}
							</p>
							<p className='text-sm text-text-tertiary'>
								{timers.length} total
							</p>
						</div>
					</div>

					<div className='flex items-center gap-2'>
						{/* Mute toggle */}
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							onClick={e => {
								e.stopPropagation()
								setIsMuted(!isMuted)
							}}
							className={cn(
								'flex h-8 w-8 items-center justify-center rounded-full',
								isMuted
									? 'bg-error/10 text-error'
									: 'text-text-tertiary hover:bg-bg-elevated',
							)}
						>
							{isMuted ? (
								<VolumeX className='h-4 w-4' />
							) : (
								<Volume2 className='h-4 w-4' />
							)}
						</motion.button>

						{/* Expand/Collapse */}
						<motion.div
							animate={{ rotate: isExpanded ? 180 : 0 }}
							transition={TRANSITION_SPRING}
						>
							<ChevronDown className='h-5 w-5 text-text-tertiary' />
						</motion.div>
					</div>
				</button>

				{/* Collapsed preview - show first running timer */}
				<AnimatePresence>
					{!isExpanded && runningCount > 0 && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className='border-t border-border px-4 pb-4'
						>
							<div className='flex items-center gap-2 pt-3'>
								{timers
									.filter(t => t.isRunning)
									.slice(0, 3)
									.map(timer => (
										<div
											key={timer.id}
											className={cn(
												'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold',
												timer.remaining <= 30
													? 'bg-error/20 text-error'
													: 'bg-brand/20 text-brand',
											)}
										>
											<Clock className='h-3.5 w-3.5' />
											<span className='tabular-nums'>
												{formatTime(timer.remaining)}
											</span>
										</div>
									))}
								{runningCount > 3 && (
									<span className='text-sm text-text-tertiary'>
										+{runningCount - 3} more
									</span>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Expanded timer list */}
				<AnimatePresence>
					{isExpanded && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className='border-t border-border'
						>
							<div className='max-h-80 space-y-2 overflow-y-auto p-4'>
								<AnimatePresence mode='popLayout'>
									{timers.map(timer => (
										<TimerItem
											key={timer.id}
											timer={timer}
											onStart={() => onStartTimer(timer.id)}
											onPause={() => onPauseTimer(timer.id)}
											onReset={() => onResetTimer(timer.id)}
											onDelete={() => onDeleteTimer(timer.id)}
											isExpanded={isExpanded}
										/>
									))}
								</AnimatePresence>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			{/* Timer Complete Alert */}
			<AnimatePresence>
				{completedTimer && (
					<TimerCompleteAlert
						timer={completedTimer}
						onDismiss={handleDismissAlert}
						onSnooze={handleSnooze}
					/>
				)}
			</AnimatePresence>
		</>
	)
}

// ============================================
// MINI TIMER BAR (for sticky bottom)
// ============================================

interface MiniTimerBarProps {
	timers: Timer[]
	onClick: () => void
}

export const MiniTimerBar = ({ timers, onClick }: MiniTimerBarProps) => {
	const running = timers.filter(t => t.isRunning)
	const urgent = running.find(t => t.remaining <= 30)

	if (running.length === 0) return null

	return (
		<motion.button
			initial={{ y: 100 }}
			animate={{ y: 0 }}
			exit={{ y: 100 }}
			onClick={onClick}
			className={cn(
				'fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-sm items-center justify-between rounded-full px-4 py-3 shadow-lg md:inset-x-auto md:right-4 md:bottom-4',
				urgent ? 'bg-error text-white' : 'bg-brand text-white',
			)}
		>
			<div className='flex items-center gap-2'>
				<motion.div animate={urgent ? TIMER_URGENT.animate : undefined}>
					<Clock className='h-5 w-5' />
				</motion.div>
				<span className='font-semibold'>
					{running.length} Timer{running.length > 1 ? 's' : ''} Running
				</span>
			</div>
			{urgent && (
				<span className='font-bold tabular-nums'>
					{formatTime(urgent.remaining)}
				</span>
			)}
		</motion.button>
	)
}
