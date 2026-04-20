'use client'

import { useCallback, useRef, useState, type RefObject } from 'react'

/**
 * Track hover state on an element ref.
 * Returns [ref, isHovered] — attach ref to the target element.
 */
export function useHover<T extends HTMLElement>(): [
	RefObject<T | null>,
	boolean,
] {
	const [isHovered, setIsHovered] = useState(false)
	const ref = useRef<T | null>(null)

	const handleMouseEnter = useCallback(() => setIsHovered(true), [])
	const handleMouseLeave = useCallback(() => setIsHovered(false), [])

	// Attach listeners imperatively to avoid re-renders from ref callbacks
	const callbackRef = useCallback(
		(node: T | null) => {
			if (ref.current) {
				ref.current.removeEventListener('mouseenter', handleMouseEnter)
				ref.current.removeEventListener('mouseleave', handleMouseLeave)
			}

			ref.current = node

			if (node) {
				node.addEventListener('mouseenter', handleMouseEnter)
				node.addEventListener('mouseleave', handleMouseLeave)
			}
		},
		[handleMouseEnter, handleMouseLeave],
	)

	// Return a ref-like object that also acts as callback ref
	const combinedRef = useRef<T | null>(null)
	combinedRef.current = ref.current

	// We need to return a stable ref object, so use a wrapper
	const stableRef = useRef<T | null>(null)
	Object.defineProperty(stableRef, 'current', {
		get: () => ref.current,
		set: (node: T | null) => callbackRef(node),
		configurable: true,
	})

	return [stableRef as RefObject<T | null>, isHovered]
}
