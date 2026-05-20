'use client'

import * as React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StackedCardsProps {
	children: React.ReactNode
	stackOffset?: number
	scaleStep?: number
	className?: string
}

export function StackedCards({
	children,
	stackOffset = 20,
	scaleStep = 0.03,
	className,
}: StackedCardsProps) {
	const items = React.Children.toArray(children)
	const containerRef = React.useRef<HTMLDivElement>(null)

	return (
		<div
			ref={containerRef}
			className={cn('relative', className)}
			style={{ height: `${items.length * 100}vh` }}
		>
			{items.map((child, index) => (
				<StackCard
					key={index}
					index={index}
					total={items.length}
					containerRef={containerRef}
					stackOffset={stackOffset}
					scaleStep={scaleStep}
				>
					{child}
				</StackCard>
			))}
		</div>
	)
}

function StackCard({
	children,
	index,
	total,
	containerRef,
	stackOffset,
	scaleStep,
}: {
	children: React.ReactNode
	index: number
	total: number
	containerRef: React.RefObject<HTMLDivElement | null>
	stackOffset: number
	scaleStep: number
}) {
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start start', 'end end'],
	})

	const cardStart = index / total
	const cardEnd = (index + 1) / total
	const targetScale = 1 - (total - 1 - index) * scaleStep
	const scale = useTransform(
		scrollYProgress,
		[cardStart, cardEnd],
		[1, targetScale],
	)
	const y = useTransform(
		scrollYProgress,
		[cardStart, cardEnd],
		[0, -stackOffset * (total - 1 - index)],
	)

	return (
		<motion.div
			style={{
				scale,
				y,
				top: `${index * stackOffset}px`,
			}}
			className='sticky top-0 origin-top px-4'
		>
			{children}
		</motion.div>
	)
}
