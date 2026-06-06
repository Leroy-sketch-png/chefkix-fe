'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SpotlightCardsProps {
	children: React.ReactNode
	columns?: 2 | 3 | 4
	dimAmount?: number
	className?: string
}

/**
 * Grid that spotlights the hovered card by dimming siblings.
 * Useful for premium feature panels where one card should command focus.
 */
export function SpotlightCards({
	children,
	columns = 3,
	dimAmount = 0.35,
	className,
}: SpotlightCardsProps) {
	const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
	const items = React.Children.toArray(children)

	const colClass = {
		2: 'grid-cols-1 md:grid-cols-2',
		3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
	}

	return (
		<div
			className={cn('grid gap-6', colClass[columns], className)}
			onMouseLeave={() => setHoveredIndex(null)}
		>
			{items.map((child, index) => (
				<motion.div
					key={index}
					onMouseEnter={() => setHoveredIndex(index)}
					animate={{
						opacity:
							hoveredIndex === null || hoveredIndex === index ? 1 : dimAmount,
						scale: hoveredIndex === index ? 1.02 : 1,
					}}
					transition={{ duration: 0.25 }}
				>
					{child}
				</motion.div>
			))}
		</div>
	)
}
