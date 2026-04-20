'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnnouncementBannerProps {
	/** The announcement message text. */
	message: string
	/** Optional link URL. */
	href?: string
	/** Link text (default: "Learn more →"). */
	linkText?: string
	/** Allow dismissal. */
	dismissible?: boolean
	/** Visual variant. */
	variant?: 'brand' | 'gradient' | 'subtle'
	/** localStorage key for dismiss persistence. Omit for session-only. */
	storageKey?: string
	className?: string
}

/**
 * Top-of-page announcement banner for promotions, updates, events.
 *
 * @example
 * <AnnouncementBanner
 *   message="Season's Best: Summer BBQ Collection is live!"
 *   href="/explore?collection=summer-bbq"
 *   variant="gradient"
 *   storageKey="summer-bbq-banner"
 * />
 */
export function AnnouncementBanner({
	message,
	href,
	linkText = 'Learn more →',
	dismissible = true,
	variant = 'brand',
	storageKey,
	className,
}: AnnouncementBannerProps) {
	const [dismissed, setDismissed] = useState(() => {
		if (!storageKey) return false
		if (typeof window === 'undefined') return false
		try {
			return localStorage.getItem(storageKey) === 'dismissed'
		} catch {
			return false
		}
	})

	const handleDismiss = () => {
		setDismissed(true)
		if (storageKey) {
			try {
				localStorage.setItem(storageKey, 'dismissed')
			} catch {
				/* restricted */
			}
		}
	}

	if (dismissed) return null

	return (
		<div
			className={cn(
				'relative flex items-center justify-center gap-2 px-10 py-2.5 text-sm',
				variant === 'brand' && 'bg-brand text-white',
				variant === 'gradient' &&
					'bg-gradient-to-r from-brand via-brand/85 to-brand text-white',
				variant === 'subtle' &&
					'border-b border-border-subtle bg-bg-elevated text-text',
				className,
			)}
			role='banner'
		>
			<p className='text-center'>
				{message}
				{href && (
					<>
						{' '}
						<a
							href={href}
							className='inline-flex items-center font-semibold underline underline-offset-4 hover:no-underline'
						>
							{linkText}
						</a>
					</>
				)}
			</p>

			{dismissible && (
				<button
					type='button'
					onClick={handleDismiss}
					className='absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100'
					aria-label='Dismiss announcement'
				>
					<X className='size-4' />
				</button>
			)}
		</div>
	)
}
