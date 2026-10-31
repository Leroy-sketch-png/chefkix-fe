'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
	DEFAULT_WAKE_WORD,
	extractWakeWordCommand,
	getKitchenAudioCoordinator,
	getTextToSpeech,
	isTTSSupported,
	VoiceRecognition,
	isVoiceSupported,
} from '@/lib/voice'
import { orchestrateVoiceCopilot } from '../services/voiceCopilotService'
import type { VoiceCopilotContext, VoiceCopilotResponse } from '../types'

interface UseVoiceVisionCopilotOptions {
	captureFrame?: () => Promise<string | undefined>
	context?: VoiceCopilotContext
}

export function useVoiceVisionCopilot({
	captureFrame,
	context,
}: UseVoiceVisionCopilotOptions = {}) {
	const [isListening, setIsListening] = useState(false)
	const [isArmed, setIsArmed] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [lastTranscript, setLastTranscript] = useState('')
	const [lastMessage, setLastMessage] = useState('')
	const [response, setResponse] = useState<VoiceCopilotResponse | null>(null)
	const recognitionRef = useRef<VoiceRecognition | null>(null)
	const captureFrameRef = useRef(captureFrame)
	const contextRef = useRef(context)
	const armTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		captureFrameRef.current = captureFrame
		contextRef.current = context
	}, [captureFrame, context])

	const clearArm = useCallback(() => {
		if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current)
		armTimeoutRef.current = null
		setIsArmed(false)
	}, [])

	const speak = useCallback(async (text: string) => {
		if (!isTTSSupported()) return
		try {
			await getTextToSpeech().speak(text, {
				channel: 'user-request',
				dedupeKey: 'voice-copilot-response',
				interruption: 'interrupt',
			})
		} catch {
			// Speech failure should not hide the visual copilot response.
		}
	}, [])

	const handleCommand = useCallback(
		async (command: string) => {
			setIsProcessing(true)
			setLastTranscript(command)
			const frameDataUrl = await captureFrameRef.current?.()
			const nextResponse = await orchestrateVoiceCopilot({
				command,
				frameDataUrl,
				context: contextRef.current,
			})
			setResponse(nextResponse)
			setLastMessage(nextResponse.answer)
			await speak(nextResponse.speechText)
			setIsProcessing(false)
		},
		[speak],
	)

	const handleResult = useCallback(
		(transcript: string, confidence: number) => {
			if (confidence < 0.6) return
			const match = extractWakeWordCommand(transcript, DEFAULT_WAKE_WORD)
			if (match.heardWakeWord && match.command) {
				clearArm()
				void handleCommand(match.command)
				return
			}
			if (match.heardWakeWord) {
				setIsArmed(true)
				setLastMessage(
					`I'm listening — say your kitchen question after ${DEFAULT_WAKE_WORD}.`,
				)
				if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current)
				armTimeoutRef.current = setTimeout(clearArm, 8000)
				return
			}
			if (isArmed) {
				clearArm()
				void handleCommand(transcript.trim())
			}
		},
		[clearArm, handleCommand, isArmed],
	)

	const start = useCallback(() => {
		if (!isVoiceSupported() || isListening) return
		if (!getKitchenAudioCoordinator().acquireMicrophone('voice')) {
			setLastMessage('The microphone is busy with another kitchen input.')
			return
		}

		const recognition = new VoiceRecognition({
			language: 'en-US',
			continuous: true,
			onResult: handleResult,
			onError: error => {
				if (error === 'not-allowed') {
					setLastMessage('Microphone access was denied.')
				} else {
					setLastMessage(`Voice error: ${error}`)
				}
			},
			onEnd: () => {
				getKitchenAudioCoordinator().releaseMicrophone('voice')
				setIsListening(false)
				clearArm()
			},
			onListeningChange: setIsListening,
		})

		recognitionRef.current = recognition
		if (!recognition.start()) {
			getKitchenAudioCoordinator().releaseMicrophone('voice')
			setLastMessage('Voice recognition could not start.')
		}
	}, [clearArm, handleResult, isListening])

	const stop = useCallback(() => {
		recognitionRef.current?.stop()
		getKitchenAudioCoordinator().releaseMicrophone('voice')
		setIsListening(false)
		clearArm()
	}, [clearArm])

	useEffect(() => stop, [stop])

	return {
		isSupported: isVoiceSupported(),
		isListening,
		isArmed,
		isProcessing,
		lastTranscript,
		lastMessage,
		response,
		start,
		stop,
	}
}
