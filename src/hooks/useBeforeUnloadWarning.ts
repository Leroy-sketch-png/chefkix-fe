'use client'

import { useEffect, useCallback } from 'react'

/**
 * Hook to warn users when they're about to leave the page during critical operations
 * (e.g., active cooking sessions)
 *
 * Uses `beforeunload` event to show browser's native "Leave site?" dialog.
 * Note: Modern browsers standardize the message - custom text is ignored for security.
 *
 * @param shouldWarn - Whether the warning should be active
 * @param message - Optional message (mostly for debugging, browsers ignore custom messages)
 *
 * @example
 * ```tsx
 * const hasCookingSession = session?.status === 'in_progress'
 * useBeforeUnloadWarning(hasCookingSession, 'You have an active cooking session')
 * ```
 */
export function useBeforeUnloadWarning(
	shouldWarn: boolean,
	message?: string,
): void {
	const handleBeforeUnload = useCallback(
		(event: BeforeUnloadEvent) => {
			if (!shouldWarn) return

			// Standard way to trigger browser's "Leave site?" dialog
			event.preventDefault()
			// For older browsers (Chrome < 119, Safari)
			event.returnValue = message || 'You have unsaved changes.'
			return message || 'You have unsaved changes.'
		},
		[shouldWarn, message],
	)

	useEffect(() => {
		if (!shouldWarn) return

		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [shouldWarn, handleBeforeUnload])
}
