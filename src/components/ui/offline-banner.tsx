'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface OfflineBannerProps {
	isOffline: boolean
	className?: string
}

/**
 * Fixed bottom bar when user loses connection.
 * Styled with ChefKix warm tokens.
 */
export function OfflineBanner({ isOffline, className }: OfflineBannerProps) {
	const t = useTranslations('shared')
	if (!isOffline) return null

	return (
		<div
			className={cn(
				'fixed bottom-0 left-0 right-0 z-notification',
				'bg-amber-500 text-amber-50 dark:bg-amber-600',
				'flex items-center justify-center gap-3 px-4 py-3',
				'animate-in slide-in-from-bottom duration-300',
				className,
			)}
			role='alert'
		>
			<WifiOff className='size-5' />
			<span className='font-medium'>{t('offlineMessage')}</span>
			<button
				type='button'
				onClick={() => window.location.reload()}
				className='inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-sm font-medium transition hover:bg-amber-700'
				aria-label={t('offlineRetryConnection')}
			>
				<RefreshCw className='size-3.5' />
				{t('offlineRetry')}
			</button>
		</div>
	)
}
