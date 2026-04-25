'use client'

import { useEffect } from 'react'

/**
 * Lock body scroll when a condition is true (modals, overlays, drawers).
 * Preserves scroll position and restores on unlock.
 */
export function useLockScroll(locked: boolean) {
	useEffect(() => {
		if (!locked) return

		const scrollY = window.scrollY
		const original = document.body.style.cssText

		document.body.style.position = 'fixed'
		document.body.style.top = `-${scrollY}px`
		document.body.style.left = '0'
		document.body.style.right = '0'
		document.body.style.overflow = 'hidden'

		return () => {
			document.body.style.cssText = original
			window.scrollTo(0, scrollY)
		}
	}, [locked])
}
