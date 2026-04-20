'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SparklesEffectProps {
	children?: React.ReactNode
	/** Sparkle color (CSS value) */
	color?: string
	/** Number of sparkles */
	count?: number
	/** Min sparkle size in px */
	minSize?: number
	/** Max sparkle size in px */
	maxSize?: number
	className?: string
}

interface Sparkle {
	id: string
	x: number
	y: number
	size: number
	delay: number
	duration: number
}

function randomBetween(min: number, max: number) {
	return Math.random() * (max - min) + min
}

function generateSparkle(minSize: number, maxSize: number): Sparkle {
	return {
		id: crypto.randomUUID(),
		x: randomBetween(0, 100),
		y: randomBetween(0, 100),
		size: randomBetween(minSize, maxSize),
		delay: randomBetween(0, 3),
		duration: randomBetween(1, 2.5),
	}
}

/**
 * Sparkle / glitter particle overlay around content.
 * Use for premium badges, level-ups, XP celebrations.
 *
 * @example
 * <SparklesEffect color="var(--color-xp)">
 *   <span className="font-bold">+250 XP</span>
 * </SparklesEffect>
 */
export function SparklesEffect({
	children,
	color = 'var(--color-level)',
	count = 12,
	minSize = 6,
	maxSize = 14,
	className,
}: SparklesEffectProps) {
	const prefersReduced = useReducedMotion()
	const [sparkles, setSparkles] = React.useState<Sparkle[]>([])

	React.useEffect(() => {
		setSparkles(
			Array.from({ length: count }, () => generateSparkle(minSize, maxSize)),
		)

		if (prefersReduced) return

		const interval = setInterval(() => {
			setSparkles(prev =>
				prev.map(s => {
					if (Math.random() > 0.3) return s
					return generateSparkle(minSize, maxSize)
				}),
			)
		}, 2000)

		return () => clearInterval(interval)
	}, [count, minSize, maxSize, prefersReduced])

	return (
		<span className={cn('relative inline-block', className)}>
			<span className='pointer-events-none absolute inset-0' aria-hidden>
				<AnimatePresence>
					{sparkles.map(sparkle => (
						<motion.svg
							key={sparkle.id}
							className='absolute'
							style={{
								left: `${sparkle.x}%`,
								top: `${sparkle.y}%`,
								width: sparkle.size,
								height: sparkle.size,
							}}
							viewBox='0 0 24 24'
							fill={color}
							initial={{ scale: 0, opacity: 0, rotate: 0 }}
							animate={{
								scale: [0, 1, 0],
								opacity: [0, 1, 0],
								rotate: [0, 180],
							}}
							transition={{
								duration: sparkle.duration,
								delay: sparkle.delay,
								repeat: Infinity,
								ease: 'easeInOut',
							}}
						>
							<path d='M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z' />
						</motion.svg>
					))}
				</AnimatePresence>
			</span>
			<span className='relative z-10'>{children}</span>
		</span>
	)
}
