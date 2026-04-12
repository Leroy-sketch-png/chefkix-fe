'use client'

import confetti from 'canvas-confetti'

export const triggerConfetti = (options?: confetti.Options) => {
	const defaults: confetti.Options = {
		particleCount: 100,
		spread: 70,
		origin: { y: 0.6 },
		disableForReducedMotion: true,
	}

	confetti({
		...defaults,
		...options,
	})
}

export const triggerSuccessConfetti = () => {
	confetti({
		particleCount: 50,
		angle: 60,
		spread: 55,
		origin: { x: 0 },
		colors: ['#10b981', '#34d399', '#6ee7b7'],
		disableForReducedMotion: true,
	})

	confetti({
		particleCount: 50,
		angle: 120,
		spread: 55,
		origin: { x: 1 },
		colors: ['#10b981', '#34d399', '#6ee7b7'],
		disableForReducedMotion: true,
	})
}

/** Celebration for mutual follow (Instagram model: mutual = friends) */
export const triggerMutualFollowConfetti = () => {
	const count = 150
	const defaults = { origin: { y: 0.7 }, disableForReducedMotion: true as const }

	function fire(particleRatio: number, opts: confetti.Options) {
		confetti({
			...defaults,
			...opts,
			particleCount: Math.floor(count * particleRatio),
		})
	}

	fire(0.25, {
		spread: 26,
		startVelocity: 55,
		colors: ['#ff5a36', '#ff7a56', '#ffb399'], // Brand coral colors
	})

	fire(0.2, {
		spread: 60,
		colors: ['#ff5a36', '#ff7a56', '#ffb399'],
	})

	fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8,
		colors: ['#ff5a36', '#ff7a56', '#ffb399'],
	})
}

/** Subtle confetti for like actions - positioned at button location */
export const triggerLikeConfetti = (element?: HTMLElement) => {
	// Pre-calculate position synchronously
	let origin: { x?: number; y: number }

	if (element) {
		const rect = element.getBoundingClientRect()
		origin = {
			x: (rect.left + rect.width / 2) / window.innerWidth,
			y: (rect.top + rect.height / 2) / window.innerHeight,
		}
	} else {
		// Fallback to center if no element provided
		origin = { y: 0.6 }
	}

	// Fire on next animation frame to avoid blocking UI
	requestAnimationFrame(() => {
		confetti({
			particleCount: 30,
			spread: 40,
			origin,
			colors: ['#ef4444', '#f87171', '#fca5a5'],
			ticks: 100,
			disableForReducedMotion: true,
		})
	})
}

/** Celebration for earning badges/achievements */
export const triggerAchievementConfetti = () => {
	const count = 150
	const defaults = { origin: { y: 0.7 }, disableForReducedMotion: true as const }

	function fire(particleRatio: number, opts: confetti.Options) {
		confetti({
			...defaults,
			...opts,
			particleCount: Math.floor(count * particleRatio),
		})
	}

	fire(0.25, {
		spread: 26,
		startVelocity: 55,
		colors: ['#fbbf24', '#f59e0b', '#d97706'],
	})

	fire(0.2, {
		spread: 60,
		colors: ['#fbbf24', '#f59e0b', '#d97706'],
	})

	fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8,
		colors: ['#fbbf24', '#f59e0b', '#d97706'],
	})
}

/** Epic celebration for recipe completion */
export const triggerRecipeCompleteConfetti = () => {
	const duration = 3000
	const animationEnd = Date.now() + duration
	const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, disableForReducedMotion: true as const }

	function randomInRange(min: number, max: number) {
		return Math.random() * (max - min) + min
	}

	const interval: ReturnType<typeof setInterval> = setInterval(() => {
		const timeLeft = animationEnd - Date.now()

		if (timeLeft <= 0) {
			return clearInterval(interval)
		}

		const particleCount = 50 * (timeLeft / duration)

		confetti({
			...defaults,
			particleCount,
			origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
		})
		confetti({
			...defaults,
			particleCount,
			origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
		})
	}, 250)
}

/** Subtle celebration for saving recipes - positioned at button location */
export const triggerSaveConfetti = (element?: HTMLElement) => {
	// Pre-calculate position synchronously
	let origin: { x?: number; y: number }

	if (element) {
		const rect = element.getBoundingClientRect()
		origin = {
			x: (rect.left + rect.width / 2) / window.innerWidth,
			y: (rect.top + rect.height / 2) / window.innerHeight,
		}
	} else {
		// Fallback to center-ish if no element provided
		origin = { y: 0.7 }
	}

	// Fire on next animation frame to avoid blocking UI
	requestAnimationFrame(() => {
		confetti({
			particleCount: 20,
			spread: 30,
			origin,
			colors: ['#fbbf24', '#f59e0b'],
			ticks: 80,
			disableForReducedMotion: true,
		})
	})
}

/**
 * Progress milestone confetti for CookingPlayer.
 * Triggered every 3 completed steps or at specific milestone steps.
 * Uses a burst from the bottom with fire/cooking colors.
 * @see PLAN-AGENT-BRAVO.md C-FE.5
 */
export const triggerProgressMilestoneConfetti = (stepNumber: number, totalSteps: number) => {
	const isHalfway = stepNumber === Math.floor(totalSteps / 2)
	const isAlmostDone = stepNumber === totalSteps - 1
	
	// Adjust intensity based on milestone significance
	const particleMultiplier = isHalfway ? 1.5 : isAlmostDone ? 1.2 : 1
	const count = Math.floor(60 * particleMultiplier)
	
	const defaults = { origin: { y: 0.9 } }
	
	function fire(particleRatio: number, opts: confetti.Options) {
		confetti({
			...defaults,
			...opts,
			particleCount: Math.floor(count * particleRatio),
			disableForReducedMotion: true,
		})
	}
	
	// Fire/cooking themed colors (orange, red, gold)
	fire(0.3, {
		spread: 40,
		startVelocity: 45,
		colors: ['#ff5a36', '#f97316', '#fbbf24'], // Brand + fire colors
	})
	
	fire(0.25, {
		spread: 60,
		colors: ['#ff5a36', '#f97316', '#fbbf24'],
	})
	
	fire(0.3, {
		spread: 100,
		decay: 0.92,
		scalar: 0.9,
		colors: ['#f97316', '#fbbf24', '#facc15'],
	})
}

/**
 * Check if the current step should trigger milestone confetti.
 * Rules: Every 3 steps, halfway point, or one step before completion.
 */
export const shouldTriggerMilestone = (
	completedSteps: number,
	totalSteps: number,
): boolean => {
	if (completedSteps === 0) return false
	if (totalSteps < 3) return false // Too short for milestones
	
	const halfway = Math.floor(totalSteps / 2)
	const almostDone = totalSteps - 1
	
	// Trigger every 3 completed steps, or at milestone points
	return (
		completedSteps % 3 === 0 ||
		completedSteps === halfway ||
		completedSteps === almostDone
	)
}
