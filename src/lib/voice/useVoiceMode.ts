/**
 * useVoiceMode — React hook combining VoiceRecognition, CommandParser, and TextToSpeech
 * for hands-free cooking control.
 *
 * Spec: vision_and_spec/22-voice-mode.txt §3-§4
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCookingStore } from '@/store/cookingStore'
import { VoiceRecognition, isVoiceSupported } from './VoiceRecognition'
import {
	parseCommand,
	type ParsedCommand,
	type VoiceAction,
} from './CommandParser'
import { getTextToSpeech, isTTSSupported } from './TextToSpeech'

export interface VoiceEvent {
	type: 'command' | 'unrecognized' | 'error' | 'low-confidence'
	message: string
	icon?: string
	transcript?: string
}

export interface UseVoiceModeReturn {
	/** Whether the browser supports voice recognition */
	isSupported: boolean
	/** Whether currently listening */
	isListening: boolean
	/** Toggle push-to-talk listening on/off */
	toggleListening: () => void
	/** Start always-on continuous listening (auto-restarts on end) */
	startContinuous: () => void
	/** Stop continuous listening */
	stopContinuous: () => void
	/** Whether in continuous listening mode */
	isContinuous: boolean
	/** Latest voice event for toast display */
	lastEvent: VoiceEvent | null
	/** Whether TTS is available */
	hasTTS: boolean
	/** Speak text via TTS */
	speak: (text: string) => Promise<void>
	/** Whether help overlay should show */
	showHelp: boolean
	setShowHelp: (show: boolean) => void
}

