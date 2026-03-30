'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Portal } from '@/components/ui/portal'
import { useUiStore } from '@/store/uiStore'
import { logDevWarn } from '@/lib/dev-log'
import { useCookingStore } from '@/store/cookingStore'
import type { KitchenInteractionMode } from '@/store/cookingStore'
import { useAuthStore } from '@/store/authStore'
import { RoomParticipantsBar } from './RoomParticipantsBar'
import { useCelebration } from '@/components/providers/CelebrationProvider'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { notifyTimerUrgent, isAudioEnabled, setAudioEnabled } from '@/lib/audio'
import { diag } from '@/lib/diagnostics'
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning'
import { useRoomSocket } from '@/hooks/useRoomSocket'
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
	ZoomIn,
	ZoomOut,
	BookOpen,
	Camera,
	Hand,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { SessionRatingForm } from './SessionRatingForm'
import { IngredientCheck } from './IngredientCheck'
import { VoiceModeButton } from './VoiceModeButton'
import { VoiceCommandToast } from './VoiceCommandToast'
import { VoiceHelpOverlay } from './VoiceHelpOverlay'
import { OfflineBanner } from './OfflineBanner'
import { AiAssistPanel } from './AiAssistPanel'
import { useVoiceMode } from '@/lib/voice'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useStepPhotos } from '@/hooks/useStepPhotos'
import { useClapDetection } from '@/hooks/useClapDetection'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	TIMER_URGENT,
	OVERLAY_BACKDROP,
	CELEBRATION_MODAL,
} from '@/lib/motion'

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
						// 44px minimum touch targets for accessibility
						isCurrent
							? 'h-11 w-14 bg-white text-brand shadow-md'
							: isCompleted
								? 'size-11 bg-success text-white'
								: 'size-11 bg-white/20 text-white/70 hover:bg-white/30 hover:text-white',
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
	kitchenMode = false,
}: {
	seconds: number
	isRunning: boolean
	onToggle: () => void
	onComplete: () => void
	kitchenMode?: boolean
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
			role='timer'
			aria-live='polite'
			aria-label={`Timer: ${display}. ${isComplete ? 'Complete' : isRunning ? 'Running' : 'Paused'}`}
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

			<span
				className={cn(
					'relative z-10 font-semibold uppercase tracking-wider opacity-70',
					kitchenMode ? 'text-sm' : 'text-xs',
				)}
			>
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
						'grid place-items-center rounded-full transition-colors',
						kitchenMode ? 'size-16' : 'size-12',
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
					className={cn(
						'relative z-10 font-mono font-bold tabular-nums',
						kitchenMode ? 'text-6xl' : 'text-4xl',
					)}
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
		<span className='tabular-nums'>+{xp} XP</span>
	</motion.div>
)

// ============================================
// KITCHEN PROTOCOL MODE INDICATOR
// ============================================

const MODE_CONFIG: Record<
	KitchenInteractionMode,
	{ label: string; icon: string; bg: string; text: string }
> = {
	PREP: {
		label: 'Getting Ready',
		icon: '📋',
		bg: 'bg-brand/20',
		text: 'text-brand',
	},
	ACTIVE: {
		label: 'Cooking',
		icon: '🔥',
		bg: 'bg-success/20',
		text: 'text-success',
	},
	MESSY_HANDS: {
		label: 'Messy Hands',
		icon: '🙌',
		bg: 'bg-warning/25',
		text: 'text-warning',
	},
	MONITORING: {
		label: 'Monitoring',
		icon: '👀',
		bg: 'bg-streak/20',
		text: 'text-streak',
	},
	COMPLETION: {
		label: 'Done!',
		icon: '🏆',
		bg: 'bg-xp/20',
		text: 'text-xp',
	},
}

/**
 * ModeIndicatorBadge — Shows current Kitchen Protocol interaction mode.
 * Animates on mode change so users notice the transition.
 */
