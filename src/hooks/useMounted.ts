'use client'

import { useEffect, useState } from 'react'

/**
 * Returns true only after the component has mounted on the client.
 * Use to guard browser-only code and prevent SSR hydration mismatches.
 */
export function useMounted(): boolean {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	return mounted
}
