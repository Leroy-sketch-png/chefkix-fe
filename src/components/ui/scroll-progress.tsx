'use client'

import * as React from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScrollProgressProps {
	position?: 'top' | 'bottom'
	height?: number
	color?: string
	className?: string
}

/**
 * Thin progress bar showing page scroll position.
 * Great for long recipe pages and articles.
 *
 * @example
 * <ScrollProgress />
 * <ScrollProgress position="bottom" color="var(--color-brand)" />
 */
export function ScrollProgress({
	position = 'top',
	height = 3,
	color,
	className,
}: ScrollProgressProps) {
	const { scrollYProgress } = useScroll()
	const scaleX = useSpring(scrollYProgress, { damping: 30, stiffness: 200 })

	return (
		<motion.div
			style={{
				scaleX,
				transformOrigin: 'left',
				height,
				...(color && { backgroundColor: color }),
			}}
			className={cn(
				'fixed left-0 right-0 z-sticky bg-brand',
				position === 'top' ? 'top-0' : 'bottom-0',
				className,
			)}
			aria-hidden
		/>
	)
}
