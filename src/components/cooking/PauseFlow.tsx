'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Pause,
	Play,
	X,
	AlertCircle,
	CheckCircle,
	Timer,
	AlertTriangle,
	RefreshCw,
	Home,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	TRANSITION_SMOOTH,
	EXIT_VARIANTS,
	CELEBRATION_MODAL,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type PauseFlowState =
	| 'idle' // Normal cooking, pause button available
	| 'blocked' // Cannot pause (timers running)
	| 'confirming' // Pause confirmation modal
	| 'paused' // Full screen paused state
	| 'abandoning' // Abandon confirmation
	| 'expired' // Session expired

interface ActiveTimer {
	id: string
	step: number
	name: string
	remainingSeconds: number
}

interface RecipeSummary {
	id: string
	title: string
	imageUrl: string
	currentStep: number
	totalSteps: number
}

interface PauseFlowProps {
	state: PauseFlowState
	recipe: RecipeSummary
	activeTimers: ActiveTimer[]
	pauseDeadlineTimestamp?: number // Unix timestamp when session expires
	onPause: () => void
	onResume: () => void
	onAbandon: () => void
	onRestart: () => void
	onGoHome: () => void
	onStateChange: (state: PauseFlowState) => void
}

// ============================================
// CONSTANTS
// ============================================

