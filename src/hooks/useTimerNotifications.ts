'use client'

import { useEffect, useRef } from 'react'
import { useCookingStore } from '@/store/cookingStore'
import { toast } from 'sonner'
import { playTimerCompleteForStep, isAudioEnabled } from '@/lib/audio'
import { getTextToSpeech, isTTSSupported } from '@/lib/voice/TextToSpeech'
import { showTimerNotification } from '@/lib/pushNotifications'

/**
 * Plays a pleasant chime sound using Web Audio API.
 * Delegates to audio.ts for the actual sound generation.
 * Exported for use in settings "Test Sound" feature.
 */
export const playTimerChime = () => {
	playTimerCompleteForStep(1)
}

// Milestone thresholds in seconds for contextual TTS announcements
const MILESTONES = [300, 180, 60, 30] // 5min, 3min, 1min, 30s

function formatTimeRemaining(seconds: number): string {
	if (seconds >= 60) {
		const mins = Math.floor(seconds / 60)
		return `${mins} minute${mins > 1 ? 's' : ''}`
	}
	return `${seconds} seconds`
}

/**
 * useTimerNotifications
 *
 * Subscribes to the cooking store and shows toast notifications
 * when timers complete. Also plays an audio notification.
 * Wave 2: Contextual TTS announcements at key milestones.
 *
 * This hook should be mounted in a high-level component that
 * persists across navigation (e.g., MainLayout).
 */
export const useTimerNotifications = () => {
	const { localTimers, recipe, session } = useCookingStore()
	const previousTimers = useRef<Map<number, number>>(new Map())
	// Track announced milestones per step: stepNumber -> Set of milestone thresholds already spoken
	const announcedMilestones = useRef<Map<number, Set<number>>>(new Map())

	// Detect timer completions + milestone announcements
	useEffect(() => {
		if (!recipe || !session) {
			previousTimers.current.clear()
			announcedMilestones.current.clear()
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
				toast.success('⏰ Timer Complete!', {
					description: `${stepTitle} is ready`,
					duration: 8000,
				})

				// Play distinct chime for this step (different pitch per step)
				if (isAudioEnabled()) {
					playTimerCompleteForStep(stepNumber)
				}

				// TTS: announce completion
				if (isAudioEnabled() && isTTSSupported()) {
					getTextToSpeech().speak(`${stepTitle} timer is done.`)
				}

				// Vibrate on mobile if supported
				if (typeof navigator !== 'undefined' && navigator.vibrate) {
					navigator.vibrate([200, 100, 200])
				}

				// Browser notification when tab is backgrounded
				if (typeof document !== 'undefined' && document.hidden) {
					showTimerNotification(stepTitle)
				}

				// Clean up milestone tracking for this step
				announcedMilestones.current.delete(stepNumber)
			}
		})

		// Contextual timer announcements at milestones (Wave 2: Kitchen Protocol)
		// Speak "{StepTitle}: {time} remaining" when crossing a threshold
		if (isAudioEnabled() && isTTSSupported()) {
			current.forEach((timer, stepNumber) => {
				const prevRemaining = previous.get(stepNumber)
				if (prevRemaining === undefined) return // Timer just started, skip

				const step = recipe.steps?.[stepNumber - 1]
				const stepTitle = step?.title || `Step ${stepNumber}`

				// Get or create the announced set for this step
				if (!announcedMilestones.current.has(stepNumber)) {
					announcedMilestones.current.set(stepNumber, new Set())
				}
				const announced = announcedMilestones.current.get(stepNumber)!

				for (const milestone of MILESTONES) {
					// Check if we just crossed this milestone (was above, now at or below)
					if (prevRemaining > milestone && timer.remaining <= milestone && !announced.has(milestone)) {
						announced.add(milestone)
						getTextToSpeech().speak(`${stepTitle}: ${formatTimeRemaining(milestone)} remaining.`)
						break // Only one announcement per tick
					}
				}
			})
		}

		// Update previous state for next comparison
		const newPrevious = new Map<number, number>()
		current.forEach((timer, stepNumber) => {
			newPrevious.set(stepNumber, timer.remaining)
		})
		previousTimers.current = newPrevious
	}, [localTimers, recipe, session])
}
