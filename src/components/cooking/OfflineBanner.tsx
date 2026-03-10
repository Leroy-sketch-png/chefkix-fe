'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'

interface OfflineBannerProps {
	isOffline: boolean
	isSyncing?: boolean
	pendingCount?: number
	className?: string
	variant?: 'subtle' | 'prominent'
}

export const OfflineBanner = memo(function OfflineBanner({
	isOffline,
	isSyncing = false,
	pendingCount = 0,
	className,
	variant = 'subtle',
}: OfflineBannerProps) {
	const showBanner = isOffline || isSyncing

	return (
		<AnimatePresence>
			{showBanner && (
				<motion.div
					initial={{ opacity: 0, y: -20, height: 0 }}
					animate={{ opacity: 1, y: 0, height: 'auto' }}
					exit={{ opacity: 0, y: -20, height: 0 }}
					transition={TRANSITION_SPRING}
					className={cn(
						'overflow-hidden',
						variant === 'subtle'
							? 'px-4 py-2'
							: 'px-4 py-3 border-b border-amber-200',
						className,
					)}
				>
					<div
						className={cn(
							'flex items-center justify-center gap-2 text-sm',
							variant === 'subtle'
								? 'rounded-lg bg-amber-50 px-3 py-1.5 text-amber-700'
								: 'text-amber-700',
						)}
						role="status"
						aria-live="polite"
					>
						{isSyncing ? (
							<>
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								<span>
									Syncing {pendingCount} pending action
									{pendingCount !== 1 ? 's' : ''}...
								</span>
							</>
						) : (
							<>
								<WifiOff className="size-4" aria-hidden="true" />
								<span>Offline — your progress will sync when you reconnect</span>
							</>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
})
