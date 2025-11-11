'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to get device dimensions for responsive sizing
 * Used primarily for Lottie animation sizing
 * @returns [width, height] - Current window dimensions
 */
export function useDeviceSize(): [number, number] {
	const [size, setSize] = useState<[number, number]>([0, 0])

	useEffect(() => {
		const updateSize = () => {
			setSize([window.innerWidth, window.innerHeight])
		}

		// Set initial size
		updateSize()

		// Listen for window resize
		window.addEventListener('resize', updateSize)

		return () => window.removeEventListener('resize', updateSize)
	}, [])

	return size
}
