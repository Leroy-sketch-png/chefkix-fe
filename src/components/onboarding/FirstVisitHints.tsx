'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { TRANSITION_SPRING } from '@/lib/motion'

// ============================================
// STORAGE KEYS
// ============================================

const HINTS_SEEN_KEY = 'chefkix:hints-seen'
const HINTS_DISMISSED_ALL_KEY = 'chefkix:hints-dismissed-all'

// ============================================
// TYPES
// ============================================

export interface HintConfig {
	/** Unique identifier for the hint */
	id: string
	/** Title of the hint */
	title: string
	/** Description/explanation */
	description: string
	/** CSS selector or ref to highlight */
	targetSelector?: string
	/** Position of the hint relative to target */
	position?: 'top' | 'bottom' | 'left' | 'right'
	/** Optional action button */
	action?: {
		label: string
		onClick: () => void
	}
}

interface FirstVisitHintsContextType {
	/** Currently active hint */
	activeHint: HintConfig | null
	/** Show a specific hint */
	showHint: (hint: HintConfig) => void
	/** Dismiss the current hint */
	dismissHint: () => void
	/** Dismiss all hints permanently */
	dismissAllHints: () => void
	/** Check if a hint has been seen */
	hasHintBeenSeen: (hintId: string) => boolean
	/** Mark a hint as seen */
	markHintAsSeen: (hintId: string) => void
	/** Check if user has dismissed all hints */
	hasUserDismissedHints: () => boolean
	/** Reset all hint states (for testing) */
	resetHints: () => void
}

// ============================================
// CONTEXT
// ============================================

const FirstVisitHintsContext = createContext<FirstVisitHintsContextType | null>(null)

// ============================================
// PROVIDER
// ============================================

export function FirstVisitHintsProvider({ children }: { children: ReactNode }) {
	const [activeHint, setActiveHint] = useState<HintConfig | null>(null)
	const [seenHints, setSeenHints] = useState<Set<string>>(new Set())
	const [dismissedAll, setDismissedAll] = useState(false)

	// Load persisted state on mount
	useEffect(() => {
		if (typeof window === 'undefined') return

		const storedSeen = localStorage.getItem(HINTS_SEEN_KEY)
		if (storedSeen) {
			try {
				setSeenHints(new Set(JSON.parse(storedSeen)))
			} catch {
				// Invalid JSON, reset
				localStorage.removeItem(HINTS_SEEN_KEY)
			}
		}

		const storedDismissed = localStorage.getItem(HINTS_DISMISSED_ALL_KEY)
		if (storedDismissed === 'true') {
			setDismissedAll(true)
		}
	}, [])

	// Persist seen hints
	const persistSeenHints = useCallback((hints: Set<string>) => {
		localStorage.setItem(HINTS_SEEN_KEY, JSON.stringify(Array.from(hints)))
	}, [])

	const showHint = useCallback(
		(hint: HintConfig) => {
			// Don't show if user dismissed all hints
			if (dismissedAll) return
			// Don't show if this specific hint was already seen
			if (seenHints.has(hint.id)) return
			setActiveHint(hint)
		},
		[dismissedAll, seenHints],
	)

	const dismissHint = useCallback(() => {
		if (activeHint) {
			const newSeen = new Set(seenHints)
			newSeen.add(activeHint.id)
			setSeenHints(newSeen)
			persistSeenHints(newSeen)
		}
		setActiveHint(null)
	}, [activeHint, seenHints, persistSeenHints])

	const dismissAllHints = useCallback(() => {
		setDismissedAll(true)
		localStorage.setItem(HINTS_DISMISSED_ALL_KEY, 'true')
		setActiveHint(null)
	}, [])

	const hasHintBeenSeen = useCallback(
		(hintId: string) => {
			return seenHints.has(hintId) || dismissedAll
		},
		[seenHints, dismissedAll],
	)

	const markHintAsSeen = useCallback(
		(hintId: string) => {
			const newSeen = new Set(seenHints)
			newSeen.add(hintId)
			setSeenHints(newSeen)
			persistSeenHints(newSeen)
		},
		[seenHints, persistSeenHints],
	)

	const hasUserDismissedHints = useCallback(() => {
		return dismissedAll
	}, [dismissedAll])

	const resetHints = useCallback(() => {
		setSeenHints(new Set())
		setDismissedAll(false)
		setActiveHint(null)
		localStorage.removeItem(HINTS_SEEN_KEY)
		localStorage.removeItem(HINTS_DISMISSED_ALL_KEY)
	}, [])

	return (
		<FirstVisitHintsContext.Provider
			value={{
				activeHint,
				showHint,
				dismissHint,
				dismissAllHints,
				hasHintBeenSeen,
				markHintAsSeen,
				hasUserDismissedHints,
				resetHints,
			}}
		>
			{children}
			<HintOverlay />
		</FirstVisitHintsContext.Provider>
	)
}

