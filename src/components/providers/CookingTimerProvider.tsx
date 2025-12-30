'use client'

import { useEffect, useRef } from 'react'
import { useCookingStore } from '@/store/cookingStore'
import { useTimerNotifications } from '@/hooks/useTimerNotifications'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

/**
 * CookingTimerProvider
 *
 * SINGLE SOURCE OF TRUTH for timer ticking.
 *
 * This provider handles:
 * 1. Syncing with backend on mount (restore "ninja" sessions)
 * 2. The setInterval that ticks all active timers (1 second)
 * 3. Timer completion notifications via useTimerNotifications hook
 * 4. Auto-showing cooking UI when session is restored
 *
 * ARCHITECTURAL DECISION:
 * Timer intervals were previously scattered across CookingPanel,
 * CookingIndicator, and MiniCookingBar. This caused timers to tick
 * 2-3x per second when multiple components were mounted.
 *
 * Now there is ONE interval, managed here, regardless of which
 * cooking UI components are visible.
 *
 * Mount this in the main layout - it renders nothing.
 */
export const CookingTimerProvider = () => {
	const { session, localTimers, tickTimers, resumeExistingSession } =
		useCookingStore()
	const isAuthenticated = useAuthStore(state => state.isAuthenticated)
	const { openCookingPanel, setCookingMode } = useUiStore()
	const hasSyncedRef = useRef(false)

	// Timer completion notifications (toast + chime)
	useTimerNotifications()

	// Sync with backend on mount — catch "ninja sessions" that exist on BE but not in FE store
	// This handles: cleared localStorage, different browser, out-of-sync state
	// ALSO handles: partial session from localStorage (only has sessionId/recipeId, missing status)
	useEffect(() => {
		// Only sync if authenticated and haven't synced yet
		if (!isAuthenticated || hasSyncedRef.current) return

		// CRITICAL GUARD: If localStorage has a completed/abandoned session, clear it immediately
		// These should NEVER trigger cooking UI
		if (session?.status === 'completed' || session?.status === 'abandoned') {
			useCookingStore.getState().clearSession()
			return
		}

		// Check if session is COMPLETE (has status AND has recipeId) vs PARTIAL
		// A partial session means localStorage was restored but we need full data from backend
		const isCompleteActiveSession =
			session && session.status === 'in_progress' && session.recipeId // Must have recipeId to be valid

		// If FE already has a valid IN_PROGRESS session with recipeId, no need to sync
		if (isCompleteActiveSession) return

		hasSyncedRef.current = true

		// Check backend for existing session and restore if found
		resumeExistingSession().then(resumed => {
			if (resumed) {
				// Auto-show cooking UI: docked panel on desktop, mini bar on mobile
				const isDesktop = window.innerWidth >= 1280
				if (isDesktop) {
					openCookingPanel() // Shows CookingPanel in right sidebar
				} else {
					setCookingMode('mini') // Shows MiniCookingBar at bottom
				}
			} else if (session) {
				// We had a partial session from localStorage but backend says no session exists
				// Clear the stale partial session
				useCookingStore.getState().clearSession()
			}
		})
	}, [
		isAuthenticated,
		session,
		resumeExistingSession,
		openCookingPanel,
		setCookingMode,
	])

	// Reset sync flag on logout so next login will sync
	useEffect(() => {
		if (!isAuthenticated) {
			hasSyncedRef.current = false
		}
	}, [isAuthenticated])

	// Centralized timer ticking - ONE interval for the entire app
	useEffect(() => {
		// CRITICAL GUARDS: Only tick if we have a VALID active session
		// 1. Session must exist
		// 2. Session must be in_progress (not completed/abandoned)
		// 3. Session must have recipeId (not a ghost session)
		// 4. Must have running timers
		if (!session) return
		if (session.status !== 'in_progress') return
		if (!session.recipeId) return
		if (localTimers.size === 0) return

		const interval = setInterval(tickTimers, 1000)
		return () => clearInterval(interval)
	}, [session, localTimers.size, tickTimers])

	return null
}
