'use client'

import { useEffect, useState, memo, useMemo } from 'react'
import Lottie, { LottieComponentProps } from 'lottie-react'
import { useDeviceSize } from '@/hooks/useDeviceSize'
import { useInView, motion, type Variants } from 'framer-motion'
import { useRef } from 'react'

interface LazyLottieProps
	extends Omit<LottieComponentProps, 'style' | 'animationData'> {
	/**
	 * Path to the Lottie JSON file in public folder
	 * @example "/lottie/lottie-register.json"
	 */
	src: string
	/**
	 * Width ratio relative to device width (0-1)
	 * @default 0.4
	 */
	widthRatio?: number
	/**
	 * Height ratio relative to device height (0-1)
	 * @default 0.5
	 */
	heightRatio?: number
	/**
	 * Maximum size in pixels
	 * @default 400
	 */
	maxSize?: number
	/**
	 * Number of times to loop (true = infinite, number = specific count)
	 * For ambient/background decorations: use 3-5
	 * For hero/focal animations: use true
	 * @default true (infinite for maximum showmanship)
	 */
	loop?: boolean | number
	/**
	 * Optional className for the container
	 */
	className?: string
	/**
	 * Entrance animation style
	 * - 'fade': Gentle fade in (for backgrounds)
	 * - 'scale': Scale up with fade (for focal elements)
	 * - 'none': No entrance animation
	 * @default 'fade'
	 */
	entrance?: 'fade' | 'scale' | 'none'
	/**
	 * Fallback component to show while Lottie is loading
	 * If not provided, shows nothing during load
	 */
	fallback?: React.ReactNode
	/**
	 * Legacy: Function to calculate size based on device dimensions
	 * @deprecated Use widthRatio/heightRatio instead
	 */
	sizeOfIllustrator?: (width: number, height: number) => number
}

// Simple in-memory cache to avoid re-fetching during navigation
const lottieCache = new Map<string, object>()

// Entrance animation variants — theatrical yet tasteful
const entranceVariants: Record<'fade' | 'scale' | 'none', Variants> = {
	fade: {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { duration: 0.6, ease: 'easeOut' as const },
		},
	},
	scale: {
		hidden: { opacity: 0, scale: 0.8 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: {
				duration: 0.5,
				ease: [0.34, 1.56, 0.64, 1] as const, // Bouncy overshoot
			},
		},
	},
	none: {
		hidden: {},
		visible: {},
	},
}

/**
 * Lazy-loading Lottie animation component with theatrical entrance
 *
 * PHILOSOPHY: Maximum showmanship + zero waste
 * - Loads at runtime (fast first paint, then the magic appears)
 * - Theatrical entrance animations
 * - Infinite loops by default (showmanship > CPU)
 * - Pauses when off-screen (smart performance)
 *
 * @example
 * ```tsx
 * // Hero animation - full showmanship
 * <LazyLottie
 *   src="/lottie/lottie-register.json"
 *   entrance="scale"
 *   loop
 *   autoplay
 * />
 *
 * // Background decoration - subtle
 * <LazyLottie
 *   src="/lottie/lottie-bg.json"
 *   entrance="fade"
 *   loop={3}
 * />
 * ```
 */
function LazyLottieComponent({
	src,
	widthRatio = 0.4,
	heightRatio = 0.5,
	maxSize = 400,
	loop = true, // Default to infinite for showmanship
	entrance = 'fade',
	fallback,
	sizeOfIllustrator,
	className,
	autoplay = true,
	...props
}: LazyLottieProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(containerRef, { once: false, amount: 0.1 })
	const [animationData, setAnimationData] = useState<object | null>(
		lottieCache.get(src) ?? null,
	)
	const [hasLoaded, setHasLoaded] = useState(lottieCache.has(src))
	const [hasMounted, setHasMounted] = useState(false)
	const [deviceWidth, deviceHeight] = useDeviceSize()

	// Track client mount to avoid hydration mismatch
	useEffect(() => {
		setHasMounted(true)
	}, [])

	// Calculate size using legacy function or ratio-based approach
	// Use maxSize for SSR to avoid hydration mismatch, then use actual size on client
	const size = useMemo(() => {
		if (!hasMounted) {
			// SSR/initial render: use maxSize to ensure consistent hydration
			return maxSize
		}
		if (sizeOfIllustrator) {
			return sizeOfIllustrator(deviceWidth, deviceHeight)
		}
		return Math.min(
			deviceWidth * widthRatio,
			deviceHeight * heightRatio,
			maxSize,
		)
	}, [
		hasMounted,
		deviceWidth,
		deviceHeight,
		widthRatio,
		heightRatio,
		maxSize,
		sizeOfIllustrator,
	])

	// Fetch animation data only when in view and not already loaded
	useEffect(() => {
		if (!isInView || hasLoaded) return

		const fetchAnimation = async () => {
			try {
				// Check cache first
				const cached = lottieCache.get(src)
				if (cached) {
					setAnimationData(cached)
					setHasLoaded(true)
					return
				}

				const response = await fetch(src)
				if (!response.ok) {
					console.error(`Failed to fetch Lottie: ${src}`)
					return
				}

				const data = await response.json()
				lottieCache.set(src, data)
				setAnimationData(data)
				setHasLoaded(true)
			} catch (error) {
				console.error(`Error loading Lottie animation: ${src}`, error)
			}
		}

		fetchAnimation()
	}, [isInView, hasLoaded, src])

	// Only render Lottie when we have data and are in view
	const shouldPlay = isInView && animationData && autoplay
	const isLoading = !animationData

	return (
		<div
			ref={containerRef}
			className={className}
			style={{ width: size, height: size }}
		>
			{/* Fallback shown immediately while loading - NOT inside motion.div */}
			{isLoading && fallback}

			{/* Lottie with entrance animation */}
			{animationData && (
				<motion.div
					variants={entranceVariants[entrance]}
					initial='hidden'
					animate='visible'
					style={{ width: '100%', height: '100%' }}
				>
					<Lottie
						animationData={animationData}
						loop={loop}
						autoplay={shouldPlay}
						style={{ width: '100%', height: '100%' }}
						{...props}
					/>
				</motion.div>
			)}
		</div>
	)
}

// Memoize to prevent unnecessary re-renders
export const LazyLottie = memo(LazyLottieComponent)
export default LazyLottie
