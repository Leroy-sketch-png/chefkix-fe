'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
	useFirstVisitHints,
	FIRST_VISIT_HINTS,
	ONBOARDING_SEQUENCE,
	HintId,
} from '@/components/onboarding/FirstVisitHints'
import { useAuth } from '@/hooks/useAuth'

// ============================================
// STORAGE KEYS
// ============================================

const ONBOARDING_PROGRESS_KEY = 'chefkix:onboarding-progress'

// ============================================
// TYPES
// ============================================

interface OnboardingProgress {
	/** Index of next hint to show in ONBOARDING_SEQUENCE */
	currentIndex: number
	/** Hints that have been shown (for recovery) */
	shownHints: HintId[]
	/** Timestamp of when onboarding started */
	startedAt: string
	/** Whether user has completed the core onboarding flow */
	coreCompleted: boolean
}

// Core hints that define "onboarding complete" - up to first cook explanation
const CORE_HINT_COUNT = 6 // DASHBOARD_FEED through START_COOKING

// ============================================
// HELPER: Load/Save Progress
// ============================================

function loadProgress(): OnboardingProgress {
	if (typeof window === 'undefined') {
		return {
			currentIndex: 0,
			shownHints: [],
			startedAt: new Date().toISOString(),
			coreCompleted: false,
		}
	}

	try {
		const stored = localStorage.getItem(ONBOARDING_PROGRESS_KEY)
		if (stored) {
			return JSON.parse(stored)
		}
	} catch {
		// Invalid JSON, reset
	}

	return {
		currentIndex: 0,
		shownHints: [],
		startedAt: new Date().toISOString(),
		coreCompleted: false,
	}
}

function saveProgress(progress: OnboardingProgress): void {
	if (typeof window === 'undefined') return
	localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(progress))
}

// ============================================
// MAIN HOOK
// ============================================

/**
 * useOnboardingOrchestrator
 *
 * Orchestrates the onboarding hint flow across the app.
 * Automatically shows contextual hints based on current page and user progress.
 *
 * USAGE:
 * 1. Call this hook in each main page component
 * 2. Optionally pass a trigger for delayed/conditional hints
 *
 * The orchestrator:
 * - Tracks user progress through ONBOARDING_SEQUENCE
 * - Shows at most ONE hint per page visit (not overwhelming)
 * - Respects user dismissal choices
 * - Maintains progress across sessions
 */
export function useOnboardingOrchestrator(options?: {
	/** Delay before showing hint (ms). Default: 800 */
	delay?: number
	/** Additional condition that must be true to show hint */
	condition?: boolean
	/** Specific hint to show (overrides sequence) */
	forceHint?: HintId
	/** Disable automatic hints (for manual control) */
	disabled?: boolean
}) {
	const { delay = 800, condition = true, forceHint, disabled = false } = options ?? {}

	const pathname = usePathname()
	const { showHint, hasHintBeenSeen, hasUserDismissedHints } = useFirstVisitHints()
	const { isAuthenticated, isHydrated } = useAuth()
	const hasShownRef = useRef(false)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Reset "hasShown" flag when pathname changes
	useEffect(() => {
		hasShownRef.current = false
	}, [pathname])

	/**
	 * Shows a specific hint by ID
	 */
	const triggerHint = useCallback(
		(hintId: HintId) => {
			const hint = FIRST_VISIT_HINTS[hintId]
			if (hint && !hasHintBeenSeen(hint.id)) {
				showHint(hint)

				// Update progress
				const progress = loadProgress()
				if (!progress.shownHints.includes(hintId)) {
					progress.shownHints.push(hintId)
					if (progress.shownHints.length >= CORE_HINT_COUNT) {
						progress.coreCompleted = true
					}
					saveProgress(progress)
				}
			}
		},
		[showHint, hasHintBeenSeen],
	)

	/**
	 * Gets the next hint for the current page based on sequence
	 */
	const getNextHintForPage = useCallback((): HintId | null => {
		// Find all hints applicable to current path
		const applicableHints = ONBOARDING_SEQUENCE.filter(item => {
			// Match path patterns (e.g., '/recipes/' matches '/recipes/abc')
			if (item.pagePath.endsWith('/')) {
				return pathname.startsWith(item.pagePath)
			}
			return pathname === item.pagePath
		})

		// Find the first unseen hint
		for (const item of applicableHints) {
			const hint = FIRST_VISIT_HINTS[item.hintId]
			if (hint && !hasHintBeenSeen(hint.id)) {
				// Check additional condition if provided
				if (item.condition && !item.condition()) {
					continue
				}
				return item.hintId
			}
		}

		return null
	}, [pathname, hasHintBeenSeen])

	// Main effect: Show hint on page load
	useEffect(() => {
		// Don't run on server
		if (typeof window === 'undefined') return

		// Don't run if disabled
		if (disabled) return

		// Don't run if not authenticated (hints are for logged-in users)
		if (!isHydrated || !isAuthenticated) return

		// Don't run if user has dismissed all hints
		if (hasUserDismissedHints()) return

		// Don't run if additional condition is false
		if (!condition) return

		// Don't show multiple hints per page visit
		if (hasShownRef.current) return

		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		timeoutRef.current = setTimeout(() => {
			// Determine which hint to show
			const hintId = forceHint ?? getNextHintForPage()

			if (hintId) {
				const hint = FIRST_VISIT_HINTS[hintId]
				if (hint && !hasHintBeenSeen(hint.id)) {
					hasShownRef.current = true
					triggerHint(hintId)
				}
			}
		}, delay)

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [
		pathname,
		delay,
		condition,
		forceHint,
		disabled,
		isAuthenticated,
		isHydrated,
		hasUserDismissedHints,
		hasHintBeenSeen,
		getNextHintForPage,
		triggerHint,
	])

	return {
		/** Manually trigger a specific hint */
		triggerHint,
		/** Get the next applicable hint for current page */
		getNextHintForPage,
		/** Check if core onboarding is complete */
		isCoreOnboardingComplete: () => loadProgress().coreCompleted,
		/** Reset onboarding progress (for testing) */
		resetProgress: () => {
			if (typeof window === 'undefined') return
			localStorage.removeItem(ONBOARDING_PROGRESS_KEY)
		},
	}
}

// ============================================
// SPECIALIZED HOOKS FOR SPECIFIC CONTEXTS
// ============================================

/**
 * Use in cook mode to trigger cook-specific hints at the right moments
 */
export function useCookModeHints() {
	const { triggerHint } = useOnboardingOrchestrator({ disabled: true })

	return {
		/** Call when cook mode starts */
		onCookStart: () => triggerHint('COOK_MODE_TIMERS'),
		/** Call after a few steps to introduce voice */
		onShowVoiceHint: () => triggerHint('COOK_MODE_VOICE'),
		/** Call when cooking session completes */
		onCookComplete: () => triggerHint('COOK_MODE_COMPLETE'),
	}
}

/**
 * Use after first cook to trigger post-cook gamification hints
 */
export function usePostCookHints() {
	const { triggerHint } = useOnboardingOrchestrator({ disabled: true })

	return {
		/** Call to explain streaks after first cook */
		onExplainStreaks: () => triggerHint('STREAKS'),
		/** Call to encourage sharing */
		onEncourageShare: () => triggerHint('SHARE_CREATIONS'),
	}
}
