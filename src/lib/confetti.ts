'use client'

import confetti from 'canvas-confetti'

export const triggerConfetti = (options?: confetti.Options) => {
	const defaults: confetti.Options = {
		particleCount: 100,
		spread: 70,
		origin: { y: 0.6 },
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
	})

	confetti({
		particleCount: 50,
		angle: 120,
		spread: 55,
		origin: { x: 1 },
		colors: ['#10b981', '#34d399', '#6ee7b7'],
	})
}

/** Celebration for mutual follow (Instagram model: mutual = friends) */
export const triggerMutualFollowConfetti = () => {
	const count = 150
	const defaults = { origin: { y: 0.7 } }

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
	if (element) {
		const rect = element.getBoundingClientRect()
		const x = (rect.left + rect.width / 2) / window.innerWidth
		const y = (rect.top + rect.height / 2) / window.innerHeight
		confetti({
			particleCount: 30,
			spread: 40,
			origin: { x, y },
			colors: ['#ef4444', '#f87171', '#fca5a5'],
			ticks: 100,
		})
	} else {
		// Fallback to center if no element provided
		confetti({
			particleCount: 30,
			spread: 40,
			origin: { y: 0.6 },
			colors: ['#ef4444', '#f87171', '#fca5a5'],
			ticks: 100,
		})
	}
}

/** Celebration for earning badges/achievements */
export const triggerAchievementConfetti = () => {
	const count = 150
	const defaults = { origin: { y: 0.7 } }

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
	const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

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

/** Subtle celebration for saving recipes */
export const triggerSaveConfetti = () => {
	confetti({
		particleCount: 20,
		spread: 30,
		origin: { y: 0.7 },
		colors: ['#fbbf24', '#f59e0b'],
		ticks: 80,
	})
}
