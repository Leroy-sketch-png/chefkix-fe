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

// ============================================
// CELEBRATION SOUNDS
// ============================================

/**
 * Play a triumphant celebration sound for cooking completion
 * Ascending major chord arpeggio with a flourish - sounds like "achievement unlocked"
 */
export function playCelebrationSound(): void {
	if (!isAudioEnabled()) return
	const ctx = getAudioContext()
	if (!ctx) return

	const now = ctx.currentTime

	// C major chord arpeggio ascending (C4 → E4 → G4 → C5)
	// Then a final sustained high C5 with vibrato
	const notes = [
		{ freq: 261.63, time: 0, duration: 0.12 }, // C4
		{ freq: 329.63, time: 0.1, duration: 0.12 }, // E4
		{ freq: 392.0, time: 0.2, duration: 0.12 }, // G4
		{ freq: 523.25, time: 0.3, duration: 0.4 }, // C5 (sustained)
	]

	notes.forEach(({ freq, time, duration }) => {
		const oscillator = ctx.createOscillator()
		const gainNode = ctx.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(ctx.destination)

		oscillator.type = 'sine'
		oscillator.frequency.setValueAtTime(freq, now + time)

		// Envelope
		const startTime = now + time
		gainNode.gain.setValueAtTime(0, startTime)
		gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02)
		gainNode.gain.setValueAtTime(0.2, startTime + duration * 0.8)
		gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

		oscillator.start(startTime)
		oscillator.stop(startTime + duration)
	})
}

/**
 * Play a majestic level-up fanfare
 * Triumphant brass-like sound with harmonic overtones
 */
export function playLevelUpSound(): void {
	if (!isAudioEnabled()) return
	const ctx = getAudioContext()
	if (!ctx) return

	const now = ctx.currentTime

	// Fanfare: G4 → C5 → E5 → G5 with harmonics
	const fanfare = [
		{ freq: 392.0, time: 0, duration: 0.2 }, // G4
		{ freq: 523.25, time: 0.18, duration: 0.2 }, // C5
		{ freq: 659.25, time: 0.36, duration: 0.25 }, // E5
		{ freq: 783.99, time: 0.56, duration: 0.5 }, // G5 (sustained)
	]

	fanfare.forEach(({ freq, time, duration }) => {
		// Main tone
		const osc1 = ctx.createOscillator()
		const gain1 = ctx.createGain()
		osc1.connect(gain1)
		gain1.connect(ctx.destination)
		osc1.type = 'triangle' // Warmer, brass-like
		osc1.frequency.setValueAtTime(freq, now + time)

		// Add harmonic overtone for richness
		const osc2 = ctx.createOscillator()
		const gain2 = ctx.createGain()
		osc2.connect(gain2)
		gain2.connect(ctx.destination)
		osc2.type = 'sine'
		osc2.frequency.setValueAtTime(freq * 2, now + time) // Octave up

		const startTime = now + time

		// Main tone envelope
		gain1.gain.setValueAtTime(0, startTime)
		gain1.gain.linearRampToValueAtTime(0.3, startTime + 0.03)
		gain1.gain.setValueAtTime(0.25, startTime + duration * 0.7)
		gain1.gain.linearRampToValueAtTime(0, startTime + duration)

		// Harmonic envelope (quieter)
		gain2.gain.setValueAtTime(0, startTime)
		gain2.gain.linearRampToValueAtTime(0.1, startTime + 0.03)
		gain2.gain.linearRampToValueAtTime(0, startTime + duration)

		osc1.start(startTime)
		osc1.stop(startTime + duration)
		osc2.start(startTime)
		osc2.stop(startTime + duration)
	})
}

/**
 * Play a quick XP reward sound
 * Short, satisfying "ping" for immediate feedback
 */
export function playXpSound(): void {
	if (!isAudioEnabled()) return
	const ctx = getAudioContext()
	if (!ctx) return

	const now = ctx.currentTime
	const oscillator = ctx.createOscillator()
	const gainNode = ctx.createGain()

	oscillator.connect(gainNode)
	gainNode.connect(ctx.destination)

	// Quick ascending glissando
	oscillator.type = 'sine'
	oscillator.frequency.setValueAtTime(600, now)
	oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1)

	gainNode.gain.setValueAtTime(0, now)
	gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02)
	gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

	oscillator.start(now)
	oscillator.stop(now + 0.15)
}

/**
 * Play a badge/achievement unlock sound
 * Magical "sparkle" sound with harmonics
 */
export function playAchievementSound(): void {
	if (!isAudioEnabled()) return
	const ctx = getAudioContext()
	if (!ctx) return

	const now = ctx.currentTime

	// Create a sparkle effect with multiple quick notes
	const sparkles = [
		{ freq: 1047, time: 0, duration: 0.08 }, // C6
		{ freq: 1319, time: 0.05, duration: 0.08 }, // E6
		{ freq: 1568, time: 0.1, duration: 0.08 }, // G6
		{ freq: 2093, time: 0.15, duration: 0.2 }, // C7
	]

	sparkles.forEach(({ freq, time, duration }) => {
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()

		osc.connect(gain)
		gain.connect(ctx.destination)

		osc.type = 'sine'
		osc.frequency.setValueAtTime(freq, now + time)

		const startTime = now + time
		gain.gain.setValueAtTime(0, startTime)
		gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01)
		gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

		osc.start(startTime)
		osc.stop(startTime + duration)
	})
}
