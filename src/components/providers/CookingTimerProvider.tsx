'use client'

import { useEffect } from 'react'
import { useCookingStore } from '@/store/cookingStore'
import { useTimerNotifications } from '@/hooks/useTimerNotifications'

/**
 * CookingTimerProvider
 *
 * SINGLE SOURCE OF TRUTH for timer ticking.
 *
 * This provider handles:
 * 1. The setInterval that ticks all active timers (1 second)
 * 2. Timer completion notifications via useTimerNotifications hook
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
	const { session, localTimers, tickTimers } = useCookingStore()

	// Timer completion notifications (toast + chime)
	useTimerNotifications()

	// Centralized timer ticking - ONE interval for the entire app
	useEffect(() => {
		// Only tick if there's an active session with running timers
		if (!session || localTimers.size === 0) return

		const interval = setInterval(tickTimers, 1000)
		return () => clearInterval(interval)
	}, [session, localTimers.size, tickTimers])

	return null
}