const ModeIndicatorBadge = ({
	mode,
	className,
}: {
	mode: KitchenInteractionMode | null
	className?: string
}) => {
	if (!mode || mode === 'ACTIVE') return null // ACTIVE is the default — no badge needed

	const config = MODE_CONFIG[mode]
	return (
		<AnimatePresence mode='wait'>
			<motion.div
				key={mode}
				initial={{ opacity: 0, scale: 0.8, y: -4 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.8, y: -4 }}
				transition={TRANSITION_SPRING}
				className={cn(
					'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
					config.bg,
					config.text,
					className,
				)}
			>
				<span>{config.icon}</span>
				<span>{config.label}</span>
			</motion.div>
		</AnimatePresence>
	)
}

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
		clearAllTimers,
		clearSession,
		checkedIngredients,
		toggleIngredient,
		isPreviewMode,
		exitPreview,
		interactionMode,
		setInteractionMode,
		// Co-cooking room state
		roomCode,
		participants,
		isInRoom,
	} = useCookingStore()

	// Co-cooking WebSocket: send real-time events to room participants
	// Room page handles incoming events; CookingPlayer only SENDS
	const {
		sendStepNavigated,
		sendStepCompleted,
		sendTimerStarted,
		sendTimerCompleted,
		sendReaction: _sendReaction,
		sendSessionCompleted,
		isConnected: isRoomConnected,
	} = useRoomSocket({
		roomCode: isInRoom ? roomCode : null,
		onEvent: () => {}, // Room page handles incoming events
		enabled: isInRoom && !isPreviewMode,
	})

	// Warn users before leaving page during active cooking session (skip in preview)
	const hasActiveSession =
		session?.status === 'in_progress' && isOpen && !isPreviewMode
	useBeforeUnloadWarning(
		hasActiveSession,
		'You have an active cooking session. Progress will be saved but timers will reset.',
	)

	// Local UI state
	const [direction, setDirection] = useState(0) // -1 = back, 1 = forward
	const [showCompletion, setShowCompletion] = useState(false)
	const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
	const [showAiAssist, setShowAiAssist] = useState(false)
	const [isNavigating, setIsNavigating] = useState(false)
	const [kitchenMode, setKitchenMode] = useState(true) // Auto-enabled: 28px+ text, 64px+ targets
	const [liveAnnouncement, setLiveAnnouncement] = useState('') // aria-live region text

	// Adaptive recipe instructions (Wave 2): adjust detail level based on user proficiency
	// BEGINNER → detailed (tips expanded, TTS reads tips), AMATEUR → standard, SEMIPRO/PRO → condensed
	const userTitle =
		useAuthStore.getState().user?.statistics?.title ?? 'BEGINNER'
	const defaultDetail =
		userTitle === 'BEGINNER'
			? 'detailed'
			: userTitle === 'AMATEUR'
				? 'standard'
				: 'condensed'
	const [instructionDetail, setInstructionDetail] = useState<
		'detailed' | 'standard' | 'condensed'
	>(defaultDetail)

	const cycleInstructionDetail = useCallback(() => {
		setInstructionDetail(prev =>
			prev === 'detailed'
				? 'standard'
				: prev === 'standard'
					? 'condensed'
					: 'detailed',
		)
	}, [])

	// Step photo capture (Wave 2: Kitchen Protocol)
	const stepPhotos = useStepPhotos()
	const [showPhotoPrompt, setShowPhotoPrompt] = useState(false)
	const [photoStepNumber, setPhotoStepNumber] = useState(0) // Tracks which step was just completed (for photo prompt)

	// Focus traps for modal accessibility
	const completionTrapRef = useFocusTrap<HTMLDivElement>(showCompletion)
	const abandonTrapRef = useFocusTrap<HTMLDivElement>(showAbandonConfirm)

	// Voice mode for hands-free cooking (spec: 22-voice-mode.txt)
	const voice = useVoiceMode()

	// Offline detection for cooking continuity
	const { isOffline } = useOnlineStatus()

	// Keep screen awake during cooking (Wave 2: Kitchen Protocol)
	useWakeLock(isOpen && !!session && session.status === 'in_progress')

	// Auto-start continuous voice listening when cooking (Wave 2: Kitchen Protocol)
	// Enables hands-free commands without pushing any button
	useEffect(() => {
		if (
			isOpen &&
			session?.status === 'in_progress' &&
			voice.isSupported &&
			!voice.isContinuous
		) {
			voice.startContinuous()
		}
		if (!isOpen && voice.isContinuous) {
			voice.stopContinuous()
		}
	}, [
		isOpen,
		session?.status,
		voice.isSupported,
		voice.isContinuous,
		voice.startContinuous,
		voice.stopContinuous,
		voice,
	])

	// Derive current step data from session and recipe
	const currentStepNumber = session?.currentStep ?? 1
	const step = recipe?.steps?.[currentStepNumber - 1]
	const totalSteps = recipe?.steps?.length ?? 0
	const completedSteps = useMemo(
		() => new Set(session?.completedSteps ?? []),
		[session?.completedSteps],
	)
	const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0

	// Double-clap detection: re-reads current step via TTS (Wave 2: Kitchen Protocol)
	// Hands-free wake — clap twice to hear the current step again
	// Respects instructionDetail: detailed includes tips, condensed reads title only
	const handleDoubleclap = useCallback(() => {
		if (!step || !voice.hasTTS) return
		const tipsText =
			instructionDetail === 'detailed' && step.tips ? ` Tip: ${step.tips}` : ''
		const speech =
			instructionDetail === 'condensed'
				? `Step ${step.stepNumber}. ${step.title ?? step.description}`
				: `Step ${step.stepNumber}. ${step.description}${tipsText}`
		voice.speak(speech)
	}, [step, voice, instructionDetail])

	useClapDetection({
		enabled: isOpen && !!session && session.status === 'in_progress',
		onDoubleclap: handleDoubleclap,
	})

	// Log when cooking player opens with recipe data
	useEffect(() => {
		if (isOpen && recipe) {
			diag.snapshot('cooking', 'PLAYER_OPENED', {
				recipeId: recipe.id,
				recipeTitle: recipe.title,
				coverImage: recipe.coverImageUrl?.[0] ?? 'NO_COVER_IMAGE',
				totalSteps,
				stepsWithImages: recipe.steps?.map((s, i) => ({
					stepNum: i + 1,
					hasImage: !!s.imageUrl,
					imageUrl: s.imageUrl ?? null,
				})),
				sessionId: session?.sessionId,
				sessionStatus: session?.status,
			})
		}
	}, [isOpen, recipe, totalSteps, session])

	// Auto-read step instructions via TTS on navigation (Wave 2: Kitchen Protocol)
	// Uses a ref to track previous step — speaks when step CHANGES, INCLUDING Step 1 on open
	// Adaptive: 'detailed' mode includes tips in TTS, 'condensed' reads only core instruction
	const prevStepRef = useRef(0) // Start at 0 so Step 1 is auto-read on first open
	useEffect(() => {
		if (!isOpen || !step || showCompletion) return

		// Only read on actual navigation, not on first render
		if (prevStepRef.current === currentStepNumber) return
		prevStepRef.current = currentStepNumber

		const tipsText =
			instructionDetail === 'detailed' && step.tips ? ` Tip: ${step.tips}` : ''
		const announcement = `Step ${step.stepNumber} of ${totalSteps}. ${step.title ?? 'Cook'}. ${step.description}${tipsText}`
		// Update aria-live region for screen readers
		setLiveAnnouncement(announcement)

		if (isAudioEnabled() && voice.hasTTS) {
			const speech =
				instructionDetail === 'condensed'
					? `Step ${step.stepNumber}. ${step.title ?? step.description}`
					: `Step ${step.stepNumber}. ${step.description}${tipsText}`
			voice.speak(speech)
		}
	}, [
		isOpen,
		currentStepNumber,
		step,
		showCompletion,
		voice,
		instructionDetail,
		totalSteps,
	])

	// ============================================
	// KITCHEN PROTOCOL: AUTO-TRANSITIONS (Task 8)
	// ============================================

	// TRANSITION 1: PREP → ACTIVE
	// Auto-exits PREP after 30 seconds so the user is never stuck in overview mode.
	// Also exits PREP immediately when any step is completed (first "Next Step" click).
	const prepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => {
		if (interactionMode !== 'PREP') {
			if (prepTimeoutRef.current) {
				clearTimeout(prepTimeoutRef.current)
				prepTimeoutRef.current = null
			}
			return
		}
		prepTimeoutRef.current = setTimeout(() => {
			// Only auto-progress if still in PREP (user may have manually moved)
			if (useCookingStore.getState().interactionMode === 'PREP') {
				setInteractionMode('ACTIVE')
			}
		}, 30_000)
		return () => {
			if (prepTimeoutRef.current) {
				clearTimeout(prepTimeoutRef.current)
				prepTimeoutRef.current = null
			}
		}
	}, [interactionMode, setInteractionMode])

	// Exit PREP immediately on first step completion
	const prevCompletedCountRef = useRef(0)
	useEffect(() => {
		const count = session?.completedSteps?.length ?? 0
		if (count > prevCompletedCountRef.current && interactionMode === 'PREP') {
			setInteractionMode('ACTIVE')
		}
		prevCompletedCountRef.current = count
	}, [session?.completedSteps?.length, interactionMode, setInteractionMode])

	// TRANSITION 2: ACTIVE ↔ MONITORING
	// Enters MONITORING when a timer starts; exits back to ACTIVE when all timers clear.
	// MESSY_HANDS takes priority — if user set messy hands, timer start does NOT override it.
	const prevTimerCountRef = useRef(0)
	useEffect(() => {
		const count = localTimers.size
		if (count > 0 && interactionMode === 'ACTIVE') {
			setInteractionMode('MONITORING')
		} else if (count === 0 && interactionMode === 'MONITORING') {
			setInteractionMode('ACTIVE')
		}
		prevTimerCountRef.current = count
	}, [localTimers.size, interactionMode, setInteractionMode])

	// TRANSITION 3: Any → COMPLETION
	// When the completion modal opens, reflect it in the interaction mode.
	useEffect(() => {
		if (showCompletion && interactionMode !== 'COMPLETION') {
			setInteractionMode('COMPLETION')
		}
	}, [showCompletion, interactionMode, setInteractionMode])

	// TRANSITION 4: Auto-enable continuous voice in MESSY_HANDS mode
	// MESSY_HANDS = voice is primary; ensure it's always listening.
	useEffect(() => {
		if (
			interactionMode === 'MESSY_HANDS' &&
			voice.isSupported &&
			!voice.isContinuous
		) {
			voice.startContinuous()
		}
	}, [
		interactionMode,
		voice.isSupported,
		voice.isContinuous,
		voice.startContinuous,
		voice,
	])

	// TRANSITION 5: Auto MESSY_HANDS heuristic
	// If user doesn't touch the screen for 45s during ACTIVE cooking, they likely
	// have messy/wet/occupied hands. Auto-enter MESSY_HANDS so voice becomes primary.
	// Resets on any touch/click/pointer event on the cooking player container.
	const messyHandsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)
	const lastTouchRef = useRef<number>(Date.now())

	const resetMessyHandsTimer = useCallback(() => {
		lastTouchRef.current = Date.now()
		if (messyHandsTimeoutRef.current) {
			clearTimeout(messyHandsTimeoutRef.current)
			messyHandsTimeoutRef.current = null
		}
		if (interactionMode === 'ACTIVE') {
			messyHandsTimeoutRef.current = setTimeout(() => {
				const store = useCookingStore.getState()
				if (store.interactionMode === 'ACTIVE') {
					toast('🙌 Hands busy?', {
						description:
							'Tap here to switch to voice mode — no screen touch needed.',
						action: {
							label: 'Enable Voice Mode',
							onClick: () => {
								useCookingStore.getState().setInteractionMode('MESSY_HANDS')
							},
						},
						duration: 6000,
					})
				}
			}, 45_000)
		}
	}, [interactionMode])

	useEffect(() => {
		if (!isOpen || interactionMode !== 'ACTIVE') {
			if (messyHandsTimeoutRef.current) {
				clearTimeout(messyHandsTimeoutRef.current)
				messyHandsTimeoutRef.current = null
			}
			return
		}

		// Start the timer when entering ACTIVE mode
		messyHandsTimeoutRef.current = setTimeout(() => {
			const store = useCookingStore.getState()
			if (store.interactionMode === 'ACTIVE') {
				toast('🙌 Hands busy?', {
					description:
						'Tap here to switch to voice mode — no screen touch needed.',
					duration: 6000,
					action: {
						label: 'Enable Voice Mode',
						onClick: () => {
							useCookingStore.getState().setInteractionMode('MESSY_HANDS')
						},
					},
				})
			}
		}, 45_000)

		// Listen for touch/pointer/click events on document to reset timer
		const handler = () => resetMessyHandsTimer()
		document.addEventListener('pointerdown', handler, { passive: true })
		document.addEventListener('touchstart', handler, { passive: true })

		return () => {
			if (messyHandsTimeoutRef.current) {
				clearTimeout(messyHandsTimeoutRef.current)
				messyHandsTimeoutRef.current = null
			}
			document.removeEventListener('pointerdown', handler)
			document.removeEventListener('touchstart', handler)
		}
	}, [isOpen, interactionMode, setInteractionMode, resetMessyHandsTimer])

	// Handlers - defined before useEffects that reference them
	const handleNextStep = useCallback(async () => {
		if (!recipe || isNavigating) return

		// GUARD: Don't navigate if completion modal is showing
		if (showCompletion) return

		setIsNavigating(true)

		try {
			diag.action('cooking', 'STEP_NEXT_CLICK', {
				currentStep: currentStepNumber,
				totalSteps,
				stepHasTimer: !!step?.timerSeconds,
			})

			// Complete current step first
			await completeStep(currentStepNumber)

			// Show photo capture prompt — capture step number NOW before navigation changes it
			setPhotoStepNumber(currentStepNumber)
			setShowPhotoPrompt(true)
			setTimeout(() => setShowPhotoPrompt(false), 4000)

			// Broadcast to co-cooking room
			if (isInRoom)
				sendStepCompleted(currentStepNumber, [
					...completedSteps,
					currentStepNumber,
				])

			if (currentStepNumber < totalSteps) {
				setDirection(1)
				await navigateToStep('next')

				// Broadcast navigation to co-cooking room
				if (isInRoom) sendStepNavigated(currentStepNumber + 1)

				// Auto-start timer for the NEXT step if it has one
				const nextStepNumber = currentStepNumber + 1
				const nextStep = recipe.steps?.[nextStepNumber - 1]
				if (nextStep?.timerSeconds && nextStep.timerSeconds > 0) {
					diag.action('cooking', 'AUTO_START_TIMER', {
						stepNumber: nextStepNumber,
						timerSeconds: nextStep.timerSeconds,
					})
					// Small delay to ensure state is updated before starting timer
					setTimeout(() => {
						startTimer(nextStepNumber)
					}, 100)
				}
			} else {
				// Session complete!
				// CRITICAL: Clear all timers immediately to prevent zombie timer ticks
				clearAllTimers()

				// Persist step photos for post creation (await to prevent data loss on unmount)
				await stepPhotos.persistForPostCreation()

				if (isPreviewMode) {
					// Preview: skip rating form entirely — just show feedback and exit
					toast.success('Preview complete! Your recipe looks great.', {
						icon: '🎬',
					})
					exitPreview()
					closeCookingPanel()
					return
				}

				diag.modal('cooking', 'COMPLETION_MODAL', true, 'all_steps_done')
				setShowCompletion(true)
			}
		} finally {
			setIsNavigating(false)
		}
	}, [
		currentStepNumber,
		totalSteps,
		completeStep,
		navigateToStep,
		completedSteps,
		recipe,
		stepPhotos,
		startTimer,
		step,
		showCompletion,
		clearAllTimers,
		isInRoom,
		sendStepCompleted,
		sendStepNavigated,
		isNavigating,
		isPreviewMode,
		exitPreview,
		closeCookingPanel,
	])

	const handlePrevStep = useCallback(async () => {
		// GUARD: Don't navigate if completion modal is showing or already navigating
		if (showCompletion || isNavigating) return

		if (currentStepNumber > 1) {
			setIsNavigating(true)
			try {
				diag.action('cooking', 'STEP_PREV_CLICK', {
					currentStep: currentStepNumber,
					goingTo: currentStepNumber - 1,
				})
				setDirection(-1)
				await navigateToStep('previous')

				// Broadcast to co-cooking room
				if (isInRoom) sendStepNavigated(currentStepNumber - 1)
			} finally {
				setIsNavigating(false)
			}
		}
	}, [
		currentStepNumber,
		navigateToStep,
		showCompletion,
		isNavigating,
		isInRoom,
		sendStepNavigated,
	])

	const handleStepClick = useCallback(
		async (stepNumber: number) => {
			// GUARD: Don't navigate if completion modal is showing
			if (showCompletion) return

			if (stepNumber === currentStepNumber) return
			diag.action('cooking', 'STEP_DOT_CLICK', {
				fromStep: currentStepNumber,
				toStep: stepNumber,
			})
			setDirection(stepNumber > currentStepNumber ? 1 : -1)
			await navigateToStep('goto', stepNumber)

			// Broadcast to co-cooking room
			if (isInRoom) sendStepNavigated(stepNumber)
		},
		[
			currentStepNumber,
			navigateToStep,
			showCompletion,
			isInRoom,
			sendStepNavigated,
		],
	)

	// Timer ticking is handled by CookingTimerProvider (centralized)
	// NO setInterval here — we removed the duplicate to prevent 2x speed ticking

	// Keyboard navigation
	// CRITICAL: Disabled when completion modal or abandon confirm is showing
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Guard: Don't handle keyboard when player is closed
			if (!isOpen) return

			// Error state (no recipe/session): only Escape to dismiss
			if (!recipe) {
				if (e.key === 'Escape') {
					e.preventDefault()
					closeCookingPanel()
				}
				return
			}

			// Guard: Don't capture keyboard events when completion modal is showing
			// This allows users to type in the rating form (e.g., notes with spaces)
			if (showCompletion) return

			// Guard: When AI assist or abandon confirmation is showing, don't capture
			if (showAiAssist) return

			// Guard: When abandon confirmation is showing, only handle Escape to close it
			if (showAbandonConfirm) {
				if (e.key === 'Escape') {
					e.preventDefault()
					setShowAbandonConfirm(false)
				}
				return
			}

			if (e.key === 'ArrowRight') {
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
	}, [
		isOpen,
		recipe,
		closeCookingPanel,
		handleNextStep,
		handlePrevStep,
		showCompletion,
		showAiAssist,
		showAbandonConfirm,
	])

	const handleTimerToggle = useCallback(() => {
		if (!step?.timerSeconds) return

		const activeTimer = localTimers.get(currentStepNumber)
		if (activeTimer) {
			diag.action('cooking', 'TIMER_SKIP', {
				stepNumber: currentStepNumber,
				remainingSeconds: activeTimer.remaining,
			})
			// Timer is running, skip it
			skipTimer(currentStepNumber)

			// Broadcast timer completion (skip = timer done) to co-cooking room
			if (isInRoom) sendTimerCompleted(currentStepNumber)
		} else {
			diag.action('cooking', 'TIMER_START', {
				stepNumber: currentStepNumber,
				timerSeconds: step.timerSeconds,
			})
			// Start timer
			startTimer(currentStepNumber)

			// Broadcast timer start to co-cooking room
			if (isInRoom) sendTimerStarted(currentStepNumber, step.timerSeconds!)
		}
	}, [
		step,
		currentStepNumber,
		localTimers,
		startTimer,
		skipTimer,
		isInRoom,
		sendTimerCompleted,
		sendTimerStarted,
	])

	const handleTimerComplete = useCallback(() => {
		// Timer completed naturally - handled by tickTimers
		diag.action('cooking', 'TIMER_COMPLETE_NATURAL', {
			stepNumber: currentStepNumber,
		})

		// Broadcast to co-cooking room
		if (isInRoom) sendTimerCompleted(currentStepNumber)
	}, [currentStepNumber, isInRoom, sendTimerCompleted])

	const [isCompletingSession, setIsCompletingSession] = useState(false)

	const handleComplete = useCallback(
		async (rating?: number, notes?: string) => {
			// Preview mode — no real completion, just close
			if (isPreviewMode) {
				toast.success('Preview complete! Your recipe looks great.')
				exitPreview()
				closeCookingPanel()
				setShowCompletion(false)
				return
			}

			// Guard against double-completion
			if (isCompletingSession || session?.status === 'completed') {
				diag.warn('cooking', 'COMPLETE_DOUBLE_CLICK_BLOCKED', {
					isCompletingSession,
					sessionStatus: session?.status,
				})
				logDevWarn('[handleComplete] Already completing or completed, ignoring')
				return
			}

			diag.action('cooking', 'COMPLETE_SESSION_SUBMIT', {
				rating,
				hasNotes: !!notes,
				sessionId: session?.sessionId,
				completedSteps: session?.completedSteps?.length ?? 0,
				totalSteps,
			})

			setIsCompletingSession(true)
			try {
				const completionResult = await completeCooking(rating, notes)

				if (!completionResult) {
					// Get error from store and show toast
					const errorMsg = useCookingStore.getState().error
					diag.error('cooking', 'COMPLETE_SESSION_FAILED', {
						error: errorMsg,
						sessionId: session?.sessionId,
					})
					toast.error(
						errorMsg || 'Failed to complete cooking session. Please try again.',
					)
					return
				}

				// Broadcast session completion to co-cooking room
				if (isInRoom) sendSessionCompleted(rating)

				diag.response(
					'cooking',
					'COMPLETE_SESSION_SUCCESS',
					{
						baseXpAwarded: completionResult.baseXpAwarded,
						pendingXp: completionResult.pendingXp,
						leveledUp: completionResult.leveledUp,
						oldLevel: completionResult.oldLevel,
						newLevel: completionResult.newLevel,
					},
					true,
				)

				// Check for level-up and celebrate FIRST (before rewards modal)
				if (
					completionResult.leveledUp &&
					completionResult.oldLevel &&
					completionResult.newLevel
				) {
					diag.action('cooking', 'LEVEL_UP_CELEBRATION', {
						oldLevel: completionResult.oldLevel,
						newLevel: completionResult.newLevel,
					})
					showLevelUp({
						oldLevel: completionResult.oldLevel,
						newLevel: completionResult.newLevel,
					})
					// Small delay so level-up celebration shows first
					await new Promise(resolve => setTimeout(resolve, 2500))
				}

				// Trigger celebration with immediate rewards data
				diag.modal('cooking', 'REWARDS_MODAL', true, 'session_completed')
				showImmediateRewards({
					sessionId: session?.sessionId ?? '',
					recipeName: recipe?.title ?? 'Recipe',
					recipeImageUrl: recipe?.coverImageUrl?.[0],
					immediateXp: completionResult.baseXpAwarded,
					pendingXp: completionResult.pendingXp,
					xpBreakdown: completionResult.xpBreakdown,
					postDeadlineHours: 336, // 14 days in hours
				})

				setShowCompletion(false)
				closeCookingPanel()
				// Clean up session/recipe from store now that UI is closed
				clearSession()
			} finally {
				setIsCompletingSession(false)
			}
		},
		[
			completeCooking,
			closeCookingPanel,
			clearSession,
			showImmediateRewards,
			showLevelUp,
			recipe,
			session,
			isCompletingSession,
			isInRoom,
			sendSessionCompleted,
			isPreviewMode,
			exitPreview,
			totalSteps,
		],
	)

	const handleAbandon = useCallback(async () => {
		if (isPreviewMode) {
			exitPreview()
			closeCookingPanel()
			setShowAbandonConfirm(false)
			return
		}
		diag.action('cooking', 'ABANDON_CONFIRMED', {
			sessionId: session?.sessionId,
			currentStep: currentStepNumber,
			completedSteps: session?.completedSteps?.length ?? 0,
		})
		setShowAbandonConfirm(false)
		await abandonCooking()
		closeCookingPanel()
	}, [
		abandonCooking,
		closeCookingPanel,
		session,
		currentStepNumber,
		isPreviewMode,
		exitPreview,
	])

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
	// CRITICAL: Don't show error modal when we're completing the session
	// (session becomes null after completeCooking succeeds, but we need to show celebrations)
	if ((error || !session || !recipe) && !isCompletingSession) {
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
							className='max-w-md rounded-2xl bg-bg-card p-8 text-center shadow-2xl'
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
							className='flex h-full max-h-modal w-full max-w-modal-2xl flex-col overflow-hidden rounded-2xl bg-bg-card shadow-2xl'
						>
							{/* Preview Mode Banner */}
							{isPreviewMode && (
								<div className='flex items-center justify-center gap-2 bg-warning/10 px-4 py-1.5 text-sm dark:bg-warning/20'>
									<Sparkles className='size-3.5 text-warning' />
									<span className='font-medium text-warning'>Preview Mode</span>
									<span className='text-warning/70'>
										— experiencing your recipe as a cook
									</span>
								</div>
							)}

							{/* Offline Mode Banner */}
							<OfflineBanner isOffline={isOffline} variant='subtle' />

							{/* MESSY HANDS mode banner — voice is primary, big dismiss CTA */}
							<AnimatePresence>
								{interactionMode === 'MESSY_HANDS' && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: 'auto', opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										className='flex items-center justify-between overflow-hidden bg-warning/15 px-4 py-2 border-b border-warning/20'
									>
										<div className='flex items-center gap-2 text-sm font-medium text-warning'>
											<span>🙌</span>
											<span>Messy Hands — voice commands active</span>
										</div>
										<motion.button
											onClick={() => setInteractionMode('ACTIVE')}
											whileHover={BUTTON_HOVER}
											whileTap={BUTTON_TAP}
											className='flex items-center gap-1.5 rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning hover:bg-warning/30'
										>
											<Hand className='size-3.5' /> Clean Hands ✓
										</motion.button>
									</motion.div>
								)}
							</AnimatePresence>

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

								{/* AI Assist Button + Mode Indicator */}
								<div className='absolute left-4 top-4 flex items-center gap-2'>
									<motion.button
										onClick={() => setShowAiAssist(true)}
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										className='flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/40'
									>
										<Sparkles className='size-4' /> AI Assist
									</motion.button>
									<ModeIndicatorBadge mode={interactionMode} />
								</div>

								{/* Header buttons group */}
								<div className='absolute right-4 top-4 flex items-center gap-2'>
									{/* Kitchen-Distance Mode Toggle (Wave 2: Kitchen Protocol) */}
									<motion.button
										onClick={() => setKitchenMode(k => !k)}
										whileHover={ICON_BUTTON_HOVER}
										whileTap={ICON_BUTTON_TAP}
										className={cn(
											'grid size-10 place-items-center rounded-full backdrop-blur-sm transition-colors',
											kitchenMode
												? 'bg-white/40 text-white'
												: 'bg-white/20 text-white/70 hover:bg-white/30',
										)}
										title={
											kitchenMode
												? 'Kitchen display: ON (large text)'
												: 'Kitchen display: OFF'
										}
									>
										{kitchenMode ? (
											<ZoomOut className='size-5' />
										) : (
											<ZoomIn className='size-5' />
										)}
									</motion.button>

									{/* Adaptive Instructions Toggle (Wave 2: Kitchen Protocol) */}
									{/* Cycles: Detailed → Standard → Condensed based on user skill */}
									<motion.button
										onClick={cycleInstructionDetail}
										whileHover={ICON_BUTTON_HOVER}
										whileTap={ICON_BUTTON_TAP}
										className={cn(
											'grid size-10 place-items-center rounded-full backdrop-blur-sm transition-colors',
											instructionDetail === 'detailed'
												? 'bg-success/40 text-white'
												: instructionDetail === 'condensed'
													? 'bg-warning/40 text-white'
													: 'bg-white/20 text-white/70 hover:bg-white/30',
										)}
										title={`Instructions: ${instructionDetail === 'detailed' ? 'Detailed (tips shown + read)' : instructionDetail === 'standard' ? 'Standard' : 'Condensed (expert mode)'}`}
									>
										<BookOpen className='size-5' />
									</motion.button>

									{/* Exit Session Button */}
									<motion.button
										onClick={() => setShowAbandonConfirm(true)}
										whileHover={ICON_BUTTON_HOVER}
										whileTap={ICON_BUTTON_TAP}
										className='grid size-10 place-items-center rounded-full bg-error/20 backdrop-blur-sm transition-colors hover:bg-error/40'
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

								{/* XP Badge (hidden in preview — no real XP) */}
								{!isPreviewMode && (
									<XpPreview
										xp={recipe.xpReward ?? 0}
										className='absolute right-4 bottom-4'
									/>
								)}

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

									{/* Co-cooking participants */}
									{isInRoom && roomCode && (
										<RoomParticipantsBar
											participants={participants}
											roomCode={roomCode}
											currentUserId={useAuthStore.getState().user?.userId}
											totalSteps={totalSteps}
										/>
									)}
								</div>
							</div>

							{/* Progress Section */}
							<div className='border-b border-border-subtle bg-bg-elevated px-6 py-4'>
								<div className='mb-3 flex items-center justify-between'>
									<span
										className={cn(
											'font-medium text-text-secondary',
											kitchenMode ? 'text-base' : 'text-sm',
										)}
									>
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
							{/* MONITORING mode: dim content to emphasize timer, but keep interactive */}
							<div
								className={cn(
									'relative flex-1 overflow-hidden transition-opacity duration-500',
									interactionMode === 'MONITORING' && 'opacity-70',
								)}
							>
								{/* PREP mode overlay: show "Ready to cook?" over step 1 */}
								<AnimatePresence>
									{interactionMode === 'PREP' && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.3 }}
											className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-bg-card/95 p-6 backdrop-blur-sm'
										>
											<span className='text-5xl'>📋</span>
											<div className='text-center'>
												<h3 className='text-xl font-bold text-text'>
													Ready to cook?
												</h3>
												<p className='mt-1 text-sm text-text-secondary'>
													Review the ingredients below, then tap when ready.
												</p>
											</div>
											{/* Ingredient preview */}
											{recipe.fullIngredientList &&
												recipe.fullIngredientList.length > 0 && (
													<div className='max-h-48 w-full max-w-sm overflow-y-auto rounded-2xl border border-border-subtle bg-bg-elevated p-4'>
														<p className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted'>
															You&apos;ll need
														</p>
														<ul className='space-y-1'>
															{recipe.fullIngredientList
																.slice(0, 8)
																.map((ing, i) => (
																	<li
																		key={i}
																		className='flex items-center gap-2 text-sm text-text'
																	>
																		<span className='size-1.5 rounded-full bg-brand flex-shrink-0' />
																		<span>
																			{ing.quantity} {ing.unit} {ing.name}
																		</span>
																	</li>
																))}
															{recipe.fullIngredientList.length > 8 && (
																<li className='text-xs text-text-muted'>
																	+{recipe.fullIngredientList.length - 8} more
																	ingredients
																</li>
															)}
														</ul>
													</div>
												)}
											<motion.button
												onClick={() => setInteractionMode('ACTIVE')}
												whileHover={BUTTON_HOVER}
												whileTap={BUTTON_TAP}
												className='rounded-full bg-gradient-hero px-10 py-3 font-bold text-white shadow-lg shadow-brand/30'
											>
												Let&apos;s Cook! 🔥
											</motion.button>
										</motion.div>
									)}
								</AnimatePresence>

								{/* MONITORING mode hero: elevated timer indicator above dimmed content */}
								<AnimatePresence>
									{interactionMode === 'MONITORING' && (
										<motion.div
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											transition={TRANSITION_SPRING}
											className='absolute left-0 right-0 top-0 z-10 mx-4 mt-4 flex items-center justify-between rounded-2xl border border-streak/30 bg-streak/10 px-5 py-3 pointer-events-auto'
										>
											<div className='flex items-center gap-2 text-streak'>
												<Clock className='size-5' />
												<span className='font-semibold'>Monitoring timer…</span>
											</div>
											<motion.button
												onClick={() => setInteractionMode('ACTIVE')}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												className='rounded-full bg-streak/20 px-3 py-1 text-xs font-semibold text-streak hover:bg-streak/30'
											>
												Back to steps
											</motion.button>
										</motion.div>
									)}
								</AnimatePresence>

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
											{/* Step Video (priority over image) */}
											{step.videoUrl ? (
												<motion.div
													initial={{ opacity: 0, scale: 0.95 }}
													animate={{ opacity: 1, scale: 1 }}
													transition={{ delay: 0.1 }}
													className='relative mx-auto mb-6 aspect-video w-full max-w-2xl overflow-hidden rounded-2xl shadow-lg'
												>
													<video
														src={step.videoUrl}
														poster={step.videoThumbnailUrl || undefined}
														controls
														loop
														muted
														playsInline
														className='h-full w-full object-cover'
													/>
												</motion.div>
											) : step.imageUrl ? (
												/* Step Image */
												<motion.div
													initial={{ opacity: 0, scale: 0.95 }}
													animate={{ opacity: 1, scale: 1 }}
													transition={{ delay: 0.1 }}
													className='relative mx-auto mb-6 aspect-video w-full max-w-2xl overflow-hidden rounded-2xl shadow-lg'
												>
													<Image
														src={step.imageUrl}
														alt={step.title ?? `Step ${step.stepNumber}`}
														fill
														className='object-cover'
													/>
												</motion.div>
											) : null}

											{/* Step Title */}
											<motion.h3
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.15 }}
												className={cn(
													'mb-3 text-center font-bold text-text',
													kitchenMode
														? 'text-2xl md:text-4xl'
														: 'text-xl md:text-2xl',
												)}
											>
												Step {step.stepNumber}: {step.title ?? 'Cook'}
											</motion.h3>

											{/* Step Description - Kitchen-distance: 28px+ for readability at arm's length */}
											<motion.p
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 0.2 }}
												className={cn(
													'mx-auto mb-6 max-w-lg text-center leading-relaxed text-text-secondary',
													kitchenMode
														? 'text-2xl md:text-3xl'
														: 'text-lg md:text-xl',
												)}
											>
												{step.description}
											</motion.p>

											{/* Tips — Adaptive: detailed=emphasized, standard=normal, condensed=collapsed */}
											{step.tips && instructionDetail !== 'condensed' && (
												<motion.div
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.25 }}
													className={cn(
														'mx-auto mb-6 flex max-w-md items-start gap-3 rounded-xl p-4',
														instructionDetail === 'detailed'
															? 'border border-bonus/30 bg-bonus/15'
															: 'bg-bonus/10',
														kitchenMode ? 'text-base' : 'text-sm',
													)}
												>
													<span
														className={kitchenMode ? 'text-2xl' : 'text-lg'}
													>
														💡
													</span>
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
														kitchenMode={kitchenMode}
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
												</motion.div>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							{/* Accessibility: aria-live region for step/timer announcements (Wave 2) */}
							<div
								role='status'
								aria-live='assertive'
								aria-atomic='true'
								className='sr-only'
							>
								{liveAnnouncement}
							</div>

							{/* Step Photo Capture — hidden input + floating prompt (Wave 2: Kitchen Protocol) */}
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
								{showPhotoPrompt && !showCompletion && (
									<motion.button
										initial={{ opacity: 0, y: 20, scale: 0.9 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 10, scale: 0.95 }}
										transition={TRANSITION_SPRING}
										onClick={() => {
											stepPhotos.captureForStep(photoStepNumber)
											setShowPhotoPrompt(false)
										}}
										className={cn(
											'mx-auto mb-3 flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-brand transition-colors hover:bg-brand/20',
											kitchenMode ? 'px-6 py-3 text-base' : 'text-sm',
										)}
									>
										<Camera className={kitchenMode ? 'size-5' : 'size-4'} />
										<span>Snap your progress!</span>
										{stepPhotos.totalCount > 0 && (
											<span className='rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white'>
												{stepPhotos.totalCount}
											</span>
										)}
									</motion.button>
								)}
							</AnimatePresence>

							{/* Voice Mode Overlays */}
							<VoiceCommandToast event={voice.lastEvent} />
							<VoiceHelpOverlay
								show={voice.showHelp}
								onClose={() => voice.setShowHelp(false)}
							/>

							{/* Navigation */}
							<div className='flex items-center justify-between border-t border-border-subtle bg-bg-elevated p-4'>
								<motion.button
									onClick={handlePrevStep}
									disabled={currentStepNumber === 1 || isNavigating}
									whileHover={
										currentStepNumber > 1 && !isNavigating
											? BUTTON_HOVER
											: undefined
									}
									whileTap={
										currentStepNumber > 1 && !isNavigating
											? BUTTON_TAP
											: undefined
									}
									className={cn(
										'flex items-center gap-2 rounded-full font-bold transition-all',
										kitchenMode || interactionMode === 'MESSY_HANDS'
											? 'min-h-16 px-8 py-4 text-lg'
											: 'px-6 py-3',
										currentStepNumber === 1 || isNavigating
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

								{/* Voice Mode Button - between nav buttons */}
								<VoiceModeButton voice={voice} />

								{/* Messy Hands toggle (Kitchen Protocol: Task 8) */}
								<motion.button
									onClick={() =>
										setInteractionMode(
											interactionMode === 'MESSY_HANDS'
												? 'ACTIVE'
												: 'MESSY_HANDS',
										)
									}
									whileHover={ICON_BUTTON_HOVER}
									whileTap={ICON_BUTTON_TAP}
									title={
										interactionMode === 'MESSY_HANDS'
											? 'Clean hands — restore touch mode'
											: 'Messy hands — switch to voice-primary mode'
									}
									className={cn(
										'grid place-items-center rounded-full transition-colors',
										kitchenMode ? 'size-14' : 'size-10',
										interactionMode === 'MESSY_HANDS'
											? 'bg-warning/30 text-warning ring-2 ring-warning/50'
											: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text',
									)}
								>
									<Hand className={kitchenMode ? 'size-7' : 'size-5'} />
								</motion.button>

								<motion.button
									onClick={handleNextStep}
									disabled={isNavigating}
									whileHover={isNavigating ? undefined : BUTTON_HOVER}
									whileTap={isNavigating ? undefined : BUTTON_TAP}
									className={cn(
										'flex items-center gap-2 rounded-full bg-gradient-hero font-bold text-white shadow-lg shadow-brand/30 transition-opacity',
										kitchenMode || interactionMode === 'MESSY_HANDS'
											? 'min-h-16 px-10 py-4 text-lg'
											: 'px-8 py-3',
										isNavigating && 'cursor-wait opacity-80',
									)}
									title={
										currentStepNumber === totalSteps
											? 'Complete recipe'
											: 'Next step (→)'
									}
								>
									{isNavigating ? (
										<>
											<Loader2 className='size-5 animate-spin' />
											Processing...
										</>
									) : currentStepNumber === totalSteps ? (
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
							ref={completionTrapRef}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-md'
							role='dialog'
							aria-modal='true'
							aria-labelledby='completion-title'
						>
							<motion.div
								variants={CELEBRATION_MODAL}
								initial='hidden'
								animate='visible'
								exit='exit'
								className='mx-4 max-h-[85vh] max-w-sm overflow-y-auto rounded-2xl bg-bg-card p-8 shadow-2xl'
							>
								<SessionRatingForm
									xpEarned={session?.baseXpAwarded ?? recipe.xpReward ?? 0}
									recipeTitle={recipe.title}
									onSubmit={handleComplete}
									onSkip={() => handleComplete()}
									isSubmitting={isCompletingSession}
								/>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			{/* AI Assist Panel */}
			<AiAssistPanel
				isOpen={showAiAssist}
				onClose={() => setShowAiAssist(false)}
				recipeTitle={recipe?.title ?? 'Recipe'}
				currentStep={step?.description ?? ''}
				stepNumber={currentStepNumber}
			/>

			{/* Abandon Confirmation Modal - Separate Portal (outside main modal container) */}
			<AnimatePresence>
				{showAbandonConfirm && (
					<Portal>
						<motion.div
							ref={abandonTrapRef}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-md'
							role='alertdialog'
							aria-modal='true'
							aria-labelledby='abandon-title'
							aria-describedby='abandon-description'
						>
							<motion.div
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								className='mx-4 max-w-sm rounded-2xl bg-bg-card p-8 text-center shadow-2xl'
							>
								<div className='mx-auto mb-4 grid size-16 place-items-center rounded-full bg-error/10 dark:bg-error/20'>
									<LogOut className='size-8 text-error' />
								</div>
								<h3
									id='abandon-title'
									className='mb-2 text-xl font-bold text-text'
								>
									Abandon Session?
								</h3>
								<p
									id='abandon-description'
									className='mb-6 text-text-secondary'
								>
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
										className='flex-1 rounded-full bg-error px-6 py-3 font-semibold text-white transition-colors hover:bg-error/90'
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
