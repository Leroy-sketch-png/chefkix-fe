'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import {
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	Check,
	Zap,
	X,
	Maximize2,
	Clock,
	ChefHat,
	Timer,
	AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_TAP } from '@/lib/motion'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

// ============================================
// MINI TIMER DISPLAY
// ============================================

const MiniTimer = ({
	seconds,
	isRunning,
	onToggle,
}: {
	seconds: number
	isRunning: boolean
	onToggle: () => void
}) => {
	const minutes = Math.floor(seconds / 60)
	const secs = seconds % 60
	const isUrgent = seconds <= 30 && seconds > 0

	return (
		<button
			onClick={onToggle}
			className={cn(
				'flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-bold transition-all',
				isRunning
					? isUrgent
						? 'animate-pulse bg-error/20 text-error'
						: 'bg-brand/20 text-brand'
					: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover',
			)}
		>
			<Timer className='size-4' />
			{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
			{isRunning ? <Pause className='size-4' /> : <Play className='size-4' />}
		</button>
	)
}

// ============================================
// STEP PROGRESS DOTS (COMPACT)
// ============================================

const CompactStepDots = ({
	totalSteps,
	currentStep,
	completedSteps,
	onStepClick,
}: {
	totalSteps: number
	currentStep: number
	completedSteps: Set<number>
	onStepClick: (step: number) => void
}) => (
	<div className='flex flex-wrap items-center justify-center gap-1.5'>
		{Array.from({ length: totalSteps }, (_, i) => {
			const stepNum = i + 1
			const isCompleted = completedSteps.has(stepNum)
			const isCurrent = stepNum === currentStep

			return (
				<button
					key={stepNum}
					onClick={() => onStepClick(stepNum)}
					className={cn(
						'grid size-7 place-items-center rounded-lg text-xs font-bold transition-all hover:scale-110',
						isCompleted
							? 'bg-success text-white'
							: isCurrent
								? 'bg-brand text-white shadow-md shadow-brand/30'
								: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover',
					)}
				>
					{isCompleted ? <Check className='size-3.5' /> : stepNum}
				</button>
			)
		})}
	</div>
)

// ============================================
// MAIN DOCKED PANEL COMPONENT
// ============================================

export const CookingPanel = () => {
	const { cookingMode, closeCookingPanel, expandCookingPanel } = useUiStore()
	const {
		session,
		recipe,
		navigateToStep,
		completeStep,
		startTimer,
		skipTimer,
		abandonCooking,
		localTimers,
	} = useCookingStore()

	// Exit confirmation dialog state
	const [showExitConfirm, setShowExitConfirm] = useState(false)

	// Derive state (always compute, even if we won't render)
	const currentStepNumber = session?.currentStep ?? 1
	const step = recipe?.steps?.[currentStepNumber - 1]
	const totalSteps = recipe?.steps?.length ?? 0
	const completedSteps = new Set(session?.completedSteps ?? [])
	const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0

	// Timer state
	const activeTimer = localTimers.get(currentStepNumber)
	const timerRunning = !!activeTimer
	const timerRemaining = activeTimer?.remaining ?? step?.timerSeconds ?? 0

	// Timer ticking is now centralized in CookingTimerProvider

	// Handlers
	const handleNextStep = useCallback(async () => {
		if (!recipe) return
		await completeStep(currentStepNumber)
		if (currentStepNumber < totalSteps) {
			await navigateToStep('next')
		}
	}, [currentStepNumber, totalSteps, completeStep, navigateToStep, recipe])

	const handlePrevStep = useCallback(async () => {
		if (currentStepNumber > 1) {
			await navigateToStep('previous')
		}
	}, [currentStepNumber, navigateToStep])

	const handleStepClick = useCallback(
		async (stepNum: number) => {
			await navigateToStep('goto', stepNum)
		},
		[navigateToStep],
	)

	const handleTimerToggle = useCallback(() => {
		if (!step?.timerSeconds) return
		if (timerRunning) {
			skipTimer(currentStepNumber)
		} else {
			startTimer(currentStepNumber)
		}
	}, [step, currentStepNumber, timerRunning, startTimer, skipTimer])

	// When all steps are complete in docked mode, expand to show the rating form
	const handleComplete = useCallback(() => {
		// Expand to fullscreen where the completion modal with rating form will show
		expandCookingPanel()
	}, [expandCookingPanel])

	const handleExitRequest = useCallback(() => {
		setShowExitConfirm(true)
	}, [])

	const handleExitConfirm = useCallback(async () => {
		setShowExitConfirm(false)
		await abandonCooking()
		closeCookingPanel()
	}, [abandonCooking, closeCookingPanel])

	const allStepsComplete = completedSteps.size >= totalSteps

	// Early return AFTER all hooks
	if (cookingMode !== 'docked' || !session || !recipe) {
		return null
	}

	return (
		<aside className='hidden w-right flex-shrink-0 overflow-y-auto border-l border-border-subtle bg-bg-card xl:flex xl:flex-col'>
			{/* Header */}
			<div className='relative bg-gradient-hero p-4 text-white'>
				{/* Controls */}
				<div className='absolute right-2 top-2 flex gap-1'>
					<button
						onClick={expandCookingPanel}
						className='grid size-8 place-items-center rounded-lg bg-white/20 transition-colors hover:bg-white/30'
						title='Expand to fullscreen'
					>
						<Maximize2 className='size-4' />
					</button>
					<button
						onClick={closeCookingPanel}
						className='grid size-8 place-items-center rounded-lg bg-white/20 transition-colors hover:bg-white/30'
						title='Close cooking panel'
					>
						<X className='size-4' />
					</button>
				</div>

				{/* Recipe Info */}
				<div className='flex items-center gap-3'>
					<div className='grid size-10 place-items-center rounded-xl bg-white/20'>
						<ChefHat className='size-5' />
					</div>
					<div className='min-w-0 flex-1'>
						<h3 className='truncate text-sm font-bold'>{recipe.title}</h3>
						<div className='flex items-center gap-2 text-xs opacity-80'>
							<Clock className='size-3' />
							<span>{recipe.totalTimeMinutes} min</span>
							<span>•</span>
							<Zap className='size-3' />
							<span>+{recipe.xpReward} XP</span>
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className='mt-3'>
					<div className='mb-1 flex items-center justify-between text-xs'>
						<span>Progress</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<div className='h-1.5 overflow-hidden rounded-full bg-white/30'>
						<motion.div
							className='h-full rounded-full bg-white'
							initial={{ scaleX: 0, originX: 0 }}
							animate={{ scaleX: progress / 100 }}
							transition={TRANSITION_SPRING}
							style={{ transformOrigin: 'left' }}
						/>
					</div>
				</div>
			</div>

			{/* Step Navigation Dots */}
			<div className='border-b border-border-subtle bg-bg-elevated p-3'>
				<CompactStepDots
					totalSteps={totalSteps}
					currentStep={currentStepNumber}
					completedSteps={completedSteps}
					onStepClick={handleStepClick}
				/>
			</div>

			{/* Current Step Content */}
			<div className='flex-1 overflow-y-auto p-4'>
				<div className='mb-3 flex items-center justify-between'>
					<span className='text-xs font-medium uppercase tracking-wide text-text-secondary'>
						Step {currentStepNumber} of {totalSteps}
					</span>
					{completedSteps.has(currentStepNumber) && (
						<span className='flex items-center gap-1 text-xs font-medium text-success'>
							<Check className='size-3' /> Done
						</span>
					)}
				</div>

				<h4 className='mb-2 text-lg font-bold text-text'>
					{step?.title || `Step ${currentStepNumber}`}
				</h4>

				<p className='mb-4 text-sm leading-relaxed text-text-secondary'>
					{step?.description}
				</p>

				{/* Tips */}
				{step?.tips && (
					<div className='mb-4 rounded-xl bg-bonus/10 p-3 text-sm'>
						<span className='mr-2'>💡</span>
						<span className='text-bonus'>{step.tips}</span>
					</div>
				)}

				{/* Timer */}
				{step?.timerSeconds && step.timerSeconds > 0 && (
					<div className='mb-4 flex justify-center'>
						<MiniTimer
							seconds={timerRemaining}
							isRunning={timerRunning}
							onToggle={handleTimerToggle}
						/>
					</div>
				)}

				{/* Ingredients for this step */}
				{step?.ingredients && step.ingredients.length > 0 && (
					<div className='rounded-xl border border-border-subtle bg-bg-card p-3'>
						<h5 className='mb-2 flex items-center gap-2 text-sm font-semibold'>
							<span>🧾</span> Ingredients
						</h5>
						<ul className='space-y-1.5'>
							{step.ingredients.map((ing, idx) => (
								<li
									key={idx}
									className='flex items-center gap-2 text-sm text-text-secondary'
								>
									<div className='size-1.5 rounded-full bg-brand' />
									{ing.quantity} {ing.unit} {ing.name}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{/* Navigation Footer */}
			<div className='border-t border-border-subtle bg-bg-elevated p-4'>
				{allStepsComplete ? (
					<div className='space-y-2'>
						<motion.button
							onClick={handleComplete}
							whileTap={BUTTON_TAP}
							className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-hero py-3 font-bold text-white shadow-lg shadow-brand/30'
						>
							<Check className='size-5' />
							Complete Cooking
						</motion.button>
						<button
							onClick={handleExitRequest}
							className='w-full py-2 text-sm text-text-secondary hover:text-error'
						>
							Exit Without Saving
						</button>
					</div>
				) : (
					<div className='flex gap-2'>
						<button
							onClick={handlePrevStep}
							disabled={currentStepNumber <= 1}
							className='grid size-12 place-items-center rounded-xl border border-border-subtle bg-bg-card text-text-secondary transition-all hover:bg-bg-hover disabled:opacity-30'
						>
							<ChevronLeft className='size-5' />
						</button>
						<motion.button
							onClick={handleNextStep}
							whileTap={BUTTON_TAP}
							className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero py-3 font-bold text-white'
						>
							{currentStepNumber === totalSteps ? (
								<>
									<Check className='size-5' />
									Finish
								</>
							) : (
								<>
									Next Step
									<ChevronRight className='size-5' />
								</>
							)}
						</motion.button>
					</div>
				)}
			</div>

			{/* Exit Confirmation Dialog */}
			<Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
				<DialogContent className='max-w-sm'>
					<DialogHeader>
						<div className='mx-auto mb-2 grid size-12 place-items-center rounded-full bg-error/10'>
							<AlertTriangle className='size-6 text-error' />
						</div>
						<DialogTitle className='text-center'>
							Exit Cooking Session?
						</DialogTitle>
						<DialogDescription className='text-center'>
							Your progress will not be saved and you won&apos;t earn XP for
							this session.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className='flex-col gap-2 sm:flex-col'>
						<button
							onClick={handleExitConfirm}
							className='w-full rounded-xl bg-error py-3 font-semibold text-white transition-colors hover:bg-error/90'
						>
							Exit Session
						</button>
						<button
							onClick={() => setShowExitConfirm(false)}
							className='w-full rounded-xl border border-border-subtle bg-bg-elevated py-3 font-semibold text-text transition-colors hover:bg-bg-hover'
						>
							Continue Cooking
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</aside>
	)
}
