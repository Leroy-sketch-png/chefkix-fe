'use client'

import { useEffect, useRef } from 'react'

/**
 * Track the previous value of a variable across renders.
 * Returns undefined on the first render.
 */
export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T | undefined>(undefined)

	useEffect(() => {
		ref.current = value
	})

	return ref.current
}
