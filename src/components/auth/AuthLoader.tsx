'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { LazyLottie } from '@/components/shared/LazyLottie'

/**
 * Spinner fallback shown while Lottie is loading.
 * Uses the exact shadcn/ui pattern: Loader2 + animate-spin
 */
const SpinnerFallback = () => (
	<div className='flex size-20 items-center justify-center'>
		<Loader2 className='size-10 animate-spin text-brand' />
	</div>
)

// Cooking-themed loading messages for variety and delight
const LOADING_MESSAGES = [
	'Prepping your kitchen...',
	'Gathering ingredients...',
	'Warming up the stove...',
	'Setting the table...',
	'Almost ready to cook...',
] as const

// Type for loading messages
type LoadingMessage = (typeof LOADING_MESSAGES)[number]

// Default message used for SSR to ensure hydration match
const DEFAULT_MESSAGE: LoadingMessage = LOADING_MESSAGES[0]

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
 * - ALWAYS shows something (fallback spinner while Lottie loads)
 *
 * NOTE: Random message selection happens client-side only to prevent
 * React hydration mismatch errors. SSR always uses the default message.
 */
export const AuthLoader = () => {
	// Start with default message for SSR, randomize on client mount
	const [message, setMessage] = useState<LoadingMessage>(DEFAULT_MESSAGE)

	useEffect(() => {
		// Client-only: pick a random message after hydration
		const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length)
		setMessage(LOADING_MESSAGES[randomIndex])
	}, [])

	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			{/* Subtle warm glow behind the animation */}
			<div className='absolute h-32 w-32 rounded-full bg-brand/10 blur-3xl' />

			<div className='relative flex flex-col items-center gap-6'>
				{/* Coral-themed Lottie animation - sized for auth context */}
				<div className='relative'>
					{/* Soft pulsing ring behind animation */}
					<div className='absolute inset-0 -m-4 animate-pulse rounded-full bg-brand/5' />

					<LazyLottie
						src='/lottie/lottie-loading-coral.json'
						widthRatio={0.15}
						heightRatio={0.15}
						maxSize={80}
						entrance='scale'
						loop
						autoplay
						fallback={<SpinnerFallback />}
					/>
				</div>

				{/* Cooking-themed message */}
				<p className='text-sm font-medium text-text-secondary'>{message}</p>
			</div>
		</div>
	)
}

export default AuthLoader
