'use client'

import { useEffect, useRef, useCallback } from 'react'
import { logDevError } from '@/lib/dev-log'

interface UseClapDetectionOptions {
	/** Whether clap detection is active */
	enabled: boolean
	/** Callback when double-clap is detected */
	onDoubleclap: () => void
	/** Amplitude threshold (0-255) to register as a "clap" impulse. Default: 180 */
	threshold?: number
	/** Max time between two claps in ms. Default: 500 */
	maxGap?: number
	/** Min time between two claps to avoid echo. Default: 100 */
	minGap?: number
}

/**
 * useClapDetection — Detects double-clap patterns via microphone.
 *
 * Uses Web Audio AnalyserNode to monitor ambient amplitude.
 * Privacy-safe: only analyzes volume levels, does NOT record audio.
 * The microphone stream is amplitude-only (no speech recognition).
 *
 * Pattern: Two sharp amplitude spikes within 100-500ms window.
 *
 * Wave 2: Kitchen Protocol — hands-free wake for voice assistant.
 */
export function useClapDetection({
	enabled,
	onDoubleclap,
	threshold = 180,
	maxGap = 500,
	minGap = 100,
}: UseClapDetectionOptions) {
	const audioContextRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const rafRef = useRef<number>(0)
	const lastClapRef = useRef<number>(0)
	const isSpikeRef = useRef(false)
	const onDoubleclapRef = useRef(onDoubleclap)
	const lastCheckRef = useRef<number>(0) // Throttle: ~15fps is enough for amplitude analysis

	// Keep callback ref fresh to avoid stale closures
	useEffect(() => {
		onDoubleclapRef.current = onDoubleclap
	}, [onDoubleclap])

	const cleanup = useCallback(() => {
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current)
			rafRef.current = 0
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(t => t.stop())
			streamRef.current = null
		}
		if (audioContextRef.current) {
			audioContextRef.current
				.close()
				.catch(err => logDevError('Failed to close AudioContext:', err))
			audioContextRef.current = null
		}
		analyserRef.current = null
	}, [])

	useEffect(() => {
		if (!enabled) {
			cleanup()
			return
		}

		// Check for Web Audio + getUserMedia support
		if (
			typeof window === 'undefined' ||
			!navigator.mediaDevices?.getUserMedia
		) {
			return
		}

		let mounted = true

		const start = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: { echoCancellation: true, noiseSuppression: true },
					video: false,
				})

				if (!mounted) {
					stream.getTracks().forEach(t => t.stop())
					return
				}

				streamRef.current = stream

				const ctx = new AudioContext()
				audioContextRef.current = ctx

				const source = ctx.createMediaStreamSource(stream)
				const analyser = ctx.createAnalyser()
				analyser.fftSize = 256
				analyser.smoothingTimeConstant = 0.3
				source.connect(analyser)
				analyserRef.current = analyser

				const dataArray = new Uint8Array(analyser.frequencyBinCount)

				const detect = () => {
					if (!mounted || !analyserRef.current) return

					// Throttle to ~15fps — amplitude detection doesn't need 60fps
					const checkNow = performance.now()
					if (checkNow - lastCheckRef.current < 67) {
						rafRef.current = requestAnimationFrame(detect)
						return
					}
					lastCheckRef.current = checkNow

					analyserRef.current.getByteFrequencyData(dataArray)

					// Get peak amplitude from frequency data
					let peak = 0
					for (let i = 0; i < dataArray.length; i++) {
						if (dataArray[i] > peak) peak = dataArray[i]
					}

					const now = Date.now()
					const isLoud = peak >= threshold

					if (isLoud && !isSpikeRef.current) {
						// Rising edge — new spike detected
						isSpikeRef.current = true
						const timeSinceLast = now - lastClapRef.current

						if (timeSinceLast >= minGap && timeSinceLast <= maxGap) {
							// Double-clap detected!
							lastClapRef.current = 0 // Reset to prevent triple-trigger
							onDoubleclapRef.current()
						} else {
							// First clap
							lastClapRef.current = now
						}
					} else if (!isLoud) {
						// Amplitude dropped — reset spike flag
						isSpikeRef.current = false
					}

					rafRef.current = requestAnimationFrame(detect)
				}

				rafRef.current = requestAnimationFrame(detect)
			} catch {
				// ignored: media API non-critical
			}
		}

		start()

		return () => {
			mounted = false
			cleanup()
		}
	}, [enabled, threshold, maxGap, minGap, cleanup])
}
