'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useCookingStore } from '@/store/cookingStore'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { RoomParticipantsBar } from './RoomParticipantsBar'
import { VoiceModeButton } from './VoiceModeButton'
import { VoiceCommandToast } from './VoiceCommandToast'
import { VoiceHelpOverlay } from './VoiceHelpOverlay'
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useStepPhotos } from '@/hooks/useStepPhotos'
import { useClapDetection } from '@/hooks/useClapDetection'
import { useVoiceMode } from '@/lib/voice'
import { isAudioEnabled } from '@/lib/audio'
import { TRANSITION_SPRING, BUTTON_TAP } from '@/lib/motion'
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
	Loader2,
	ZoomIn,
	ZoomOut,
	BookOpen,
	Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IngredientCheck } from './IngredientCheck'
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
			role='timer'
			aria-live='polite'
			aria-label={`Timer: ${minutes} minutes ${secs} seconds, ${isRunning ? 'running' : 'paused'}`}
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
		checkedIngredients,
		toggleIngredient,
		// Co-cooking room state
		roomCode,
		participants,
		isInRoom,
	} = useCookingStore()

	// Exit confirmation dialog state
	const [showExitConfirm, setShowExitConfirm] = useState(false)
	const [isNavigating, setIsNavigating] = useState(false)
	const [kitchenMode, setKitchenMode] = useState(false) // Off by default in docked (narrow sidebar)

	// Adaptive instructions: derive default from user proficiency
	const userTitle = useAuthStore.getState().user?.statistics?.title ?? 'BEGINNER'
	const defaultDetail = userTitle === 'BEGINNER' ? 'detailed' : userTitle === 'AMATEUR' ? 'standard' : 'condensed'
	const [instructionDetail, setInstructionDetail] = useState<'detailed' | 'standard' | 'condensed'>(defaultDetail)

	const cycleInstructionDetail = useCallback(() => {
		setInstructionDetail(prev => prev === 'detailed' ? 'standard' : prev === 'standard' ? 'condensed' : 'detailed')
	}, [])

	// Warn before browser exit during active cooking (not preview)
	const { isPreviewMode } = useCookingStore()
	const hasActiveSession =
		session?.status === 'in_progress' &&
		cookingMode !== 'hidden' &&
		!isPreviewMode
	useBeforeUnloadWarning(
		hasActiveSession,
		'You have an active cooking session. Progress will be saved but timers will reset.',
	)

	// Keep screen awake during cooking (Wave 2: Kitchen Protocol)
	useWakeLock(hasActiveSession)

	// Voice mode for hands-free cooking (Wave 2: Kitchen Protocol)
	const voice = useVoiceMode()

	// Step photo capture (Wave 2: Kitchen Protocol)
	const stepPhotos = useStepPhotos()
	const [showPhotoPrompt, setShowPhotoPrompt] = useState(false)
	const [photoStepNumber, setPhotoStepNumber] = useState(0)

	// aria-live announcement for screen readers (Wave 2: Kitchen Protocol)
	const [liveAnnouncement, setLiveAnnouncement] = useState('')

	// Auto-start continuous voice listening in docked mode (Wave 2: Kitchen Protocol)
	useEffect(() => {
		if (hasActiveSession && voice.isSupported && !voice.isContinuous) {
			voice.startContinuous()
		}
		if (!hasActiveSession && voice.isContinuous) {
			voice.stopContinuous()
		}
	}, [hasActiveSession, voice.isSupported, voice.isContinuous, voice.startContinuous, voice.stopContinuous, voice])

	// Derive state (always compute, even if we won't render)
	const currentStepNumber = session?.currentStep ?? 1
	const step = recipe?.steps?.[currentStepNumber - 1]
	const totalSteps = recipe?.steps?.length ?? 0
	const completedSteps = new Set(session?.completedSteps ?? [])
	const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0

	// Double-clap detection: re-reads current step via TTS (Wave 2: Kitchen Protocol)
	const handleDoubleclap = useCallback(() => {
		if (!step || !voice.hasTTS) return
		const tipsText = instructionDetail === 'detailed' && step.tips ? ` Tip: ${step.tips}` : ''
		const speech = instructionDetail === 'condensed'
			? `Step ${step.stepNumber}. ${step.title ?? step.description}`
			: `Step ${step.stepNumber}. ${step.description}${tipsText}`
		voice.speak(speech)
	}, [step, voice, instructionDetail])

	useClapDetection({
		enabled: hasActiveSession,
		onDoubleclap: handleDoubleclap,
	})

	// Auto-read step instructions via TTS on navigation (Wave 2: Kitchen Protocol)
	const prevStepRef = useRef(0)
	useEffect(() => {
		if (!hasActiveSession || !step || cookingMode !== 'docked') return
		if (prevStepRef.current === currentStepNumber) return
		prevStepRef.current = currentStepNumber

		const tipsText = instructionDetail === 'detailed' && step.tips ? ` Tip: ${step.tips}` : ''
		const announcement = `Step ${step.stepNumber} of ${totalSteps}. ${step.title ?? 'Cook'}. ${step.description}${tipsText}`
		setLiveAnnouncement(announcement)

		if (isAudioEnabled() && voice.hasTTS) {
			const speech = instructionDetail === 'condensed'
				? `Step ${step.stepNumber}. ${step.title ?? step.description}`
				: `Step ${step.stepNumber}. ${step.description}${tipsText}`
			voice.speak(speech)
		}
	}, [hasActiveSession, currentStepNumber, step, cookingMode, voice, instructionDetail, totalSteps])

	// Timer state
	const activeTimer = localTimers.get(currentStepNumber)
	const timerRunning = !!activeTimer
	const timerRemaining = activeTimer?.remaining ?? step?.timerSeconds ?? 0

	// Timer ticking is now centralized in CookingTimerProvider

	// Handlers
	const handleNextStep = useCallback(async () => {
		if (!recipe || isNavigating) return
		setIsNavigating(true)
		try {
			await completeStep(currentStepNumber)

			// Show photo capture prompt — capture step number NOW before navigation changes it
			setPhotoStepNumber(currentStepNumber)
			setShowPhotoPrompt(true)
			setTimeout(() => setShowPhotoPrompt(false), 4000)

			if (currentStepNumber < totalSteps) {
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
				// Session complete in docked mode — persist photos then expand for rating
				await stepPhotos.persistForPostCreation()
			}
		} finally {
			setIsNavigating(false)
		}
	}, [
		currentStepNumber,
		totalSteps,
		completeStep,
		navigateToStep,
		recipe,
		startTimer,
		isNavigating,
		stepPhotos,
	])

	const handlePrevStep = useCallback(async () => {
		if (currentStepNumber > 1 && !isNavigating) {
			setIsNavigating(true)
			try {
				await navigateToStep('previous')
			} finally {
				setIsNavigating(false)
			}
		}
	}, [currentStepNumber, navigateToStep, isNavigating])

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
						onClick={() => setKitchenMode((k) => !k)}
						className={cn(
							'grid size-8 place-items-center rounded-lg transition-colors',
							kitchenMode ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30',
						)}
						title={kitchenMode ? 'Kitchen display: ON' : 'Kitchen display: OFF'}
					>
						{kitchenMode ? <ZoomOut className='size-4' /> : <ZoomIn className='size-4' />}
					</button>
					<button
						onClick={cycleInstructionDetail}
						className={cn(
							'grid size-8 place-items-center rounded-lg transition-colors',
							instructionDetail === 'detailed'
								? 'bg-success/40'
								: instructionDetail === 'condensed'
									? 'bg-warning/40'
									: 'bg-white/20 hover:bg-white/30',
						)}
						title={`Instructions: ${instructionDetail}`}
					>
						<BookOpen className='size-4' />
					</button>
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

				{/* Co-cooking participants */}
				{isInRoom && roomCode && (
					<RoomParticipantsBar
						participants={participants}
						roomCode={roomCode}
						currentUserId={useAuthStore.getState().user?.userId}
						totalSteps={totalSteps}
						compact
					/>
				)}

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
					<span className={cn('font-medium uppercase tracking-wide text-text-secondary', kitchenMode ? 'text-sm' : 'text-xs')}>
						Step {currentStepNumber} of {totalSteps}
					</span>
					{completedSteps.has(currentStepNumber) && (
						<span className={cn('flex items-center gap-1 font-medium text-success', kitchenMode ? 'text-sm' : 'text-xs')}>
							<Check className='size-3' /> Done
						</span>
					)}
				</div>

				<h4 className={cn('mb-2 font-bold text-text', kitchenMode ? 'text-xl' : 'text-lg')}>
					{step?.title || `Step ${currentStepNumber}`}
				</h4>

				{/* Step Video (priority) or Image - Critical for visual guidance */}
				{step?.videoUrl ? (
					<div className='relative mb-4 aspect-video overflow-hidden rounded-xl'>
						<video
							src={step.videoUrl}
							poster={step.videoThumbnailUrl || undefined}
							controls
							loop
							muted
							playsInline
							className='h-full w-full object-cover'
						/>
					</div>
				) : step?.imageUrl ? (
					<div className='relative mb-4 aspect-video overflow-hidden rounded-xl'>
						<Image
							src={step.imageUrl}
							alt={step.title || `Step ${currentStepNumber}`}
							fill
							className='object-cover'
						/>
					</div>
				) : null}

				<p className={cn('mb-4 leading-relaxed text-text-secondary', kitchenMode ? 'text-base' : 'text-sm')}>
					{step?.description}
				</p>

				{/* Tips — Adaptive: hidden in condensed mode */}
				{step?.tips && instructionDetail !== 'condensed' && (
					<div className={cn(
						'mb-4 rounded-xl p-3',
						instructionDetail === 'detailed' ? 'border border-bonus/30 bg-bonus/15' : 'bg-bonus/10',
						kitchenMode ? 'text-base' : 'text-sm',
					)}>
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

				{/* Ingredients Checklist */}
				{step?.ingredients && step.ingredients.length > 0 && (
					<div className='rounded-xl border border-border-subtle bg-bg-card p-3'>
						<h5 className='mb-2 flex items-center gap-2 text-sm font-semibold'>
							<span>🧾</span> Ingredients
						</h5>
						<div className='flex flex-col gap-1.5'>
							{step.ingredients.map((ing, idx) => {
								const id = `${currentStepNumber}-${idx}`
								return (
									<IngredientCheck
										key={id}
										ingredient={{
											name: ing.name,
											quantity: ing.quantity ?? '',
											unit: ing.unit ?? '',
										}}
										isChecked={!!checkedIngredients[id]}
										onToggle={() => toggleIngredient(id)}
										index={idx}
									/>
								)
							})}
						</div>
					</div>
				)}

				{/* Accessibility: aria-live region for step/timer announcements (Wave 2) */}
				<div role='status' aria-live='assertive' aria-atomic='true' className='sr-only'>
					{liveAnnouncement}
				</div>

				{/* Step Photo Capture — hidden input + compact prompt (Wave 2: Kitchen Protocol) */}
				<input
					ref={stepPhotos.fileInputRef}
					type='file'
					accept='image/*'
					capture='environment'
					onChange={stepPhotos.onFileChange}
					className='hidden'
					aria-hidden='true'
				/>
				<AnimatePresence>
					{showPhotoPrompt && (
						<motion.button
							initial={{ opacity: 0, y: 10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 5, scale: 0.95 }}
							transition={TRANSITION_SPRING}
							onClick={() => {
								stepPhotos.captureForStep(photoStepNumber)
								setShowPhotoPrompt(false)
							}}
							className='mx-auto mt-3 flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-sm text-brand transition-colors hover:bg-brand/20'
						>
							<Camera className='size-4' />
							<span>Snap!</span>
							{stepPhotos.totalCount > 0 && (
								<span className='rounded-full bg-brand px-1.5 py-0.5 text-xs font-bold text-white'>
									{stepPhotos.totalCount}
								</span>
							)}
						</motion.button>
					)}
				</AnimatePresence>
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
							disabled={currentStepNumber <= 1 || isNavigating}
							className={cn(
								'grid place-items-center rounded-xl border border-border-subtle bg-bg-card text-text-secondary transition-all hover:bg-bg-hover disabled:opacity-30',
								kitchenMode ? 'size-14' : 'size-12',
							)}
						>
							<ChevronLeft className='size-5' />
						</button>
						<VoiceModeButton voice={voice} />
						<motion.button
							onClick={handleNextStep}
							disabled={isNavigating}
							whileTap={isNavigating ? undefined : BUTTON_TAP}
							className={cn(
								'flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero font-bold text-white transition-opacity',
								kitchenMode ? 'py-4 text-base' : 'py-3',
								isNavigating && 'cursor-wait opacity-80',
							)}
						>
							{isNavigating ? (
								<>
									<Loader2 className='size-5 animate-spin' />
									Processing...
								</>
							) : currentStepNumber === totalSteps ? (
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

			{/* Voice Mode Overlays (Wave 2: Kitchen Protocol) */}
			<VoiceCommandToast event={voice.lastEvent} />
			<VoiceHelpOverlay
				show={voice.showHelp}
				onClose={() => voice.setShowHelp(false)}
			/>
		</aside>
	)
}
