'use client'

import { useEffect, useState } from 'react'

interface WindowSize {
	width: number
	height: number
}

/**
 * Track window dimensions with debounced resize handling.
 * SSR-safe: returns 0x0 until mounted.
 */
export function useWindowSize(debounceMs: number = 150): WindowSize {
	const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 })

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>

		const update = () => {
			setSize({ width: window.innerWidth, height: window.innerHeight })
		}

		const handleResize = () => {
			clearTimeout(timeout)
			timeout = setTimeout(update, debounceMs)
		}

		update() // Set initial size
		window.addEventListener('resize', handleResize)

		return () => {
			clearTimeout(timeout)
			window.removeEventListener('resize', handleResize)
		}
	}, [debounceMs])

	return size
}
