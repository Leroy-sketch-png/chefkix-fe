'use client'

import { useEffect, useState } from 'react'

/**
 * Debounce a value by a specified delay.
 * Returns the debounced value that only updates after the delay has passed
 * without new changes.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
	const [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay)
		return () => clearTimeout(timer)
	}, [value, delay])

	return debouncedValue
}
