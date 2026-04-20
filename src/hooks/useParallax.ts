import * as React from 'react'

/**
 * Simplified parallax hook — returns transform values for an element.
 *
 * Adapted from .tmp stash. Lightweight parallax effect that computes
 * translateY/translateX offset based on scroll position relative to the element.
 *
 * @example
 * const ref = useRef(null)
 * const { transform } = useParallax(ref, { speed: 0.3 })
 *
 * <div ref={ref} style={{ transform }}>
 *   This moves slower than scroll
 * </div>
 *
 * // Horizontal parallax
 * const { transform } = useParallax(ref, { speed: -0.5, direction: 'horizontal' })
 */

interface ParallaxValues {
	/** CSS transform value — apply directly: `style={{ transform }}` */
	transform: string
	/** Raw offset in pixels */
	offset: number
	/** Raw progress 0-1 */
	progress: number
}

interface UseParallaxOptions {
	/** Speed multiplier. 0.5 = half scroll speed, -0.5 = reverse, 2 = double */
	speed?: number
	/** Direction of parallax movement */
	direction?: 'vertical' | 'horizontal'
}

export function useParallax(
	ref: React.RefObject<HTMLElement | null>,
	options: UseParallaxOptions = {},
): ParallaxValues {
	const { speed = 0.5, direction = 'vertical' } = options
	const [values, setValues] = React.useState<ParallaxValues>({
		transform: direction === 'vertical' ? 'translateY(0px)' : 'translateX(0px)',
		offset: 0,
		progress: 0,
	})

	React.useEffect(() => {
		const element = ref.current
		if (!element) return

		const compute = () => {
			const rect = element.getBoundingClientRect()
			const windowHeight = window.innerHeight
			const progress = Math.min(
				Math.max((windowHeight - rect.top) / (windowHeight + rect.height), 0),
				1,
			)
			// Center the parallax around 0 (so at 50% progress, offset is 0)
			const centered = progress - 0.5
			const offset = centered * windowHeight * speed

			const transform =
				direction === 'vertical'
					? `translateY(${offset}px)`
					: `translateX(${offset}px)`

			setValues({ transform, offset, progress })
		}

		compute()
		window.addEventListener('scroll', compute, { passive: true })
		window.addEventListener('resize', compute, { passive: true })
		return () => {
			window.removeEventListener('scroll', compute)
			window.removeEventListener('resize', compute)
		}
	}, [ref, speed, direction])

	return values
}
