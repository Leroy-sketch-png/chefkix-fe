'use client'

import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query and reactively track its match state.
 * SSR-safe: returns false until mounted.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false)

	useEffect(() => {
		const mql = window.matchMedia(query)
		setMatches(mql.matches)

		const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
		mql.addEventListener('change', handler)
		return () => mql.removeEventListener('change', handler)
	}, [query])

	return matches
}
