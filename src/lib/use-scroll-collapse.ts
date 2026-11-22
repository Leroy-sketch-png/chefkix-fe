'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Returns `true` when the user has scrolled down past `threshold` pixels
 * and is currently moving downward — signals that chrome should hide.
 * Returns `false` when scrolling up (chrome should reappear).
 */
export function useScrollCollapse(threshold = 8): boolean {
	const [collapsed, setCollapsed] = useState(false)
	const lastY = useRef(0)
	const raf = useRef<number | null>(null)

	useEffect(() => {
		const el = document.getElementById('main-content')
		if (!el) return

		const onScroll = () => {
			if (raf.current) return
			raf.current = requestAnimationFrame(() => {
				raf.current = null
				const y = el.scrollTop
				const diff = y - lastY.current
				if (Math.abs(diff) < threshold) return
				setCollapsed(diff > 0 && y > 48)
				lastY.current = y
			})
		}

		el.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			el.removeEventListener('scroll', onScroll)
			if (raf.current) cancelAnimationFrame(raf.current)
		}
	}, [threshold])

	return collapsed
}
