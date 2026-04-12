'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { LazyLottie } from '@/components/shared/LazyLottie'
import { useTranslations } from 'next-intl'

/**
 * Spinner fallback shown while Lottie is loading.
 * Uses the exact shadcn/ui pattern: Loader2 + animate-spin
 */
const SpinnerFallback = () => (
	<div className='flex size-20 items-center justify-center'>
		<Loader2 className='size-10 animate-spin text-brand' />
	</div>
)

// Cooking-themed loading message keys
const LOADING_MESSAGE_KEYS = [
	'loadingPrepping',
	'loadingGathering',
	'loadingWarming',
	'loadingTable',
	'loadingReady',
] as const

// Type for loading message keys
type LoadingMessageKey = (typeof LOADING_MESSAGE_KEYS)[number]

// Default key used for SSR to ensure hydration match
const DEFAULT_KEY: LoadingMessageKey = LOADING_MESSAGE_KEYS[0]

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
	const t = useTranslations('auth')
	// Start with default key for SSR, randomize on client mount
	const [messageKey, setMessageKey] = useState<LoadingMessageKey>(DEFAULT_KEY)

	useEffect(() => {
		// Client-only: pick a random key after hydration
		const randomIndex = Math.floor(Math.random() * LOADING_MESSAGE_KEYS.length)
		setMessageKey(LOADING_MESSAGE_KEYS[randomIndex])
	}, [])

	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			{/* Subtle warm glow behind the animation */}
			<div className='absolute size-32 rounded-full bg-brand/10 blur-3xl' />

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
				<p className='text-sm font-medium text-text-secondary'>{t(messageKey)}</p>
			</div>
		</div>
	)
}

export default AuthLoader
