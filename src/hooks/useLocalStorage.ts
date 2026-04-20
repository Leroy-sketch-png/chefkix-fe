import { useState, useCallback } from 'react'

/**
 * Typed localStorage hook with JSON serialization.
 *
 * Adapted from .tmp stash. Provides reactive localStorage state
 * with SSR-safe initialization, type-safe JSON parsing, and
 * a remove function.
 *
 * @returns [value, setValue, removeValue]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light')
 * setTheme('dark')
 *
 * const [prefs, setPrefs, clearPrefs] = useLocalStorage('prefs', { fontSize: 16 })
 * setPrefs(prev => ({ ...prev, fontSize: 18 }))
 */
export function useLocalStorage<T>(
	key: string,
	initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === 'undefined') return initialValue
		try {
			const item = localStorage.getItem(key)
			return item ? (JSON.parse(item) as T) : initialValue
		} catch {
			return initialValue
		}
	})

	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			setStoredValue(prev => {
				const next = value instanceof Function ? value(prev) : value
				try {
					localStorage.setItem(key, JSON.stringify(next))
				} catch {
					// ignored: storage access non-critical
				}
				return next
			})
		},
		[key],
	)

	const removeValue = useCallback(() => {
		try {
			localStorage.removeItem(key)
			setStoredValue(initialValue)
		} catch {
			// ignored: storage access non-critical
		}
	}, [key, initialValue])

	return [storedValue, setValue, removeValue]
}
