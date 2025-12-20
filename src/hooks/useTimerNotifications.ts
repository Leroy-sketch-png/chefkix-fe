'use client'

import { useEffect, useRef } from 'react'
import { useCookingStore } from '@/store/cookingStore'
import { toast } from '@/components/ui/toaster'

/**
 * Plays a pleasant chime sound using Web Audio API
 * No audio file required - generates a harmonious notification sound
 *
 * Exported for use in settings "Test Sound" feature
 */
export const playTimerChime = () => {
	if (typeof window === 'undefined' || !window.AudioContext) return

	try {
		const ctx = new (window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext })
				.webkitAudioContext)()
		const now = ctx.currentTime

		// Create a pleasant three-note chime (C5-E5-G5 chord arpeggio)
		const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5

		frequencies.forEach((freq, i) => {
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()

			osc.type = 'sine'
			osc.frequency.value = freq

			// ADSR envelope for smooth sound
			gain.gain.setValueAtTime(0, now + i * 0.15)
			gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05)
			gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.6)

			osc.connect(gain)
			gain.connect(ctx.destination)

			osc.start(now + i * 0.15)
			osc.stop(now + i * 0.15 + 0.7)
		})

		// Clean up context after sound completes
		setTimeout(() => ctx.close(), 2000)
	} catch {
		// Audio failed, silently continue
	}
}

/**
 * useTimerNotifications
 *
 * Subscribes to the cooking store and shows toast notifications
 * when timers complete. Also plays an audio notification.
 *
 * This hook should be mounted in a high-level component that
 * persists across navigation (e.g., MainLayout).
 */
export const useTimerNotifications = () => {
	const { localTimers, recipe, session } = useCookingStore()
	const previousTimers = useRef<Map<number, number>>(new Map())

	// Detect timer completions by comparing previous vs current
	useEffect(() => {
		if (!recipe || !session) {
			previousTimers.current.clear()
			return
		}

		const current = localTimers
		const previous = previousTimers.current

		// Check for timers that were running but are now gone (completed)
		previous.forEach((remaining, stepNumber) => {
			// Timer was running (remaining > 0) and is now removed from map
			if (remaining > 0 && !current.has(stepNumber)) {
				// Timer completed!
				const step = recipe.steps?.[stepNumber - 1]
				const stepTitle = step?.title || `Step ${stepNumber}`

				// Show toast notification
				toast.success('⏰ Timer Complete!', `${stepTitle} is ready`, {
					duration: 8000,
				})

				// Play chime sound
				playTimerChime()

				// Vibrate on mobile if supported
				if (typeof navigator !== 'undefined' && navigator.vibrate) {
					navigator.vibrate([200, 100, 200])
				}
			}
		})

		// Update previous state for next comparison
		const newPrevious = new Map<number, number>()
		current.forEach((timer, stepNumber) => {
			newPrevious.set(stepNumber, timer.remaining)
		})
		previousTimers.current = newPrevious
	}, [localTimers, recipe, session])
}
