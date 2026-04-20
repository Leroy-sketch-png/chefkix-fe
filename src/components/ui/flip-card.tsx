'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FlipCardProps {
	front: React.ReactNode
	back: React.ReactNode
	trigger?: 'hover' | 'click'
	direction?: 'horizontal' | 'vertical'
	className?: string
}

export function FlipCard({
	front,
	back,
	trigger = 'hover',
	direction = 'horizontal',
	className,
}: FlipCardProps) {
	const [isFlipped, setIsFlipped] = React.useState(false)

	const rotateAxis = direction === 'horizontal' ? 'rotateY' : 'rotateX'
	const flipAngle = isFlipped ? 180 : 0

	const handlers =
		trigger === 'hover'
			? {
					onMouseEnter: () => setIsFlipped(true),
					onMouseLeave: () => setIsFlipped(false),
				}
			: {
					onClick: () => setIsFlipped(f => !f),
				}

	return (
		<div
			className={cn('relative cursor-pointer', className)}
			style={{ perspective: '1000px' }}
			{...handlers}
		>
			<motion.div
				animate={{ [rotateAxis]: flipAngle }}
				transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
				className='relative size-full'
				style={{ transformStyle: 'preserve-3d' }}
			>
				<div
					className='absolute inset-0 overflow-hidden'
					style={{ backfaceVisibility: 'hidden' }}
				>
					{front}
				</div>
				<div
					className='absolute inset-0 overflow-hidden'
					style={{
						backfaceVisibility: 'hidden',
						transform:
							rotateAxis === 'rotateY' ? 'rotateY(180deg)' : 'rotateX(180deg)',
					}}
				>
					{back}
				</div>
			</motion.div>
		</div>
	)
}
