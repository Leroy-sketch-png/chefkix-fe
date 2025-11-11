'use client'

import Lottie, { LottieComponentProps } from 'lottie-react'
import { useDeviceSize } from '@/hooks/useDeviceSize'

interface LottieAnimationProps
	extends Omit<LottieComponentProps, 'style' | 'animationData'> {
	/**
	 * Lottie animation data (JSON)
	 */
	lottie: any
	/**
	 * Function to calculate size based on device dimensions
	 * @param width - Device width
	 * @param height - Device height
	 * @returns Size in pixels
	 */
	sizeOfIllustrator: (width: number, height: number) => number
}

/**
 * Responsive Lottie animation wrapper
 * Automatically adjusts animation size based on device dimensions
 *
 * @example
 * ```tsx
 * <LottieAnimation
 *   lottie={loadingAnimation}
 *   sizeOfIllustrator={(w, h) => Math.min(w * 0.4, h * 0.5, 300)}
 *   loop
 *   autoplay
 * />
 * ```
 */
export default function LottieAnimation({
	lottie,
	sizeOfIllustrator,
	...props
}: LottieAnimationProps) {
	const [deviceWidth, deviceHeight] = useDeviceSize()
	const size = sizeOfIllustrator(deviceWidth, deviceHeight)

	return (
		<Lottie
			animationData={lottie}
			style={{ width: size, height: size }}
			{...props}
		/>
	)
}
