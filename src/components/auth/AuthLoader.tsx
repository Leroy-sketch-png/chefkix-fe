'use client'

import dynamic from 'next/dynamic'
import lottieLoadingCoral from '@/../public/lottie/lottie-loading-coral.json'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

// Cooking-themed loading messages for variety and delight
const LOADING_MESSAGES = [
	'Prepping your kitchen...',
	'Gathering ingredients...',
	'Warming up the stove...',
	'Setting the table...',
	'Almost ready to cook...',
] as const

/**
 * AuthLoader - A warm, on-brand loading screen for authentication states
 *
 * Appears during:
 * - Initial session validation
 * - Login/logout transitions
 * - Profile fetching after auth
 *
 * Design principles:
 * - Coral brand color animation (not generic blue)
 * - Cooking-themed messaging
 * - Subtle, confident presence
 * - Quick to appear, quick to dismiss
 */
export const AuthLoader = () => {
	// Pick a random message for delight (but consistent per render)
	const message =
		LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]

	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			{/* Subtle warm glow behind the animation */}
			<div className='absolute h-32 w-32 rounded-full bg-brand/10 blur-3xl' />

			<div className='relative flex flex-col items-center gap-6'>
				{/* Coral-themed Lottie animation - sized for auth context */}
				<div className='relative'>
					{/* Soft pulsing ring behind animation */}
					<div className='absolute inset-0 -m-4 animate-pulse rounded-full bg-brand/5' />

					<LottieAnimation
						animationData={lottieLoadingCoral}
						widthRatio={0.15}
						heightRatio={0.15}
						maxSize={80}
						loop
						autoplay
					/>
				</div>

				{/* Cooking-themed message */}
				<p className='text-sm font-medium text-text-secondary'>{message}</p>
			</div>
		</div>
	)
}

export default AuthLoader
