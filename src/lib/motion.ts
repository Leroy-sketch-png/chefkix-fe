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

// ============================================
// CELEBRATION ANIMATIONS (Gamification)
// ============================================

// Confetti burst origin points
export const CONFETTI_ORIGINS = {
	center: { x: 0.5, y: 0.5 },
	top: { x: 0.5, y: 0 },
	bottom: { x: 0.5, y: 1 },
} as const

// Level up ring animation
export const LEVEL_UP_RING = {
	initial: { scale: 0.5, opacity: 0 },
	animate: {
		scale: [0.5, 1.2, 1],
		opacity: [0, 1, 1],
		transition: {
			duration: 0.6,
			times: [0, 0.6, 1],
			ease: [0.34, 1.56, 0.64, 1],
		},
	},
}

// Number flip animation (for level numbers)
export const NUMBER_FLIP = {
	exit: { y: -20, opacity: 0, rotateX: -90 },
	enter: {
		y: 0,
		opacity: 1,
		rotateX: 0,
		transition: { type: 'spring', stiffness: 500, damping: 25 },
	},
}

// XP counter animation
export const XP_COUNTER = {
	initial: { scale: 0, opacity: 0 },
	animate: {
		scale: 1,
		opacity: 1,
		transition: {
			type: 'spring',
			stiffness: 400,
			damping: 15,
			delay: 0.2,
		},
	},
}

// Badge unlock animation
export const BADGE_UNLOCK = {
	hidden: { scale: 0, rotate: -180, opacity: 0 },
	visible: {
		scale: 1,
		rotate: 0,
		opacity: 1,
		transition: {
			type: 'spring',
			stiffness: 300,
			damping: 20,
		},
	},
}

// Glow pulse for active elements
export const GLOW_PULSE = {
	animate: {
		boxShadow: [
			'0 0 20px rgba(255, 111, 60, 0.3)',
			'0 0 35px rgba(255, 111, 60, 0.5)',
			'0 0 20px rgba(255, 111, 60, 0.3)',
		],
		transition: {
			duration: 2,
			repeat: Infinity,
			ease: 'easeInOut' as const,
		},
	},
}

// Streak flame animation
export const STREAK_FLAME = {
	animate: {
		y: [0, -3, 0],
		scale: [1, 1.1, 1],
		transition: {
			duration: 0.8,
			repeat: Infinity,
			ease: 'easeInOut',
		},
	},
}

// Timer urgent pulse
export const TIMER_URGENT = {
	animate: {
		scale: [1, 1.05, 1],
		transition: {
			duration: 0.5,
			repeat: Infinity,
			ease: 'easeInOut' as const,
		},
	},
}

// Progress bar fill animation
export const PROGRESS_FILL = {
	initial: { scaleX: 0, originX: 0 },
	animate: (width: number) => ({
		scaleX: width / 100,
		transition: {
			type: 'spring',
			stiffness: 100,
			damping: 20,
			delay: 0.3,
		},
	}),
}

// Celebration modal entrance
export const CELEBRATION_MODAL = {
	hidden: { scale: 0.5, opacity: 0, y: 50 },
	visible: {
		scale: 1,
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring' as const,
			stiffness: 400,
			damping: 25,
		},
	},
	exit: {
		scale: 0.9,
		opacity: 0,
		y: -20,
		transition: { duration: 0.2 },
	},
}

// Floating particles for celebrations
export const PARTICLE_FLOAT = {
	initial: { y: 0, opacity: 1, scale: 1 },
	animate: {
		y: -30,
		opacity: 0,
		scale: 0.5,
		transition: {
			duration: 1.5,
			ease: 'easeOut',
		},
	},
}

// Crown bounce for #1 position
export const CROWN_BOUNCE = {
	animate: {
		y: [0, -5, 0],
		transition: {
			duration: 1,
			repeat: Infinity,
			ease: 'easeInOut',
		},
	},
}

// Podium rise animation
export const PODIUM_RISE = {
	hidden: { y: 50, opacity: 0 },
	visible: (delay: number) => ({
		y: 0,
		opacity: 1,
		transition: {
			type: 'spring',
			stiffness: 300,
			damping: 25,
			delay,
		},
	}),
}

// Rank change indicator
export const RANK_CHANGE = {
	up: {
		initial: { y: 10, opacity: 0 },
		animate: { y: 0, opacity: 1 },
	},
	down: {
		initial: { y: -10, opacity: 0 },
		animate: { y: 0, opacity: 1 },
	},
}

// Session step progress dots
export const STEP_DOT = {
	inactive: { scale: 1, backgroundColor: 'var(--border-color)' },
	active: {
		scale: 1.2,
		backgroundColor: 'var(--color-brand)',
		transition: { type: 'spring' as const, stiffness: 500, damping: 25 },
	},
	completed: {
		scale: 1,
		backgroundColor: 'var(--color-success)',
	},
}

// AI Assistant floating button
export const AI_BUTTON_PULSE = {
	animate: {
		scale: [1, 1.05, 1],
		boxShadow: [
			'0 0 0 0 rgba(99, 102, 241, 0.4)',
			'0 0 0 10px rgba(99, 102, 241, 0)',
			'0 0 0 0 rgba(99, 102, 241, 0)',
		],
		transition: {
			duration: 2,
			repeat: Infinity,
			ease: 'easeOut' as const,
		},
	},
}

// Overlay backdrop animation
export const OVERLAY_BACKDROP = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.2 } },
	exit: { opacity: 0, transition: { duration: 0.15 } },
}

// ============================================
// STAGGER ANIMATION VARIANTS
// ============================================

// Stagger container for list animations
export const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.1,
		},
	},
}

// Stagger item variants
export const staggerItem = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: TRANSITION_SPRING,
	},
}

// Fade in up animation
export const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: TRANSITION_SPRING,
	},
}

// Scale in animation
export const scaleIn = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: TRANSITION_SPRING,
	},
}

// ============================================
// CELEBRATION ANIMATION VARIANTS (Gamification)
// ============================================

// XP counter variants for completion screens
export const XP_COUNTER_VARIANTS = {
	hidden: { scale: 0, opacity: 0, y: 20 },
	visible: {
		scale: 1,
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring' as const,
			stiffness: 400,
			damping: 15,
			delay: 0.2,
		},
	},
}

// Badge reveal animation
export const BADGE_REVEAL_VARIANTS = {
	hidden: { scale: 0, rotate: -180, opacity: 0 },
	visible: {
		scale: 1,
		rotate: 0,
		opacity: 1,
		transition: {
			type: 'spring' as const,
			stiffness: 300,
			damping: 20,
			delay: 0.3,
		},
	},
}

// Confetti burst animation variants
export const CONFETTI_BURST_VARIANTS = {
	initial: { scale: 0, opacity: 0 },
	animate: {
		scale: [0, 1.2, 1],
		opacity: [0, 1, 1],
		transition: {
			duration: 0.5,
			times: [0, 0.6, 1],
		},
	},
}

// Confetti burst (alias)
export const CONFETTI_BURST = CONFETTI_BURST_VARIANTS

// Level up animation variants
export const LEVEL_UP_VARIANTS = {
	hidden: { scale: 0.5, opacity: 0, y: 50 },
	visible: {
		scale: 1,
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring' as const,
			stiffness: 400,
			damping: 20,
		},
	},
	exit: {
		scale: 0.9,
		opacity: 0,
		y: -30,
		transition: { duration: 0.3 },
	},
}
