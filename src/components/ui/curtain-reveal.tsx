'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CurtainRevealProps {
	children: React.ReactNode
	isOpen: boolean
	direction?: 'horizontal' | 'vertical'
	curtainColor?: string
	duration?: number
	className?: string
}

export function CurtainReveal({
	children,
	isOpen,
	direction = 'horizontal',
	curtainColor = 'bg-brand',
	duration = 0.8,
	className,
}: CurtainRevealProps) {
	const isHorizontal = direction === 'horizontal'

	const panelVariants = {
		closed: { [isHorizontal ? 'x' : 'y']: '0%' },
		openA: { [isHorizontal ? 'x' : 'y']: '-100%' },
		openB: { [isHorizontal ? 'x' : 'y']: '100%' },
	}

	return (
		<div className={cn('relative overflow-hidden', className)}>
			<div className='relative z-0'>{children}</div>

			<AnimatePresence>
				<motion.div
					initial='closed'
					animate={isOpen ? 'openA' : 'closed'}
					exit='openA'
					variants={panelVariants}
					transition={{ duration, ease: [0.76, 0, 0.24, 1] }}
					className={cn(
						'absolute z-10',
						curtainColor,
						isHorizontal ? 'inset-y-0 left-0 w-1/2' : 'inset-x-0 top-0 h-1/2',
						isOpen && 'pointer-events-none',
					)}
				/>
				<motion.div
					initial='closed'
					animate={isOpen ? 'openB' : 'closed'}
					exit='openB'
					variants={panelVariants}
					transition={{ duration, ease: [0.76, 0, 0.24, 1] }}
					className={cn(
						'absolute z-10',
						curtainColor,
						isHorizontal
							? 'inset-y-0 right-0 w-1/2'
							: 'inset-x-0 bottom-0 h-1/2',
						isOpen && 'pointer-events-none',
					)}
				/>
			</AnimatePresence>
		</div>
	)
}
