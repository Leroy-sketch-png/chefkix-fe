'use client'

import { useState, useEffect } from 'react'

/**
 * Default dimensions for SSR and initial render
 * Using common mobile viewport as safe default ensures animations
 * are visible immediately instead of rendering at 0x0
 */
const DEFAULT_WIDTH = 375
const DEFAULT_HEIGHT = 667

/**
 * Custom hook to get device dimensions for responsive sizing
 * Used primarily for Lottie animation sizing
 *
 * IMPORTANT: Initializes with sensible defaults (375x667) instead of 0x0
 * to prevent animations from being invisible during SSR/first render.
 *
 * @returns [width, height] - Current window dimensions
 */
export function useDeviceSize(): [number, number] {
	// Initialize with safe defaults for SSR - prevents 0x0 sizing bugs
	const [size, setSize] = useState<[number, number]>(() => {
		// If we're on the client during initial render, use actual dimensions
		if (typeof window !== 'undefined') {
			return [window.innerWidth, window.innerHeight]
		}
		// SSR: use reasonable mobile defaults
		return [DEFAULT_WIDTH, DEFAULT_HEIGHT]
	})

	useEffect(() => {
		const updateSize = () => {
			setSize([window.innerWidth, window.innerHeight])
		}

		// Immediately update to actual size (in case SSR default was used)
		updateSize()

		// Listen for window resize
		window.addEventListener('resize', updateSize)

		return () => window.removeEventListener('resize', updateSize)
	}, [])

	return size
}
