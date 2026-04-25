import * as React from 'react'

/**
 * Returns a 0-1 scroll progress value for the page or a specific element.
 *
 * Adapted from .tmp stash. Useful for scroll-linked animations,
 * reading progress bars, and parallax effects.
 *
 * @example
 * // Page scroll progress
 * const progress = useScrollProgress()
 *
 * // Element scroll progress (when element enters/exits viewport)
 * const ref = useRef(null)
 * const progress = useScrollProgress(ref)
 */
export function useScrollProgress(
	ref?: React.RefObject<HTMLElement | null>,
): number {
	const [progress, setProgress] = React.useState(0)

	React.useEffect(() => {
		const compute = () => {
			if (ref?.current) {
				const rect = ref.current.getBoundingClientRect()
				const windowHeight = window.innerHeight
				// 0 when element enters viewport from bottom, 1 when it leaves from top
				const raw = (windowHeight - rect.top) / (windowHeight + rect.height)
				setProgress(Math.min(Math.max(raw, 0), 1))
			} else {
				const scrollTop = window.scrollY
				const docHeight =
					document.documentElement.scrollHeight - window.innerHeight
				setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
			}
		}

		compute()
		window.addEventListener('scroll', compute, { passive: true })
		window.addEventListener('resize', compute, { passive: true })
		return () => {
			window.removeEventListener('scroll', compute)
			window.removeEventListener('resize', compute)
		}
	}, [ref])

	return progress
}
