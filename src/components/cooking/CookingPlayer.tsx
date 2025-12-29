'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Portal } from '@/components/ui/portal'
import { useUiStore } from '@/store/uiStore'
import { useCookingStore } from '@/store/cookingStore'
import { useCelebration } from '@/components/providers/CelebrationProvider'
import { notifyTimerUrgent, isAudioEnabled, setAudioEnabled } from '@/lib/audio'
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning'
import { toast } from 'sonner'
import {
	Sparkles,
	User,
	Clock,
	BarChart2,
	X,
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	Check,
	Zap,
	Trophy,
	Volume2,
	VolumeX,
	Loader2,
	AlertCircle,
	LogOut,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { SessionRatingForm } from './SessionRatingForm'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	BUTTON_HOVER,
	BUTTON_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	TIMER_URGENT,
	GLOW_PULSE,
	OVERLAY_BACKDROP,
	CELEBRATION_MODAL,
} from '@/lib/motion'
import type { Step, Ingredient } from '@/lib/types/recipe'

// ============================================
// ANIMATION VARIANTS
// ============================================

const modalVariants = {
	hidden: { opacity: 0, scale: 0.9, y: 50 },
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		y: 20,
		transition: { duration: 0.2 },
	},
}

const stepVariants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 300 : -300,
		opacity: 0,
		scale: 0.9,
	}),
	center: {
		x: 0,
		opacity: 1,
		scale: 1,
		transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
	},
	exit: (direction: number) => ({
		x: direction < 0 ? 300 : -300,
		opacity: 0,
		scale: 0.9,
		transition: { duration: 0.2 },
	}),
}

const checkmarkVariants = {
	unchecked: { scale: 1, pathLength: 0 },
	checked: {
		scale: [1, 1.2, 1],
		pathLength: 1,
		transition: { duration: 0.3, ease: 'easeOut' },
	},
}

