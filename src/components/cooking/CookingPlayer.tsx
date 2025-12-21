'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useUiStore } from '@/store/uiStore'
import { useCookingStore } from '@/store/cookingStore'
import { useCelebration } from '@/components/providers/CelebrationProvider'
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

// Animated Timer
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
	const [remaining, setRemaining] = useState(seconds)
	const isUrgent = remaining <= 30 && remaining > 0
	const isComplete = remaining === 0

	useEffect(() => {
		setRemaining(seconds)
	}, [seconds])

	useEffect(() => {
		if (!isRunning || remaining <= 0) return

		const interval = setInterval(() => {
			setRemaining(prev => {
				if (prev <= 1) {
					onComplete()
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => clearInterval(interval)
	}, [isRunning, remaining, onComplete])

	const minutes = Math.floor(remaining / 60)
	const secs = remaining % 60
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
					key={remaining}
					initial={{ scale: 1.1, opacity: 0.5 }}
					animate={{ scale: 1, opacity: 1 }}
					className='relative z-10 font-mono text-4xl font-bold tabular-nums'
				>
					{display}
				</motion.span>
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

// ============================================
// MAIN COMPONENT
// ============================================

export const CookingPlayer = () => {
	const { cookingMode, closeCookingPanel } = useUiStore()
	const prefersReducedMotion = useReducedMotion()
	const isOpen = cookingMode === 'expanded'
	const { showImmediateRewards } = useCelebration()

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
		tickTimers,
		getTimerRemaining,
	} = useCookingStore()

	// Local UI state
	const [direction, setDirection] = useState(0) // -1 = back, 1 = forward
	const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
		new Set(),
	)
	const [showCompletion, setShowCompletion] = useState(false)

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
		} else {
			// Session complete!
			setShowCompletion(true)
		}
	}, [currentStepNumber, totalSteps, completeStep, navigateToStep, recipe])

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

	// Timer ticking
	useEffect(() => {
		if (!isOpen || localTimers.size === 0) return

		const interval = setInterval(() => {
			tickTimers()
		}, 1000)

		return () => clearInterval(interval)
	}, [isOpen, localTimers.size, tickTimers])

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
			setIsCompletingSession(true)
			try {
				await completeCooking(rating, notes)

				// Trigger celebration with immediate rewards data
				// Session state is updated by completeCooking, use current values
				const baseXp = session?.baseXpAwarded ?? recipe?.xpReward ?? 0
				const pendingXp = session?.pendingXp ?? Math.floor((baseXp * 0.7) / 0.3)

				showImmediateRewards({
					recipeName: recipe?.title ?? 'Recipe',
					recipeImageUrl: recipe?.coverImageUrl?.[0],
					immediateXp: baseXp,
					pendingXp: pendingXp,
					postDeadlineHours: 336, // 14 days in hours
				})

				setShowCompletion(false)
				closeCookingPanel()
			} finally {
				setIsCompletingSession(false)
			}
		},
		[completeCooking, closeCookingPanel, showImmediateRewards, session, recipe],
	)

	const handleAbandon = useCallback(async () => {
		await abandonCooking()
		closeCookingPanel()
	}, [abandonCooking, closeCookingPanel])

	if (!isOpen) return null

	// Loading state - no session yet
	if (isLoading) {
		return (
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
		)
	}

	// Error state or no session
	if (error || !session || !recipe) {
		return (
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
		)
	}

	// Get timer state for current step
	const activeTimer = localTimers.get(currentStepNumber)
	const timerRunning = !!activeTimer
	const timerRemaining = activeTimer?.remaining ?? step?.timerSeconds ?? 0

	return (
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
							{/* Animated background shimmer */}
							<motion.div
								className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent'
								animate={{ x: ['-100%', '100%'] }}
								transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
							/>

							{/* AI Remix Button */}
							<motion.button
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/30'
							>
								<Sparkles className='size-4' /> AI Assist
							</motion.button>

							{/* Close Button */}
							<motion.button
								onClick={closeCookingPanel}
								className='absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30'
							>
								<X className='size-5' />
							</motion.button>

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
										<Clock className='size-4' /> {recipe.totalTimeMinutes ?? 0}{' '}
										min
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

										{/* Step Description */}
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 0.2 }}
											className='mx-auto mb-6 max-w-lg text-center leading-relaxed text-text-secondary'
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
							>
								<ChevronLeft className='size-5' /> Back
							</motion.button>

							<motion.button
								onClick={handleNextStep}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='flex items-center gap-2 rounded-full bg-gradient-hero px-8 py-3 font-bold text-white shadow-lg shadow-brand/30'
							>
								{currentStepNumber === totalSteps ? (
									<>
										<Trophy className='size-5' /> Complete!
									</>
								) : (
									<>
										Next Step <ChevronRight className='size-5' />
									</>
								)}
							</motion.button>
						</div>
					</motion.div>

					{/* Completion Modal with Rating Form */}
					<AnimatePresence>
						{showCompletion && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className='absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md'
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
						)}
					</AnimatePresence>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
