'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLockScroll } from '@/hooks/useLockScroll'

interface ExpandableCardProps {
	children: React.ReactNode
	expandedContent: React.ReactNode
	layoutId: string
	className?: string
	expandedClassName?: string
}

export function ExpandableCard({
	children,
	expandedContent,
	layoutId,
	className,
	expandedClassName,
}: ExpandableCardProps) {
	const [isExpanded, setIsExpanded] = React.useState(false)
	useLockScroll(isExpanded)

	return (
		<>
			<motion.div
				layoutId={layoutId}
				onClick={() => setIsExpanded(true)}
				className={cn(
					'cursor-pointer rounded-radius bg-bg-card shadow-card',
					className,
				)}
				role='button'
				tabIndex={0}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						setIsExpanded(true)
					}
				}}
			>
				{children}
			</motion.div>

			<AnimatePresence>
				{isExpanded && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal bg-black/50'
							onClick={() => setIsExpanded(false)}
							aria-hidden
						/>

						{/* Expanded card */}
						<div className='fixed inset-0 z-modal flex items-center justify-center p-4'>
							<motion.div
								layoutId={layoutId}
								className={cn(
									'max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-radius bg-bg-card shadow-warm',
									expandedClassName,
								)}
								role='dialog'
								aria-modal
							>
								<button
									onClick={() => setIsExpanded(false)}
									className='absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-bg-elevated text-text-muted hover:text-text'
									aria-label='Close'
								>
									&times;
								</button>
								{expandedContent}
							</motion.div>
						</div>
					</>
				)}
			</AnimatePresence>
		</>
	)
}
