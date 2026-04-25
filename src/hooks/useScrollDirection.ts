import * as React from 'react'

type ScrollDirection = 'up' | 'down' | null

/**
 * Detects scroll direction (up/down).
 * Useful for hiding/showing nav on scroll.
 *
 * @example
 * const direction = useScrollDirection()
 * <nav className={cn(direction === "down" && "-translate-y-full")} />
 */
export function useScrollDirection(threshold = 5): ScrollDirection {
	const [direction, setDirection] = React.useState<ScrollDirection>(null)
	const lastY = React.useRef(0)
	const ticking = React.useRef(false)

	React.useEffect(() => {
		lastY.current = window.scrollY

		const handleScroll = () => {
			if (ticking.current) return
			ticking.current = true

			requestAnimationFrame(() => {
				const y = window.scrollY
				const delta = y - lastY.current

				if (Math.abs(delta) >= threshold) {
					setDirection(delta > 0 ? 'down' : 'up')
					lastY.current = y
				}

				ticking.current = false
			})
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [threshold])

	return direction
}
