/**
 * Unified Motion System
 * Single source of truth for all animations - makes the app "breathe with the same lungs"
 */

// Spring physics configuration (haptic-like feedback)
export const SPRING = {
	stiffness: 400,
	damping: 17,
	mass: 0.5,
} as const

export const SPRING_SMOOTH = {
	stiffness: 300,
	damping: 20,
	mass: 0.8,
} as const

export const SPRING_BOUNCY = {
	stiffness: 500,
	damping: 15,
	mass: 0.3,
} as const

// Duration constants (milliseconds)
export const DURATIONS = {
	instant: 75,
	fast: 150,
	normal: 200,
	smooth: 300,
	slow: 500,
	verySlow: 700,
} as const

// Easing functions (cubic-bezier curves as arrays for Framer Motion)
export const EASINGS = {
	bounce: [0.68, -0.55, 0.265, 1.55], // Overshoot effect
	smooth: [0.25, 0.8, 0.25, 1], // Material Design
	sharp: [0.4, 0, 0.2, 1], // Sharp entry
	ease: [0.4, 0, 0.6, 1], // Default ease
} as const

// Framer Motion variants for common patterns
export const FADE_IN_VARIANTS = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
} as const

export const SCALE_IN_VARIANTS = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: { opacity: 1, scale: 1 },
} as const

export const SLIDE_IN_VARIANTS = {
	hidden: { opacity: 0, x: -20 },
	visible: { opacity: 1, x: 0 },
} as const

// Stagger configuration for list animations
export const STAGGER_CONFIG = {
	fast: 0.03,
	normal: 0.05,
	slow: 0.1,
} as const

// Hover/tap states for interactive elements
export const BUTTON_HOVER = {
	scale: 1.05,
	y: -2,
} as const

export const BUTTON_TAP = {
	scale: 0.98,
	y: 0,
} as const

export const CARD_HOVER = {
	scale: 1.02,
	y: -4,
} as const

export const ICON_HOVER = {
	scale: 1.1,
	rotate: 5,
} as const

// Transition presets
export const TRANSITION_SPRING = {
	type: 'spring' as const,
	...SPRING,
}

export const TRANSITION_SMOOTH = {
	type: 'spring' as const,
	...SPRING_SMOOTH,
}

export const TRANSITION_BOUNCY = {
	type: 'spring' as const,
	...SPRING_BOUNCY,
}

// Layout animation config (for shared element transitions)
export const LAYOUT_TRANSITION = {
	type: 'spring' as const,
	stiffness: 350,
	damping: 25,
}

// Page transition variants
export const PAGE_VARIANTS = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
}

export const PAGE_TRANSITION = {
	duration: DURATIONS.smooth / 1000,
	ease: EASINGS.smooth,
}

/**
 * Generate stagger transition for list items
 * @param index - Item index in list
 * @param stagger - Delay between items (use STAGGER_CONFIG)
 */
export const getStaggerTransition = (
	index: number,
	stagger: number = STAGGER_CONFIG.normal,
) => ({
	...TRANSITION_SPRING,
	delay: index * stagger,
})

/**
 * Orchestrated hover variants (parent-child cascade)
 * Use with Framer Motion's whileHover="hover" on parent
 */
export const ORCHESTRATED_HOVER = {
	hover: {
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0,
		},
	},
}

// Common animation exit states
export const EXIT_VARIANTS = {
	fadeOut: { opacity: 0 },
	scaleOut: { opacity: 0, scale: 0.8 },
	slideOut: { opacity: 0, x: -20 },
}