// ============================================
// HOOK
// ============================================

export function useFirstVisitHints() {
	const context = useContext(FirstVisitHintsContext)
	if (!context) {
		throw new Error('useFirstVisitHints must be used within FirstVisitHintsProvider')
	}
	return context
}

// ============================================
// HINT OVERLAY COMPONENT
// ============================================

function HintOverlay() {
	const context = useContext(FirstVisitHintsContext)
	if (!context) return null

	const { activeHint, dismissHint, dismissAllHints } = context

	return (
		<AnimatePresence>
			{activeHint && (
				<Portal>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal bg-black/50 backdrop-blur-sm'
						onClick={dismissHint}
					/>

					{/* Hint card */}
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.95 }}
						transition={TRANSITION_SPRING}
						className='fixed left-1/2 top-1/2 z-modal -translate-x-1/2 -translate-y-1/2'
					>
						<div className='w-80 overflow-hidden rounded-2xl border border-brand/20 bg-bg-card shadow-xl'>
							{/* Header */}
							<div className='relative bg-gradient-to-br from-brand/10 to-streak/10 px-5 py-4'>
								<button
									onClick={dismissHint}
									className='absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-bg-elevated/80 text-text-muted transition-colors hover:bg-bg-hover hover:text-text'
									aria-label='Close hint'
								>
									<X className='size-4' />
								</button>

								<div className='flex items-center gap-2'>
									<div className='flex size-8 items-center justify-center rounded-lg bg-brand/20'>
										<Sparkles className='size-4 text-brand' />
									</div>
									<span className='text-xs font-bold uppercase tracking-wider text-brand'>
										Quick Tip
									</span>
								</div>

								<h3 className='mt-2 text-lg font-bold text-text'>{activeHint.title}</h3>
							</div>

							{/* Content */}
							<div className='px-5 py-4'>
								<p className='text-sm leading-relaxed text-text-secondary'>
									{activeHint.description}
								</p>
							</div>

							{/* Footer */}
							<div className='flex items-center justify-between border-t border-border-subtle px-5 py-3'>
								<button
									onClick={dismissAllHints}
									className='text-xs text-text-muted transition-colors hover:text-text-secondary'
								>
									Don&apos;t show tips
								</button>

								{activeHint.action ? (
									<button
										onClick={() => {
											activeHint.action?.onClick()
											dismissHint()
										}}
										className='flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90'
									>
										{activeHint.action.label}
										<ChevronRight className='size-4' />
									</button>
								) : (
									<button
										onClick={dismissHint}
										className='flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90'
									>
										Got it
										<ChevronRight className='size-4' />
									</button>
								)}
							</div>
						</div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}

// ============================================
// PRE-DEFINED HINTS - Complete Onboarding Set
// ============================================

export const FIRST_VISIT_HINTS = {
	// ─────────────────────────────────────────
	// DISCOVERY & NAVIGATION
	// ─────────────────────────────────────────
	EXPLORE_RECIPES: {
		id: 'explore-recipes',
		title: 'Discover Recipes',
		description:
			'Browse thousands of recipes from our community. Filter by cuisine, difficulty, or cooking time to find your perfect dish.',
	},
	SEARCH_BAR: {
		id: 'search-bar',
		title: 'Quick Search',
		description:
			'Looking for something specific? Press "/" or tap the search icon to find recipes, cooks, or posts instantly.',
	},

	// ─────────────────────────────────────────
	// COOK MODE - The Core Feature
	// ─────────────────────────────────────────
	START_COOKING: {
		id: 'start-cooking',
		title: 'Start Your First Cook',
		description:
			'Tap "Cook" on any recipe to enter guided cooking mode. You\'ll get step-by-step instructions with auto-synced timers - perfect for keeping your hands free.',
	},
	COOK_MODE_TIMERS: {
		id: 'cook-mode-timers',
		title: 'Auto Timers',
		description:
			'Each cooking step has its own timer. They start automatically and will alert you when done - even if your screen is off or you switch apps.',
	},
	COOK_MODE_VOICE: {
		id: 'cook-mode-voice',
		title: 'Hands-Free Navigation',
		description:
			'Messy hands? Say "next step" or "previous step" to navigate without touching your device. Enable the microphone in cook mode to try it.',
	},
	COOK_MODE_COMPLETE: {
		id: 'cook-mode-complete',
		title: 'You Did It!',
		description:
			'Every completed cook earns you XP and builds your streak. Snap a photo of your dish to share your creation with the community!',
	},

	// ─────────────────────────────────────────
	// GAMIFICATION - What Makes ChefKix Unique
	// ─────────────────────────────────────────
	EARN_XP: {
		id: 'earn-xp',
		title: 'Earn XP & Level Up',
		description:
			'Complete cooking sessions to earn XP. More complex recipes = more XP. Level up to unlock badges, titles, and show off your cooking journey.',
	},
	STREAKS: {
		id: 'streaks',
		title: 'Build Your Streak',
		description:
			'Cook something every day to build a streak. Longer streaks mean bonus XP multipliers and exclusive streak badges. Don\'t break the chain!',
	},
	LEVELS_BADGES: {
		id: 'levels-badges',
		title: 'Levels & Badges',
		description:
			'As you gain XP, you\'ll level up and earn badges for milestones like "First Recipe", "5-Day Streak", or "Pasta Master". Check your profile to see them all.',
	},
	LEADERBOARD: {
		id: 'leaderboard',
		title: 'Climb the Leaderboard',
		description:
			'See how you rank among other home cooks. The leaderboard resets weekly, so everyone has a chance to shine.',
	},

	// ─────────────────────────────────────────
	// SOCIAL FEATURES
	// ─────────────────────────────────────────
	FOLLOWING: {
		id: 'following',
		title: 'Follow Creators',
		description:
			'Follow chefs whose recipes inspire you. The "Following" tab in your feed shows only content from people you follow.',
	},
	SHARE_CREATIONS: {
		id: 'share-creations',
		title: 'Share Your Creations',
		description:
			'After cooking, snap a photo of your dish and share it as a post. Your followers can like, comment, and save your creations.',
	},
	COMMUNITY: {
		id: 'community',
		title: 'Join the Community',
		description:
			'The Community page is where you\'ll find trending posts, discover new cooks to follow, and see what others are making.',
	},

	// ─────────────────────────────────────────
	// CREATION
	// ─────────────────────────────────────────
	CREATE_RECIPE: {
		id: 'create-recipe',
		title: 'Share Your Recipes',
		description:
			'Got a recipe to share? Tap Create to add your own. You can type it manually or use AI to generate steps from a photo or description.',
	},
	CREATE_POST: {
		id: 'create-post',
		title: 'Share Cooking Moments',
		description:
			'Want to share without a full recipe? Create a post to share photos, tips, or cooking wins with the community.',
	},

	// ─────────────────────────────────────────
	// TOOLS & UTILITIES
	// ─────────────────────────────────────────
	PANTRY: {
		id: 'pantry',
		title: 'Your Virtual Pantry',
		description:
			'Track ingredients you have at home. When you mark items in your pantry, we\'ll suggest recipes you can make right now.',
	},
	SHOPPING_LIST: {
		id: 'shopping-list',
		title: 'Smart Shopping Lists',
		description:
			'Tap "Add to Shopping List" on any recipe to automatically add its ingredients. Lists sync across devices and can be shared with family.',
	},
	CHALLENGES: {
		id: 'challenges',
		title: 'Weekly Challenges',
		description:
			'Take on themed cooking challenges to earn bonus XP and exclusive badges. New challenges drop every week.',
	},

	// ─────────────────────────────────────────
	// DASHBOARD SPECIFIC
	// ─────────────────────────────────────────
	DASHBOARD_FEED: {
		id: 'dashboard-feed',
		title: 'Your Personalized Feed',
		description:
			'This is your home base. We\'ll show you recipes and posts based on your interests, people you follow, and what\'s trending.',
	},
	TONIGHTS_PICK: {
		id: 'tonights-pick',
		title: 'Tonight\'s Pick',
		description:
			'Not sure what to cook? We suggest a recipe each day based on your preferences and what you haven\'t tried yet.',
	},
} as const

// Type for hint IDs
export type HintId = keyof typeof FIRST_VISIT_HINTS

// ============================================
// ONBOARDING SEQUENCE - Order matters!
// ============================================

/**
 * Defines the recommended order for showing hints to new users.
 * Each hint is tied to a page/context where it makes sense to show.
 */
export const ONBOARDING_SEQUENCE: Array<{
	hintId: HintId
	/** Page path pattern where this hint should show */
	pagePath: string
	/** Additional condition function - return true to show */
	condition?: () => boolean
}> = [
	// Phase 1: Dashboard Introduction
	{ hintId: 'DASHBOARD_FEED', pagePath: '/dashboard' },
	{ hintId: 'TONIGHTS_PICK', pagePath: '/dashboard' },
	{ hintId: 'EARN_XP', pagePath: '/dashboard' },

	// Phase 2: Discovery
	{ hintId: 'EXPLORE_RECIPES', pagePath: '/explore' },
	{ hintId: 'SEARCH_BAR', pagePath: '/explore' },

	// Phase 3: First Cook (shown on recipe detail page)
	{ hintId: 'START_COOKING', pagePath: '/recipes/' },

	// Phase 4: During Cook Mode (shown in cook mode)
	{ hintId: 'COOK_MODE_TIMERS', pagePath: '/cook' },
	{ hintId: 'COOK_MODE_VOICE', pagePath: '/cook' },

	// Phase 5: After First Cook
	{ hintId: 'COOK_MODE_COMPLETE', pagePath: '/cook' }, // On completion
	{ hintId: 'STREAKS', pagePath: '/dashboard' }, // After first cook
	{ hintId: 'SHARE_CREATIONS', pagePath: '/dashboard' },

	// Phase 6: Social (shown when user visits these pages)
	{ hintId: 'COMMUNITY', pagePath: '/community' },
	{ hintId: 'FOLLOWING', pagePath: '/community' },

	// Phase 7: Creation
	{ hintId: 'CREATE_RECIPE', pagePath: '/create' },
	{ hintId: 'CREATE_POST', pagePath: '/create' },

	// Phase 8: Tools (shown when user visits)
	{ hintId: 'PANTRY', pagePath: '/pantry' },
	{ hintId: 'SHOPPING_LIST', pagePath: '/shopping-lists' },
	{ hintId: 'CHALLENGES', pagePath: '/challenges' },
	{ hintId: 'LEADERBOARD', pagePath: '/leaderboard' },
]