export function useVoiceMode(): UseVoiceModeReturn {
	const [isListening, setIsListening] = useState(false)
	const [isContinuous, setIsContinuous] = useState(false)
	const [lastEvent, setLastEvent] = useState<VoiceEvent | null>(null)
	const [showHelp, setShowHelp] = useState(false)
	const recognitionRef = useRef<VoiceRecognition | null>(null)

	// Refs for stable callbacks in continuous mode (avoids stale closures)
	const handleResultRef = useRef<(transcript: string, confidence: number) => void>(() => {})
	const handleErrorRef = useRef<(error: string) => void>(() => {})

	const {
		session,
		recipe,
		navigateToStep,
		completeStep,
		startTimer,
		skipTimer,
		getTimerRemaining,
		interactionMode,
		setInteractionMode,
	} = useCookingStore()

	const supported = isVoiceSupported()
	const hasTTS = isTTSSupported()

	const speak = useCallback(
		async (text: string) => {
			if (!hasTTS) return
			try {
				await getTextToSpeech().speak(text)
			} catch {
				// TTS errors are non-critical
			}
		},
		[hasTTS],
	)

	const formatTimeRemaining = useCallback((seconds: number): string => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		if (mins === 0) return `${secs} seconds remaining`
		if (secs === 0) return `${mins} minute${mins !== 1 ? 's' : ''} remaining`
		return `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} seconds remaining`
	}, [])

	const executeCommand = useCallback(
		async (cmd: ParsedCommand) => {
			if (!session || !recipe) {
				setLastEvent({ type: 'error', message: 'No active cooking session' })
				return
			}
			const currentStep = session.currentStep ?? 1
			const totalSteps = recipe.steps?.length ?? 0
			const stepData = recipe?.steps?.find(s => s.stepNumber === currentStep)

			const action: VoiceAction = cmd.action

			switch (action) {
				case 'NEXT_STEP':
					if (currentStep >= totalSteps) {
						setLastEvent({
							type: 'command',
							message: "You're on the last step!",
							icon: '🏁',
						})
						await speak("You're already on the last step")
					} else {
						await navigateToStep('next')
						setLastEvent({
							type: 'command',
							message: `Moving to Step ${currentStep + 1}`,
							icon: cmd.icon,
						})
					}
					break

				case 'PREV_STEP':
					if (currentStep <= 1) {
						setLastEvent({
							type: 'command',
							message: "You're on the first step!",
							icon: '1️⃣',
						})
						await speak("You're already on the first step")
					} else {
						await navigateToStep('previous')
						setLastEvent({
							type: 'command',
							message: `Going back to Step ${currentStep - 1}`,
							icon: cmd.icon,
						})
					}
					break

				case 'START_TIMER':
					if (stepData?.timerSeconds) {
						await startTimer(currentStep)
						setLastEvent({
							type: 'command',
							message: `Timer started: ${Math.ceil(stepData.timerSeconds / 60)} min`,
							icon: cmd.icon,
						})
					} else {
						setLastEvent({
							type: 'command',
							message: 'This step has no timer',
							icon: '⏱️',
						})
						await speak('This step has no timer')
					}
					break

				case 'STOP_TIMER':
					await skipTimer(currentStep)
					setLastEvent({
						type: 'command',
						message: 'Timer cancelled',
						icon: cmd.icon,
					})
					break

				case 'READ_STEP': {
					const text = stepData?.description || 'No instructions for this step'
					setLastEvent({
						type: 'command',
						message: 'Reading step aloud...',
						icon: cmd.icon,
					})
					await speak(text)
					break
				}

				case 'TIME_LEFT': {
					const remaining = getTimerRemaining(currentStep)
					if (remaining !== null && remaining > 0) {
						const timeText = formatTimeRemaining(remaining)
						setLastEvent({ type: 'command', message: timeText, icon: cmd.icon })
						await speak(timeText)
					} else {
						setLastEvent({
							type: 'command',
							message: 'No active timer',
							icon: '⏰',
						})
						await speak('No timer running for this step')
					}
					break
				}

				case 'COMPLETE_STEP':
					await completeStep(currentStep)
					setLastEvent({
						type: 'command',
						message: `Step ${currentStep} completed!`,
						icon: cmd.icon,
					})
					break

				case 'SHOW_HELP':
					setShowHelp(true)
					setLastEvent({
						type: 'command',
						message: 'Showing voice commands',
						icon: cmd.icon,
					})
					break

				case 'TOGGLE_MESSY_HANDS': {
					const entering = interactionMode !== 'MESSY_HANDS'
					setInteractionMode(entering ? 'MESSY_HANDS' : 'ACTIVE')
					setLastEvent({
						type: 'command',
						message: entering ? 'Messy Hands mode — voice primary' : 'Clean hands — touch restored',
						icon: entering ? '🙌' : '✋',
					})
					if (entering) {
						await speak('Messy hands mode. Voice commands active.')
					} else {
						await speak('Hands free. Touch mode restored.')
					}
					break
				}
			}
		},
		[
			session,
			recipe,
			navigateToStep,
			completeStep,
			startTimer,
			skipTimer,
			getTimerRemaining,
			speak,
			formatTimeRemaining,
			interactionMode,
			setInteractionMode,
		],
	)

	const handleResult = useCallback(
		(transcript: string, confidence: number) => {
			const cmd = parseCommand(transcript, confidence)

			if (cmd) {
				executeCommand(cmd)
			} else if (confidence < 0.6) {
				setLastEvent({
					type: 'low-confidence',
					message: 'Not sure I heard that right. Try again?',
					transcript,
				})
			} else {
				setLastEvent({
					type: 'unrecognized',
					message: "Didn't catch that. Say 'help' for commands.",
					transcript,
				})
			}
		},
		[executeCommand],
	)

	const handleError = useCallback((error: string) => {
		if (error === 'not-allowed') {
			setLastEvent({ type: 'error', message: 'Microphone access denied' })
			setIsListening(false)
			setIsContinuous(false)
		} else {
			setLastEvent({ type: 'error', message: `Voice error: ${error}` })
		}
	}, [])

	// Keep refs updated so long-lived continuous recognition uses latest callbacks
	handleResultRef.current = handleResult
	handleErrorRef.current = handleError

	const toggleListening = useCallback(() => {
		if (!supported) return

		if (isListening) {
			recognitionRef.current?.stop()
			setIsListening(false)
			setIsContinuous(false)
			return
		}

		// Create fresh recognition instance each time for push-to-talk
		const rec = new VoiceRecognition({
			language: 'en-US',
			continuous: false,
			onResult: handleResult,
			onError: handleError,
			onEnd: () => setIsListening(false),
			onListeningChange: setIsListening,
		})

		recognitionRef.current = rec
		rec.start()
	}, [supported, isListening, handleResult, handleError])

	// Continuous listening: always-on voice recognition that auto-restarts
	const startContinuous = useCallback(() => {
		if (!supported || isContinuous) return

		// Stop any existing recognition
		recognitionRef.current?.stop()

		const rec = new VoiceRecognition({
			language: 'en-US',
			continuous: true,
			// Use refs to avoid stale closures — continuous recognition is long-lived
			onResult: (t, c) => handleResultRef.current(t, c),
			onError: (e) => handleErrorRef.current(e),
			onEnd: () => {
				// Only fires when intentionally stopped (continuous auto-restarts otherwise)
				setIsListening(false)
				setIsContinuous(false)
			},
			onListeningChange: setIsListening,
		})

		recognitionRef.current = rec
		rec.start()
		setIsContinuous(true)
	}, [supported, isContinuous])

	const stopContinuous = useCallback(() => {
		recognitionRef.current?.stop()
		setIsContinuous(false)
	}, [])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			recognitionRef.current?.stop()
		}
	}, [])

	return {
		isSupported: supported,
		isListening,
		toggleListening,
		startContinuous,
		stopContinuous,
		isContinuous,
		lastEvent,
		hasTTS,
		speak,
		showHelp,
		setShowHelp,
	}
}
