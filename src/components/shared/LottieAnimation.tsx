'use client'

import Lottie, { LottieComponentProps } from 'lottie-react'
import { useDeviceSize } from '@/hooks/useDeviceSize'

interface LottieAnimationProps
	extends Omit<LottieComponentProps, 'style' | 'animationData'> {
	/**
	 * Lottie animation data (JSON)
	 */
	lottie?: any
	/**
	 * Alternative: animation data (for compatibility with lottie-react examples)
	 */
	animationData?: any
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
	 * Legacy: Function to calculate size based on device dimensions
	 * @deprecated Use widthRatio/heightRatio instead
	 */
	sizeOfIllustrator?: (width: number, height: number) => number
}

/**
 * Responsive Lottie animation wrapper
 * Automatically adjusts animation size based on device dimensions
 *
 * @example
 * ```tsx
 * // Simple ratio-based sizing (recommended)
 * <LottieAnimation
 *   animationData={loadingAnimation}
 *   widthRatio={0.4}
 *   maxSize={300}
 *   loop
 *   autoplay
 * />
 *
 * // Legacy function-based sizing (still supported)
 * <LottieAnimation
 *   lottie={loadingAnimation}
 *   sizeOfIllustrator={(w, h) => Math.min(w * 0.4, h * 0.5, 300)}
 *   loop
 * />
 * ```
 */
export default function LottieAnimation({
	lottie,
	animationData,
	widthRatio = 0.4,
	heightRatio = 0.5,
	maxSize = 400,
	sizeOfIllustrator,
	...props
}: LottieAnimationProps) {
	const [deviceWidth, deviceHeight] = useDeviceSize()

	// Calculate size using legacy function or ratio-based approach
	const size = sizeOfIllustrator
		? sizeOfIllustrator(deviceWidth, deviceHeight)
		: Math.min(deviceWidth * widthRatio, deviceHeight * heightRatio, maxSize)

	const animData = animationData || lottie

	return (
		<Lottie
			animationData={animData}
			style={{ width: size, height: size }}
			{...props}
		/>
	)
}
