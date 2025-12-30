'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * useFocusTrap - Traps focus within a container element.
 *
 * Usage:
 * ```tsx
 * const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen)
 * return <div ref={focusTrapRef}>...modal content...</div>
 * ```
 *
 * Features:
 * - Auto-focuses first focusable element on open
 * - Tab cycles through focusable elements (wraps around)
 * - Shift+Tab cycles backwards
 * - Restores focus to trigger element on close
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
	const containerRef = useRef<T>(null)
	const previouslyFocusedRef = useRef<HTMLElement | null>(null)

	const getFocusableElements = useCallback(() => {
		if (!containerRef.current) return []

		const focusableSelectors = [
			'a[href]',
			'button:not([disabled])',
			'textarea:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
		].join(', ')

		return Array.from(
			containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors),
		).filter(el => el.offsetParent !== null) // Filter out hidden elements
	}, [])

	useEffect(() => {
		if (!isActive) {
			// Restore focus when trap is deactivated
			if (previouslyFocusedRef.current) {
				previouslyFocusedRef.current.focus()
				previouslyFocusedRef.current = null
			}
			return
		}

		// Store currently focused element before trapping
		previouslyFocusedRef.current = document.activeElement as HTMLElement

		// Focus first focusable element after a tick (let animation start)
		const focusTimer = setTimeout(() => {
			const focusable = getFocusableElements()
			if (focusable.length > 0) {
				focusable[0].focus()
			} else if (containerRef.current) {
				// If no focusable elements, focus the container itself
				containerRef.current.setAttribute('tabindex', '-1')
				containerRef.current.focus()
			}
		}, 50)

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return

			const focusable = getFocusableElements()
			if (focusable.length === 0) return

			const firstEl = focusable[0]
			const lastEl = focusable[focusable.length - 1]
			const activeEl = document.activeElement

			if (e.shiftKey) {
				// Shift+Tab: If on first element, go to last
				if (activeEl === firstEl) {
					e.preventDefault()
					lastEl.focus()
				}
			} else {
				// Tab: If on last element, go to first
				if (activeEl === lastEl) {
					e.preventDefault()
					firstEl.focus()
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown)

		return () => {
			clearTimeout(focusTimer)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isActive, getFocusableElements])

	return containerRef
}
