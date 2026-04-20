'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Detect clicks outside a referenced element.
 * Useful for closing dropdowns, popovers, and menus.
 */
export function useClickOutside<T extends HTMLElement>(
	handler: () => void,
	enabled: boolean = true,
): RefObject<T | null> {
	const ref = useRef<T | null>(null)
	const handlerRef = useRef(handler)
	handlerRef.current = handler

	useEffect(() => {
		if (!enabled) return

		const listener = (event: MouseEvent | TouchEvent) => {
			const el = ref.current
			if (!el || el.contains(event.target as Node)) return
			handlerRef.current()
		}

		document.addEventListener('mousedown', listener)
		document.addEventListener('touchstart', listener)

		return () => {
			document.removeEventListener('mousedown', listener)
			document.removeEventListener('touchstart', listener)
		}
	}, [enabled])

	return ref
}
