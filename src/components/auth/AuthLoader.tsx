'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { LazyLottie } from '@/components/shared/LazyLottie'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'

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
		<div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 px-4 py-8'>
			<div
				className='pointer-events-none absolute inset-0 overflow-hidden'
				aria-hidden='true'
			>
				<div className='absolute -top-32 -right-24 size-72 rounded-full bg-brand/10 blur-3xl' />
				<div className='absolute -bottom-32 -left-24 size-72 rounded-full bg-xp/10 blur-3xl' />
			</div>

			<div className='relative w-full max-w-md space-y-6'>
				<div className='flex items-center gap-3'>
					<div className='size-11 rounded-2xl bg-gradient-xp shadow-warm shadow-xp/30' />
					<div className='space-y-2'>
						<Skeleton className='h-4 w-24 rounded-full' />
						<Skeleton className='h-3 w-40 rounded-full' />
					</div>
				</div>

				<div className='overflow-hidden rounded-3xl border border-border-subtle bg-bg-card/90 p-5 shadow-warm shadow-black/5 backdrop-blur-sm sm:p-6'>
					<div className='flex items-center justify-between gap-4'>
						<div className='space-y-2'>
							<Skeleton className='h-4 w-28 rounded-full' />
							<Skeleton className='h-7 w-48 rounded-xl' />
						</div>
						<div className='relative size-16'>
							<div className='absolute inset-0 rounded-full bg-brand/5' />
							<LazyLottie
								src='/lottie/lottie-loading-coral.json'
								widthRatio={0.13}
								heightRatio={0.13}
								maxSize={64}
								entrance='scale'
								loop
								autoplay
								fallback={<SpinnerFallback />}
							/>
						</div>
					</div>

					<div className='mt-5 space-y-3'>
						<Skeleton className='h-4 w-full rounded-full' />
						<Skeleton className='h-4 w-5/6 rounded-full' />
						<Skeleton className='h-4 w-2/3 rounded-full' />
					</div>

					<div className='mt-6 grid grid-cols-2 gap-3'>
						<Skeleton className='h-24 rounded-2xl' />
						<Skeleton className='h-24 rounded-2xl' />
						<Skeleton className='h-24 rounded-2xl' />
						<Skeleton className='h-24 rounded-2xl' />
					</div>

					<p className='mt-5 text-sm font-medium text-text-secondary'>
						{t(messageKey)}
					</p>
				</div>
			</div>
		</div>
	)
}

export default AuthLoader
