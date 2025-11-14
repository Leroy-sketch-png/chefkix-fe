'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect if the user prefers reduced motion
 * Respects the `prefers-reduced-motion: reduce` media query
 * Used to disable Framer Motion animations for accessibility
 *
 * @returns {boolean} true if user prefers reduced motion, false otherwise
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion()
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { scale: 1.2 }}
 * />
 * ```
 */
export const useReducedMotion = (): boolean => {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

	useEffect(() => {
		// Check if window is available (SSR safety)
		if (typeof window === 'undefined') return

		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

		// Set initial value
		setPrefersReducedMotion(mediaQuery.matches)

		// Listen for changes
		const listener = (event: MediaQueryListEvent) => {
			setPrefersReducedMotion(event.matches)
		}

		// Modern browsers
		mediaQuery.addEventListener('change', listener)

		// Cleanup
		return () => {
			mediaQuery.removeEventListener('change', listener)
		}
	}, [])

	return prefersReducedMotion
}
