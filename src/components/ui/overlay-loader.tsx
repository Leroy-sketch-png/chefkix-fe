'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { cn } from '@/lib/utils'

interface OverlayLoaderProps {
	/** Whether the overlay is visible. */
	isOpen: boolean
	/** Loading message to display. */
	message?: string
	className?: string
}

/**
 * Full-screen loading overlay for blocking operations (publish, delete, etc.).
 * Uses Portal + fixed positioning to escape all stacking contexts.
 *
 * @example
 * <OverlayLoader isOpen={isPublishing} message="Publishing recipe..." />
 */
export function OverlayLoader({
	isOpen,
	message,
	className,
}: OverlayLoaderProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className={cn(
							'fixed inset-0 z-modal flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm',
							className,
						)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ delay: 0.1, duration: 0.2 }}
							className='flex flex-col items-center gap-4'
						>
							<Loader2 className='size-10 animate-spin text-brand' />
							{message && (
								<p className='text-sm font-medium text-text-secondary'>
									{message}
								</p>
							)}
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