const PAUSE_LIMIT_HOURS = 3

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = seconds % 60
	if (h > 0) {
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
	}
	return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatTimerRemaining(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} remaining`
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Pause Button (for SessionHeader)
interface PauseButtonProps {
	disabled: boolean
	onClick: () => void
	tooltipText?: string
}

export const PauseButton = ({
	disabled,
	onClick,
	tooltipText = 'Complete or skip active timer first',
}: PauseButtonProps) => (
	<div className='group relative'>
		<motion.button
			onClick={onClick}
			disabled={disabled}
			whileHover={disabled ? undefined : { scale: 1.05 }}
			whileTap={disabled ? undefined : { scale: 0.95 }}
			className={cn(
				'flex items-center gap-2 rounded-lg border px-4 py-2.5 font-semibold transition-colors',
				disabled
					? 'cursor-not-allowed border-border bg-bg-elevated text-text-muted opacity-50'
					: 'border-border bg-bg-card text-text hover:bg-bg-hover',
			)}
		>
			<Pause className='h-4 w-4' />
			<span>Pause</span>
		</motion.button>

		{/* Tooltip */}
		{disabled && (
			<div className='pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-text px-3 py-2 text-sm font-medium text-panel-bg opacity-0 transition-opacity group-hover:opacity-100'>
				{tooltipText}
				<div className='absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-text' />
			</div>
		)}
	</div>
)

// Modal Overlay
interface ModalOverlayProps {
	children: React.ReactNode
	onClose?: () => void
}

const ModalOverlay = ({ children, onClose }: ModalOverlayProps) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		onClick={onClose}
		className='fixed inset-0 z-modal flex items-center justify-content-center bg-black/60 p-6 backdrop-blur-sm'
	>
		<div className='flex min-h-full w-full items-center justify-center'>
			<motion.div
				variants={CELEBRATION_MODAL}
				initial='hidden'
				animate='visible'
				exit='exit'
				onClick={e => e.stopPropagation()}
			>
				{children}
			</motion.div>
		</div>
	</motion.div>
)

// Pause Confirmation Modal
interface PauseConfirmModalProps {
	recipe: RecipeSummary
	onCancel: () => void
	onConfirm: () => void
}

const PauseConfirmModal = ({
	recipe,
	onCancel,
	onConfirm,
}: PauseConfirmModalProps) => (
	<div className='w-full max-w-md rounded-2xl bg-panel-bg p-8 text-center'>
		<div className='mb-4 text-6xl'>⏸️</div>
		<h2 className='mb-3 text-2xl font-bold'>Pause Cooking Session?</h2>
		<p className='mb-6 text-text-secondary'>
			Your progress will be saved. You&apos;ll have{' '}
			<strong>{PAUSE_LIMIT_HOURS} hours</strong> to resume before the session
			expires.
		</p>

		{/* Info card */}
		<div className='mb-6 rounded-xl bg-bg-elevated p-4 text-left'>
			<div className='flex items-center gap-3 border-b border-border py-2.5'>
				<CheckCircle className='h-5 w-5 shrink-0 text-success' />
				<span className='text-sm'>
					Progress saved at Step {recipe.currentStep}
				</span>
			</div>
			<div className='flex items-center gap-3 border-b border-border py-2.5'>
				<Timer className='h-5 w-5 shrink-0 text-success' />
				<span className='text-sm'>No active timers</span>
			</div>
			<div className='flex items-center gap-3 py-2.5 text-warning'>
				<AlertCircle className='h-5 w-5 shrink-0' />
				<span className='text-sm'>
					Session expires if not resumed in {PAUSE_LIMIT_HOURS} hours
				</span>
			</div>
		</div>

		{/* Actions */}
		<div className='grid grid-cols-2 gap-3'>
			<button
				onClick={onCancel}
				className='rounded-xl border border-border bg-bg-elevated px-6 py-3.5 font-semibold transition-colors hover:bg-bg-hover'
			>
				Keep Cooking
			</button>
			<button
				onClick={onConfirm}
				className='rounded-xl bg-brand px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90'
			>
				Pause Session
			</button>
		</div>
	</div>
)

// Cannot Pause Modal (timers active)
interface BlockedModalProps {
	activeTimers: ActiveTimer[]
	onClose: () => void
}

const BlockedModal = ({ activeTimers, onClose }: BlockedModalProps) => (
	<div className='w-full max-w-md rounded-2xl bg-panel-bg p-8 text-center'>
		<motion.div
			animate={{ x: [-8, 8, -8, 8, 0] }}
			transition={{ duration: 0.5 }}
			className='mb-4 text-6xl'
		>
			⚠️
		</motion.div>
		<h2 className='mb-3 text-2xl font-bold'>Cannot Pause Yet</h2>
		<p className='mb-6 text-text-secondary'>
			You have active timers running. Complete or skip them before pausing.
		</p>

		{/* Active timers list */}
		<div className='mb-6 rounded-xl border border-error/20 bg-error/5 p-4'>
			{activeTimers.map(timer => (
				<div
					key={timer.id}
					className='flex items-center gap-3 border-b border-error/10 py-2 last:border-0'
				>
					<span className='font-semibold text-error'>Step {timer.step}</span>
					<span className='flex-1 text-left text-sm'>{timer.name}</span>
					<span className='font-mono text-sm text-text-muted'>
						{formatTimerRemaining(timer.remainingSeconds)}
					</span>
				</div>
			))}
		</div>

		<button
			onClick={onClose}
			className='w-full rounded-xl border border-border bg-bg-elevated px-6 py-3.5 font-semibold transition-colors hover:bg-bg-hover'
		>
			Got It
		</button>
	</div>
)

// Abandon Confirmation Modal
interface AbandonModalProps {
	onCancel: () => void
	onConfirm: () => void
}

const AbandonModal = ({ onCancel, onConfirm }: AbandonModalProps) => (
	<div className='w-full max-w-md rounded-2xl bg-panel-bg p-8 text-center'>
		<div className='mb-4 text-6xl'>🗑️</div>
		<h2 className='mb-3 text-2xl font-bold'>Abandon Session?</h2>
		<p className='mb-6 text-text-secondary'>
			You&apos;ll lose your progress and won&apos;t earn XP for this cooking
			attempt.
		</p>

		{/* Warning */}
		<div className='mb-6 flex items-center justify-center gap-2 rounded-lg bg-error/10 px-4 py-3 text-error'>
			<AlertTriangle className='h-5 w-5' />
			<span className='text-sm font-medium'>This action cannot be undone</span>
		</div>

		{/* Actions */}
		<div className='grid grid-cols-2 gap-3'>
			<button
				onClick={onCancel}
				className='rounded-xl border border-border bg-bg-elevated px-6 py-3.5 font-semibold transition-colors hover:bg-bg-hover'
			>
				Keep Session
			</button>
			<button
				onClick={onConfirm}
				className='rounded-xl bg-error px-6 py-3.5 font-semibold text-white transition-colors hover:bg-error/90'
			>
				Abandon
			</button>
		</div>
	</div>
)

// ============================================
// PAUSED SCREEN
// ============================================

interface PausedScreenProps {
	recipe: RecipeSummary
	deadlineTimestamp?: number
	onResume: () => void
	onAbandon: () => void
}

const PausedScreen = ({
	recipe,
	deadlineTimestamp,
	onResume,
	onAbandon,
}: PausedScreenProps) => {
	const [timeRemaining, setTimeRemaining] = useState<number>(0)

	useEffect(() => {
		if (!deadlineTimestamp) return

		const updateTimer = () => {
			const now = Date.now()
			const remaining = Math.max(
				0,
				Math.floor((deadlineTimestamp - now) / 1000),
			)
			setTimeRemaining(remaining)
		}

		updateTimer()
		const interval = setInterval(updateTimer, 1000)
		return () => clearInterval(interval)
	}, [deadlineTimestamp])

	const hours = Math.floor(timeRemaining / 3600)
	const minutes = Math.floor((timeRemaining % 3600) / 60)
	const seconds = timeRemaining % 60

	const progressPercent = (recipe.currentStep / recipe.totalSteps) * 100

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 z-modal flex items-center justify-center bg-panel-bg/98'
		>
			<div className='max-w-lg px-6 py-10 text-center'>
				{/* Floating icon */}
				<motion.div
					animate={{ y: [0, -10, 0] }}
					transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
					className='mb-6 text-7xl'
				>
					⏸️
				</motion.div>

				<h1 className='mb-3 text-4xl font-extrabold'>Session Paused</h1>
				<p className='mb-8 text-lg text-text-muted'>
					Your progress is saved. Resume when you&apos;re ready!
				</p>

				{/* Countdown */}
				<div className='mb-8 rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 p-6'>
					<p className='mb-3 text-sm font-semibold uppercase tracking-wider text-warning'>
						Resume before
					</p>
					<div className='flex items-center justify-center gap-2'>
						{[
							{ value: hours, unit: 'hours' },
							{ value: minutes, unit: 'mins' },
							{ value: seconds, unit: 'secs' },
						].map((item, i) => (
							<div key={item.unit} className='flex items-center'>
								{i > 0 && (
									<span className='mx-1 mb-4 text-3xl text-text-muted'>:</span>
								)}
								<div className='text-center'>
									<div className='font-mono text-4xl font-extrabold'>
										{item.value.toString().padStart(2, '0')}
									</div>
									<div className='mt-1 text-xs uppercase tracking-wide text-text-muted'>
										{item.unit}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Recipe card */}
				<div className='mb-8 flex items-center gap-4 rounded-2xl bg-bg-elevated p-4 text-left'>
					<Image
						src={recipe.imageUrl || '/placeholder-recipe.jpg'}
						alt={recipe.title}
						className='h-20 w-20 rounded-xl object-cover'
					/>
					<div className='flex-1'>
						<h3 className='text-lg font-bold'>{recipe.title}</h3>
						<p className='mb-2 text-sm text-text-muted'>
							Step {recipe.currentStep} of {recipe.totalSteps}
						</p>
						<div className='h-1.5 w-32 overflow-hidden rounded-full bg-border'>
							<div
								className='h-full rounded-full bg-gradient-to-r from-success to-success/80'
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className='space-y-3'>
					<motion.button
						onClick={onResume}
						whileHover={{ y: -2 }}
						whileTap={{ scale: 0.98 }}
						className='flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-success to-success/90 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-success/30'
					>
						<Play className='h-6 w-6' />
						Resume Cooking
					</motion.button>
					<button
						onClick={onAbandon}
						className='w-full py-3 text-text-muted transition-colors hover:text-error'
					>
						Abandon Session
					</button>
				</div>
			</div>
		</motion.div>
	)
}

// ============================================
// EXPIRED SCREEN
// ============================================

interface ExpiredScreenProps {
	recipe: RecipeSummary
	onRestart: () => void
	onGoHome: () => void
}

const ExpiredScreen = ({ recipe, onRestart, onGoHome }: ExpiredScreenProps) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		className='fixed inset-0 z-modal flex items-center justify-center bg-panel-bg'
	>
		<div className='max-w-md px-6 py-10 text-center'>
			<div className='mb-5 text-6xl opacity-60'>⏰</div>
			<h1 className='mb-3 text-3xl font-bold text-text-muted'>
				Session Expired
			</h1>
			<p className='mb-6 text-text-secondary'>
				The {PAUSE_LIMIT_HOURS}-hour pause limit was exceeded. Your session has
				been abandoned.
			</p>

			{/* Recipe card */}
			<div className='mb-8 flex items-center gap-4 rounded-xl bg-bg-elevated p-4 text-left'>
				<Image
					src={recipe.imageUrl || '/placeholder-recipe.jpg'}
					alt={recipe.title}
					className='h-16 w-16 rounded-lg object-cover opacity-70'
				/>
				<div>
					<h3 className='font-semibold'>{recipe.title}</h3>
					<span className='text-sm text-text-muted'>
						Was at Step {recipe.currentStep} of {recipe.totalSteps}
					</span>
				</div>
			</div>

			{/* Actions */}
			<div className='space-y-3'>
				<button
					onClick={onRestart}
					className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90'
				>
					<RefreshCw className='h-5 w-5' />
					Start Fresh
				</button>
				<button
					onClick={onGoHome}
					className='w-full rounded-xl border border-border px-6 py-3.5 font-semibold transition-colors hover:bg-bg-elevated'
				>
					Back to Home
				</button>
			</div>
		</div>
	</motion.div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export const PauseFlow = ({
	state,
	recipe,
	activeTimers,
	pauseDeadlineTimestamp,
	onPause,
	onResume,
	onAbandon,
	onRestart,
	onGoHome,
	onStateChange,
}: PauseFlowProps) => {
	const hasActiveTimers = activeTimers.length > 0

	const handlePauseClick = useCallback(() => {
		if (hasActiveTimers) {
			onStateChange('blocked')
		} else {
			onStateChange('confirming')
		}
	}, [hasActiveTimers, onStateChange])

	const handleConfirmPause = useCallback(() => {
		onPause()
		onStateChange('paused')
	}, [onPause, onStateChange])

	const handleResume = useCallback(() => {
		onResume()
		onStateChange('idle')
	}, [onResume, onStateChange])

	const handleStartAbandon = useCallback(() => {
		onStateChange('abandoning')
	}, [onStateChange])

	const handleConfirmAbandon = useCallback(() => {
		onAbandon()
	}, [onAbandon])

	const handleCancelModal = useCallback(() => {
		onStateChange(state === 'paused' ? 'paused' : 'idle')
	}, [onStateChange, state])

	return (
		<>
			{/* Pause Button - always visible when in idle/blocked state */}
			{(state === 'idle' || state === 'blocked') && (
				<PauseButton disabled={hasActiveTimers} onClick={handlePauseClick} />
			)}

			<AnimatePresence>
				{/* Pause Confirmation Modal */}
				{state === 'confirming' && (
					<ModalOverlay onClose={handleCancelModal}>
						<PauseConfirmModal
							recipe={recipe}
							onCancel={handleCancelModal}
							onConfirm={handleConfirmPause}
						/>
					</ModalOverlay>
				)}

				{/* Blocked Modal (timers active) */}
				{state === 'blocked' && (
					<ModalOverlay onClose={handleCancelModal}>
						<BlockedModal
							activeTimers={activeTimers}
							onClose={() => onStateChange('idle')}
						/>
					</ModalOverlay>
				)}

				{/* Abandon Confirmation Modal */}
				{state === 'abandoning' && (
					<ModalOverlay>
						<AbandonModal
							onCancel={handleCancelModal}
							onConfirm={handleConfirmAbandon}
						/>
					</ModalOverlay>
				)}

				{/* Paused Full Screen */}
				{state === 'paused' && (
					<PausedScreen
						recipe={recipe}
						deadlineTimestamp={pauseDeadlineTimestamp}
						onResume={handleResume}
						onAbandon={handleStartAbandon}
					/>
				)}

				{/* Expired Screen */}
				{state === 'expired' && (
					<ExpiredScreen
						recipe={recipe}
						onRestart={onRestart}
						onGoHome={onGoHome}
					/>
				)}
			</AnimatePresence>
		</>
	)
}

export type { PauseFlowState, ActiveTimer, RecipeSummary }
