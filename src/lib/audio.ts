/**
 * Audio utilities for cooking timers and notifications
 * Uses Web Audio API to generate sounds programmatically (no external files needed)
 */

let audioContext: AudioContext | null = null

/**
 * Get or create the AudioContext (lazy initialization)
 * Must be called after user interaction due to browser autoplay policies
 */
function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null

	if (!audioContext) {
		try {
			audioContext = new (window.AudioContext ||
				(window as typeof window & { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext)()
		} catch (e) {
			console.warn('Web Audio API not supported:', e)
			return null
		}
	}

	// Resume if suspended (happens after page load before user interaction)
	if (audioContext.state === 'suspended') {
		audioContext.resume()
	}

	return audioContext
}

/**
 * Play a pleasant "timer complete" chime
 * Three ascending notes that sound like a kitchen timer
 */
export function playTimerCompleteSound(): void {
	const ctx = getAudioContext()
	if (!ctx) return

	const now = ctx.currentTime

	// Three ascending notes (C5, E5, G5) - a major chord arpeggio
	const frequencies = [523.25, 659.25, 783.99]
	const duration = 0.15
	const gap = 0.1

	frequencies.forEach((freq, i) => {
		const oscillator = ctx.createOscillator()
		const gainNode = ctx.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(ctx.destination)

		oscillator.type = 'sine'
		oscillator.frequency.setValueAtTime(freq, now + i * (duration + gap))

		// Envelope: quick attack, sustain, quick release
		const startTime = now + i * (duration + gap)
		gainNode.gain.setValueAtTime(0, startTime)
		gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02) // Attack
		gainNode.gain.linearRampToValueAtTime(0.25, startTime + duration - 0.05) // Sustain
		gainNode.gain.linearRampToValueAtTime(0, startTime + duration) // Release

		oscillator.start(startTime)
		oscillator.stop(startTime + duration)
	})
}

/**
 * Play an urgent "timer almost done" beep
 * Single short beep for 30-second warning
 */
export function playTimerUrgentSound(): void {
	const ctx = getAudioContext()
	if (!ctx) return

	const now = ctx.currentTime
	const oscillator = ctx.createOscillator()
	const gainNode = ctx.createGain()

	oscillator.connect(gainNode)
	gainNode.connect(ctx.destination)

	oscillator.type = 'sine'
	oscillator.frequency.setValueAtTime(880, now) // A5 - higher pitch for urgency

	gainNode.gain.setValueAtTime(0, now)
	gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01)
	gainNode.gain.linearRampToValueAtTime(0, now + 0.1)

	oscillator.start(now)
	oscillator.stop(now + 0.1)
}

/**
 * Trigger device vibration if supported
 * @param pattern - Vibration pattern in ms [vibrate, pause, vibrate, ...]
 */
export function vibrate(pattern: number | number[] = [200, 100, 200]): void {
	if (typeof navigator !== 'undefined' && navigator.vibrate) {
		try {
			navigator.vibrate(pattern)
		} catch (e) {
			// Vibration not supported or blocked
		}
	}
}

/**
 * Play timer complete notification with sound + vibration
 */
export function notifyTimerComplete(): void {
	playTimerCompleteSound()
	vibrate([200, 100, 200, 100, 300]) // SOS-like pattern
}

/**
 * Play urgent warning (30 seconds remaining)
 */
export function notifyTimerUrgent(): void {
	playTimerUrgentSound()
	vibrate(100)
}

/**
 * Check if audio is enabled (user preference)
 */
export function isAudioEnabled(): boolean {
	if (typeof localStorage === 'undefined') return true
	return localStorage.getItem('chefkix-audio-enabled') !== 'false'
}

/**
 * Toggle audio enabled state
 */
export function setAudioEnabled(enabled: boolean): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('chefkix-audio-enabled', String(enabled))
	}
}