const progressVariants = {
	initial: { scaleX: 0, originX: 0 },
	animate: (progress: number) => ({
		scaleX: progress / 100,
		transition: { type: 'spring', stiffness: 100, damping: 20 },
	}),
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Step Progress Dots (Interactive)
const StepDots = ({
	totalSteps,
	currentStep,
	completedSteps,
	onStepClick,
}: {
	totalSteps: number
	currentStep: number
	completedSteps: Set<number>
	onStepClick?: (stepNumber: number) => void
}) => (
	<div
		className='flex items-center gap-1.5 overflow-x-auto scrollbar-hide max-w-step-dots md:max-w-step-dots-lg px-1'
		role='tablist'
		aria-label='Recipe steps'
	>
		{Array.from({ length: totalSteps }, (_, i) => {
			const stepNum = i + 1
			const isCompleted = completedSteps.has(stepNum)
			const isCurrent = stepNum === currentStep

			return (
				<motion.button
					key={stepNum}
					role='tab'
					aria-selected={isCurrent}
					aria-label={`Step ${stepNum}${isCompleted ? ', completed' : ''}`}
					onClick={() => onStepClick?.(stepNum)}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					initial={false}
					animate={{
						scale: isCurrent ? 1.05 : 1,
					}}
					transition={TRANSITION_SPRING}
					className={cn(
						'relative grid flex-shrink-0 place-items-center rounded-lg text-xs font-bold transition-colors',
						// Larger touch targets (44px minimum for accessibility)
						isCurrent
							? 'h-9 w-12 bg-white text-brand shadow-md'
							: isCompleted
								? 'size-9 bg-success text-white'
								: 'size-9 bg-white/20 text-white/70 hover:bg-white/30 hover:text-white',
					)}
					title={`Step ${stepNum}${isCompleted ? ' ✓' : ''}`}
				>
					{isCompleted && !isCurrent ? <Check className='size-4' /> : stepNum}
				</motion.button>
			)
		})}
	</div>
)

// Animated Timer with Audio Notifications
const StepTimer = ({
	seconds,
	isRunning,
	onToggle,
	onComplete,
}: {
	seconds: number
	isRunning: boolean
	onToggle: () => void
	onComplete: () => void
}) => {
	// StepTimer is now a DISPLAY component
	// Timer ticking is handled by CookingTimerProvider (centralized)
	// Completion sounds are handled by useTimerNotifications
	// We only handle the 30-second URGENT warning sound here

	const [audioEnabled, setAudioEnabledState] = useState(true)
	const hasPlayedUrgentRef = useRef(false)
	const previousSecondsRef = useRef(seconds)

	const isUrgent = seconds <= 30 && seconds > 0
	const isComplete = seconds === 0

	// Initialize audio preference from localStorage
	useEffect(() => {
		setAudioEnabledState(isAudioEnabled())
	}, [])

	// Reset urgent flag when timer restarts
	useEffect(() => {
		if (seconds > previousSecondsRef.current) {
			// Timer was reset/restarted
			hasPlayedUrgentRef.current = false
		}
		previousSecondsRef.current = seconds
	}, [seconds])

	// Play urgent sound exactly when crossing the 30-second threshold
	useEffect(() => {
		if (
			isRunning &&
			seconds === 30 &&
			audioEnabled &&
			!hasPlayedUrgentRef.current
		) {
			hasPlayedUrgentRef.current = true
			notifyTimerUrgent()
		}
	}, [seconds, isRunning, audioEnabled])

	// Call onComplete when timer hits 0
	useEffect(() => {
		if (seconds === 0 && isRunning) {
			onComplete()
		}
	}, [seconds, isRunning, onComplete])

	const toggleAudio = useCallback(() => {
		const newState = !audioEnabled
		setAudioEnabledState(newState)
		setAudioEnabled(newState)
	}, [audioEnabled])

	const minutes = Math.floor(seconds / 60)
	const secs = seconds % 60
	const display = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

	return (
		<motion.div
			animate={isUrgent && isRunning ? TIMER_URGENT.animate : undefined}
			className={cn(
				'relative mx-auto flex flex-col items-center gap-2 rounded-2xl px-8 py-4',
				isComplete
					? 'bg-success/15 text-success'
					: isUrgent
						? 'bg-error/15 text-error'
						: 'bg-streak/10 text-streak',
			)}
		>
			{/* Glow effect when urgent */}
			{isUrgent && isRunning && (
				<motion.div
					className='absolute inset-0 rounded-2xl bg-error/20'
					animate={{ opacity: [0.3, 0.6, 0.3] }}
					transition={{ duration: 0.8, repeat: Infinity }}
				/>
			)}

			<span className='relative z-10 text-xs font-semibold uppercase tracking-wider opacity-70'>
				{isComplete
					? '✓ Timer Complete!'
					: isRunning
						? 'Timer Running'
						: 'Timer Paused'}
			</span>

			<div className='relative z-10 flex items-center gap-4'>
				<motion.button
					onClick={onToggle}
					whileHover={ICON_BUTTON_HOVER}
					whileTap={ICON_BUTTON_TAP}
					className={cn(
						'grid size-12 place-items-center rounded-full transition-colors',
						isComplete
							? 'bg-success text-white'
							: isRunning
								? 'bg-streak text-white'
								: 'bg-border text-text-secondary hover:bg-border-medium',
					)}
				>
					{isComplete ? (
						<Check className='size-6' />
					) : isRunning ? (
						<Pause className='size-5' />
					) : (
						<Play className='ml-0.5 size-5' />
					)}
				</motion.button>

				<motion.span
					key={seconds}
					initial={{ scale: 1.1, opacity: 0.5 }}
					animate={{ scale: 1, opacity: 1 }}
					className='relative z-10 font-mono text-4xl font-bold tabular-nums'
				>
					{display}
				</motion.span>

				{/* Audio toggle button */}
				<motion.button
					onClick={toggleAudio}
					whileHover={ICON_BUTTON_HOVER}
					whileTap={ICON_BUTTON_TAP}
					title={audioEnabled ? 'Mute timer sounds' : 'Unmute timer sounds'}
					className='grid size-10 place-items-center rounded-full bg-bg-elevated text-text-secondary transition-colors hover:bg-bg-hover'
				>
					{audioEnabled ? (
						<Volume2 className='size-5' />
					) : (
						<VolumeX className='size-5' />
					)}
				</motion.button>
			</div>
		</motion.div>
	)
}

// Animated Ingredient Checkbox
const IngredientCheck = ({
	ingredient,
	isChecked,
	onToggle,
	index,
}: {
	ingredient: { name: string; quantity: string; unit: string }
	isChecked: boolean
	onToggle: () => void
	index: number
}) => (
	<motion.label
		initial={{ opacity: 0, x: -20 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ delay: index * 0.05, ...TRANSITION_SPRING }}
		onClick={onToggle}
		className={cn(
			'flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all',
			isChecked
				? 'bg-success/10 text-success line-through opacity-60'
				: 'bg-bg-elevated hover:bg-bg-hover',
		)}
	>
		{/* Custom checkbox */}
		<motion.div
			animate={{
				backgroundColor: isChecked ? 'var(--color-success)' : 'transparent',
				borderColor: isChecked
					? 'var(--color-success)'
					: 'var(--border-medium)',
			}}
			className='grid size-6 flex-shrink-0 place-items-center rounded-lg border-2'
		>
			<AnimatePresence>
				{isChecked && (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={TRANSITION_BOUNCY}
					>
						<Check className='size-4 text-white' />
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>

		<span className='flex-1 text-sm font-medium'>
			{ingredient.quantity} {ingredient.unit} {ingredient.name}
		</span>
	</motion.label>
)

// XP Preview Badge
const XpPreview = ({ xp, className }: { xp: number; className?: string }) => (
	<motion.div
		initial={{ scale: 0.8, opacity: 0 }}
		animate={{ scale: 1, opacity: 1 }}
		className={cn(
			'flex items-center gap-1.5 rounded-full bg-gradient-xp px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-xp/30',
			className,
		)}
	>
		<Zap className='size-4' />
		<span>+{xp} XP</span>
	</motion.div>
)

// Active Timers Badge - Shows all running timers from all steps
const ActiveTimersBadge = ({
	localTimers,
	currentStepNumber,
	onJumpToStep,
}: {
	localTimers: Map<number, { remaining: number; startedAt: number }>
	currentStepNumber: number
	onJumpToStep: (stepNumber: number) => void
}) => {
	// Filter out the current step's timer (already shown in main UI)
	const otherTimers = Array.from(localTimers.entries()).filter(
		([stepNum]) => stepNum !== currentStepNumber,
	)

	if (otherTimers.length === 0) return null

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className='absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2'
		>
			{otherTimers.map(([stepNum, timer]) => {
				const isUrgent = timer.remaining <= 30
				return (
					<motion.button
						key={stepNum}
						onClick={() => onJumpToStep(stepNum)}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						animate={
							isUrgent
								? {
										backgroundColor: [
											'rgba(239,68,68,0.2)',
											'rgba(239,68,68,0.4)',
											'rgba(239,68,68,0.2)',
										],
									}
								: undefined
						}
						transition={
							isUrgent ? { duration: 0.8, repeat: Infinity } : undefined
						}
						className={cn(
							'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors',
							isUrgent
								? 'bg-error/20 text-error hover:bg-error/30'
								: 'bg-white/20 text-white hover:bg-white/30',
						)}
						title={`Jump to Step ${stepNum}`}
					>
						<Clock className='size-3' />
						<span>Step {stepNum}</span>
						<span className='font-mono'>{formatTime(timer.remaining)}</span>
					</motion.button>
				)
			})}
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export const CookingPlayer = () => {
	const { cookingMode, closeCookingPanel } = useUiStore()
	const prefersReducedMotion = useReducedMotion()
	const isOpen = cookingMode === 'expanded'
	const { showImmediateRewards, showLevelUp } = useCelebration()

	// Cooking store state
	const {
		session,
		recipe,
		isLoading,
		error,
		navigateToStep,
		completeStep,
		startTimer,
		skipTimer,
		completeCooking,
		abandonCooking,
		localTimers,
		getTimerRemaining,
	} = useCookingStore()

	// Warn users before leaving page during active cooking session
	const hasActiveSession = session?.status === 'in_progress' && isOpen
	useBeforeUnloadWarning(
		hasActiveSession,
		'You have an active cooking session. Progress will be saved but timers will reset.',
	)

	// Local UI state
	const [direction, setDirection] = useState(0) // -1 = back, 1 = forward
	const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
		new Set(),
	)
	const [showCompletion, setShowCompletion] = useState(false)
	const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)

	// Derive current step data from session and recipe
	const currentStepNumber = session?.currentStep ?? 1
	const step = recipe?.steps?.[currentStepNumber - 1]
	const totalSteps = recipe?.steps?.length ?? 0
	const completedSteps = new Set(session?.completedSteps ?? [])
	const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0

	// Handlers - defined before useEffects that reference them
	const handleNextStep = useCallback(async () => {
		if (!recipe) return

		// Complete current step first
		await completeStep(currentStepNumber)

		if (currentStepNumber < totalSteps) {
			setDirection(1)
			await navigateToStep('next')

			// Auto-start timer for the NEXT step if it has one
			const nextStepNumber = currentStepNumber + 1
			const nextStep = recipe.steps?.[nextStepNumber - 1]
			if (nextStep?.timerSeconds && nextStep.timerSeconds > 0) {
				// Small delay to ensure state is updated before starting timer
				setTimeout(() => {
					startTimer(nextStepNumber)
				}, 100)
			}
		} else {
			// Session complete!
			setShowCompletion(true)
		}
	}, [
		currentStepNumber,
		totalSteps,
		completeStep,
		navigateToStep,
		recipe,
		startTimer,
	])

	const handlePrevStep = useCallback(async () => {
		if (currentStepNumber > 1) {
			setDirection(-1)
			await navigateToStep('previous')
		}
	}, [currentStepNumber, navigateToStep])

	const handleStepClick = useCallback(
		async (stepNumber: number) => {
			if (stepNumber === currentStepNumber) return
			setDirection(stepNumber > currentStepNumber ? 1 : -1)
			await navigateToStep('goto', stepNumber)
		},
		[currentStepNumber, navigateToStep],
	)

	// Timer ticking is handled by CookingTimerProvider (centralized)
	// NO setInterval here — we removed the duplicate to prevent 2x speed ticking

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen || !recipe) return

			if (e.key === 'ArrowRight' || e.key === ' ') {
				e.preventDefault()
				handleNextStep()
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault()
				handlePrevStep()
			} else if (e.key === 'Escape') {
				closeCookingPanel()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, recipe, closeCookingPanel, handleNextStep, handlePrevStep])

	// Reset checked ingredients when step changes
	useEffect(() => {
		setCheckedIngredients(new Set())
	}, [currentStepNumber])

	const toggleIngredient = useCallback((id: string) => {
		setCheckedIngredients(prev => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}, [])

	const handleTimerToggle = useCallback(() => {
		if (!step?.timerSeconds) return

		const activeTimer = localTimers.get(currentStepNumber)
		if (activeTimer) {
			// Timer is running, skip it
			skipTimer(currentStepNumber)
		} else {
			// Start timer
			startTimer(currentStepNumber)
		}
	}, [step, currentStepNumber, localTimers, startTimer, skipTimer])

	const handleTimerComplete = useCallback(() => {
		// Timer completed naturally - handled by tickTimers
	}, [])

	const [isCompletingSession, setIsCompletingSession] = useState(false)

	const handleComplete = useCallback(
		async (rating: number, notes?: string) => {
			// Guard against double-completion
			if (isCompletingSession || session?.status === 'completed') {
				console.warn(
					'[handleComplete] Already completing or completed, ignoring',
				)
				return
			}
			setIsCompletingSession(true)
			try {
				const completionResult = await completeCooking(rating, notes)

				if (!completionResult) {
					// Get error from store and show toast
					const errorMsg = useCookingStore.getState().error
					toast.error(
						errorMsg || 'Failed to complete cooking session. Please try again.',
					)
					return
				}

				// Check for level-up and celebrate FIRST (before rewards modal)
				if (
					completionResult.leveledUp &&
					completionResult.oldLevel &&
					completionResult.newLevel
				) {
					showLevelUp({
						oldLevel: completionResult.oldLevel,
						newLevel: completionResult.newLevel,
					})
					// Small delay so level-up celebration shows first
					await new Promise(resolve => setTimeout(resolve, 2500))
				}

				// Trigger celebration with immediate rewards data
				showImmediateRewards({
					sessionId: session?.sessionId ?? '',
					recipeName: recipe?.title ?? 'Recipe',
					recipeImageUrl: recipe?.coverImageUrl?.[0],
					immediateXp: completionResult.baseXpAwarded,
					pendingXp: completionResult.pendingXp,
					postDeadlineHours: 336, // 14 days in hours
				})

				setShowCompletion(false)
				closeCookingPanel()
			} finally {
				setIsCompletingSession(false)
			}
		},
		[
			completeCooking,
			closeCookingPanel,
			showImmediateRewards,
			showLevelUp,
			recipe,
			session,
		],
	)

	const handleAbandon = useCallback(async () => {
		setShowAbandonConfirm(false)
		await abandonCooking()
		closeCookingPanel()
	}, [abandonCooking, closeCookingPanel])

	if (!isOpen) return null

	// Loading state - no session yet
	if (isLoading) {
		return (
			<Portal>
				<AnimatePresence mode='wait'>
					<motion.div
						key='cooking-player-loading'
						variants={OVERLAY_BACKDROP}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/70 p-4 backdrop-blur-md'
					>
						<div className='flex flex-col items-center gap-4 text-white'>
							<Loader2 className='size-12 animate-spin' />
							<p className='text-lg font-medium'>Starting cooking session...</p>
						</div>
					</motion.div>
				</AnimatePresence>
			</Portal>
		)
	}

	// Error state or no session
	if (error || !session || !recipe) {
		return (
			<Portal>
				<AnimatePresence mode='wait'>
					<motion.div
						key='cooking-player-error'
						variants={OVERLAY_BACKDROP}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/70 p-4 backdrop-blur-md'
					>
						<motion.div
							variants={prefersReducedMotion ? undefined : modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='max-w-md rounded-3xl bg-bg-card p-8 text-center shadow-2xl'
						>
							<AlertCircle className='mx-auto mb-4 size-12 text-error' />
							<h2 className='mb-2 text-xl font-bold text-text'>
								{error || 'No active cooking session'}
							</h2>
							<p className='mb-6 text-text-secondary'>
								Please start cooking from a recipe page.
							</p>
							<motion.button
								onClick={closeCookingPanel}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='rounded-full bg-gradient-hero px-8 py-3 font-bold text-white'
							>
								Close
							</motion.button>
						</motion.div>
					</motion.div>
				</AnimatePresence>
			</Portal>
		)
	}

	// Get timer state for current step
	const activeTimer = localTimers.get(currentStepNumber)
	const timerRunning = !!activeTimer
	const timerRemaining = activeTimer?.remaining ?? step?.timerSeconds ?? 0

	return (
		<Portal>
			<AnimatePresence mode='wait'>
				{isOpen && (
					<motion.div
						key='cooking-player-overlay'
						variants={OVERLAY_BACKDROP}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/70 p-4 backdrop-blur-md md:p-6'
					>
						<motion.div
							variants={prefersReducedMotion ? undefined : modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='flex h-full max-h-modal w-full max-w-modal-2xl flex-col overflow-hidden rounded-3xl bg-bg-card shadow-2xl'
						>
							{/* Header */}
							<div className='relative overflow-hidden bg-gradient-hero p-6 text-white'>
								{/* Animated background shimmer - pointer-events-none to not block buttons */}
								<motion.div
									className='pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent'
									animate={{ x: ['-100%', '100%'] }}
									transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
								/>

								{/* Active Timers from other steps */}
								<ActiveTimersBadge
									localTimers={localTimers}
									currentStepNumber={currentStepNumber}
									onJumpToStep={handleStepClick}
								/>

								{/* AI Assist Button - Prominent with pulsing glow */}
								<motion.button
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									animate={{
										boxShadow: [
											'0 0 0 0 rgba(255, 90, 54, 0)',
											'0 0 20px 4px rgba(255, 90, 54, 0.4)',
											'0 0 0 0 rgba(255, 90, 54, 0)',
										],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: 'easeInOut',
									}}
									className='absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/40'
								>
									<Sparkles className='size-4' /> AI Assist
								</motion.button>

								{/* Header buttons group */}
								<div className='absolute right-4 top-4 flex items-center gap-2'>
									{/* Exit Session Button */}
									<motion.button
										onClick={() => setShowAbandonConfirm(true)}
										whileHover={ICON_BUTTON_HOVER}
										whileTap={ICON_BUTTON_TAP}
										className='grid size-10 place-items-center rounded-full bg-red-500/20 backdrop-blur-sm transition-colors hover:bg-red-500/40'
										title='Exit and abandon session'
									>
										<LogOut className='size-5' />
									</motion.button>

									{/* Minimize Button */}
									<motion.button
										onClick={closeCookingPanel}
										whileHover={ICON_BUTTON_HOVER}
										whileTap={ICON_BUTTON_TAP}
										className='grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30'
										title='Minimize to mini-bar (Esc)'
									>
										<X className='size-5' />
									</motion.button>
								</div>

								{/* XP Badge */}
								<XpPreview
									xp={recipe.xpReward ?? 0}
									className='absolute right-4 bottom-4'
								/>

								{/* Recipe Info */}
								<div className='relative z-10 pt-8 text-center'>
									<motion.h2
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className='text-2xl font-bold md:text-3xl'
									>
										{recipe.title}
									</motion.h2>
									<div className='mt-3 flex flex-wrap items-center justify-center gap-4 text-sm opacity-90 md:gap-6'>
										<span className='flex items-center gap-1.5'>
											<User className='size-4' />{' '}
											{recipe.author?.displayName ?? 'Chef'}
										</span>
										<span className='flex items-center gap-1.5'>
											<Clock className='size-4' />{' '}
											{recipe.totalTimeMinutes ?? 0} min
										</span>
										<span className='flex items-center gap-1.5'>
											<BarChart2 className='size-4' /> {recipe.difficulty}
										</span>
									</div>
								</div>
							</div>

							{/* Progress Section */}
							<div className='border-b border-border-subtle bg-bg-elevated px-6 py-4'>
								<div className='mb-3 flex items-center justify-between'>
									<span className='text-sm font-medium text-text-secondary'>
										Step {currentStepNumber} of {totalSteps}
									</span>
									<StepDots
										totalSteps={totalSteps}
										currentStep={currentStepNumber}
										completedSteps={completedSteps}
										onStepClick={handleStepClick}
									/>
								</div>

								{/* Animated Progress Bar */}
								<div className='h-2 w-full overflow-hidden rounded-full bg-border'>
									<motion.div
										className='h-full rounded-full bg-gradient-hero'
										initial={{ scaleX: 0, originX: 0 }}
										animate={{ scaleX: progress / 100 }}
										transition={{ type: 'spring', stiffness: 100, damping: 20 }}
										style={{ transformOrigin: 'left' }}
									/>
								</div>
							</div>

							{/* Step Content - Animated */}
							<div className='relative flex-1 overflow-hidden'>
								<AnimatePresence initial={false} custom={direction} mode='wait'>
									{step && (
										<motion.div
											key={currentStepNumber}
											custom={direction}
											variants={prefersReducedMotion ? undefined : stepVariants}
											initial='enter'
											animate='center'
											exit='exit'
											className='absolute inset-0 flex flex-col overflow-y-auto p-6'
										>
											{/* Step Image */}
											{step.imageUrl && (
												<motion.div
													initial={{ opacity: 0, scale: 0.95 }}
													animate={{ opacity: 1, scale: 1 }}
													transition={{ delay: 0.1 }}
													className='relative mx-auto mb-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl shadow-lg'
												>
													<Image
														src={step.imageUrl}
														alt={step.title ?? `Step ${step.stepNumber}`}
														fill
														className='object-cover'
													/>
												</motion.div>
											)}

											{/* Step Title */}
											<motion.h3
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.15 }}
												className='mb-3 text-center text-xl font-bold text-text md:text-2xl'
											>
												Step {step.stepNumber}: {step.title ?? 'Cook'}
											</motion.h3>

											{/* Step Description - Large for kitchen readability */}
											<motion.p
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 0.2 }}
												className='mx-auto mb-6 max-w-lg text-center text-lg leading-relaxed text-text-secondary md:text-xl'
											>
												{step.description}
											</motion.p>

											{/* Tips */}
											{step.tips && (
												<motion.div
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.25 }}
													className='mx-auto mb-6 flex max-w-md items-start gap-3 rounded-xl bg-bonus/10 p-4 text-sm'
												>
													<span className='text-lg'>💡</span>
													<p className='text-bonus'>{step.tips}</p>
												</motion.div>
											)}

											{/* Timer */}
											{step.timerSeconds && step.timerSeconds > 0 && (
												<motion.div
													initial={{ opacity: 0, scale: 0.9 }}
													animate={{ opacity: 1, scale: 1 }}
													transition={{ delay: 0.3 }}
													className='mb-6'
												>
													<StepTimer
														seconds={timerRemaining}
														isRunning={timerRunning}
														onToggle={handleTimerToggle}
														onComplete={handleTimerComplete}
													/>
												</motion.div>
											)}

											{/* Ingredients Checklist */}
											{step.ingredients && step.ingredients.length > 0 && (
												<motion.div
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.35 }}
													className='mx-auto w-full max-w-md rounded-2xl border border-border-subtle bg-bg-card p-4'
												>
													<h4 className='mb-3 flex items-center gap-2 font-semibold text-text'>
														<span className='text-lg'>🧾</span> Ingredients for
														this step
													</h4>
													<div className='flex flex-col gap-2'>
														{step.ingredients.map((ing, idx) => {
															const id = `${currentStepNumber}-${ing.name}`
															return (
																<IngredientCheck
																	key={id}
																	ingredient={{
																		name: ing.name,
																		quantity: ing.quantity ?? '',
																		unit: ing.unit ?? '',
																	}}
																	isChecked={checkedIngredients.has(id)}
																	onToggle={() => toggleIngredient(id)}
																	index={idx}
																/>
															)
														})}
													</div>
												</motion.div>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							{/* Navigation */}
							<div className='flex items-center justify-between border-t border-border-subtle bg-bg-elevated p-4'>
								<motion.button
									onClick={handlePrevStep}
									disabled={currentStepNumber === 1}
									whileHover={currentStepNumber > 1 ? BUTTON_HOVER : undefined}
									whileTap={currentStepNumber > 1 ? BUTTON_TAP : undefined}
									className={cn(
										'flex items-center gap-2 rounded-full px-6 py-3 font-bold transition-all',
										currentStepNumber === 1
											? 'cursor-not-allowed bg-border/50 text-text-muted'
											: 'bg-border text-text hover:bg-border-medium',
									)}
									title='Previous step (←)'
								>
									<ChevronLeft className='size-5' /> Back
									<kbd className='ml-1 hidden rounded bg-black/10 px-1.5 py-0.5 text-xs font-normal md:inline'>
										←
									</kbd>
								</motion.button>

								<motion.button
									onClick={handleNextStep}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-2 rounded-full bg-gradient-hero px-8 py-3 font-bold text-white shadow-lg shadow-brand/30'
									title={
										currentStepNumber === totalSteps
											? 'Complete recipe'
											: 'Next step (→ or Space)'
									}
								>
									{currentStepNumber === totalSteps ? (
										<>
											<Trophy className='size-5' /> Complete!
										</>
									) : (
										<>
											Next Step
											<kbd className='ml-1 hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal md:inline'>
												→
											</kbd>
											<ChevronRight className='size-5' />
										</>
									)}
								</motion.button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Completion Modal - Separate Portal (outside main modal container to be truly full-screen) */}
			<AnimatePresence>
				{showCompletion && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-md'
						>
							<motion.div
								variants={CELEBRATION_MODAL}
								initial='hidden'
								animate='visible'
								exit='exit'
								className='mx-4 max-w-sm rounded-3xl bg-bg-card p-8 shadow-2xl'
							>
								<SessionRatingForm
									xpEarned={session?.baseXpAwarded ?? recipe.xpReward ?? 0}
									recipeTitle={recipe.title}
									onSubmit={handleComplete}
									isSubmitting={isCompletingSession}
								/>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			{/* Abandon Confirmation Modal - Separate Portal (outside main modal container) */}
			<AnimatePresence>
				{showAbandonConfirm && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-md'
						>
							<motion.div
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								className='mx-4 max-w-sm rounded-3xl bg-bg-card p-8 text-center shadow-2xl'
							>
								<div className='mx-auto mb-4 grid size-16 place-items-center rounded-full bg-red-100 dark:bg-red-900/30'>
									<LogOut className='size-8 text-red-500' />
								</div>
								<h3 className='mb-2 text-xl font-bold text-text'>
									Abandon Session?
								</h3>
								<p className='mb-6 text-text-secondary'>
									You&apos;ll lose all progress on this cooking session. This
									action cannot be undone.
								</p>
								<div className='flex gap-3'>
									<motion.button
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										onClick={() => setShowAbandonConfirm(false)}
										className='flex-1 rounded-full border border-border bg-bg-card px-6 py-3 font-semibold text-text transition-colors hover:bg-bg-elevated'
									>
										Keep Cooking
									</motion.button>
									<motion.button
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										onClick={handleAbandon}
										className='flex-1 rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-600'
									>
										Abandon
									</motion.button>
								</div>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>
		</Portal>
	)
}
