'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── Props ──────────────────────────────────────────────────────────────
interface AuroraBackgroundProps {
	children?: React.ReactNode
	/** Aurora colors (OKLCH) */
	colors?: string[]
	/** Animation speed multiplier */
	speed?: number
	className?: string
}

// ── Component ──────────────────────────────────────────────────────────
/**
 * Warm kitchen-light background effect for ChefKix.
 * Coral, ember, gold, and berry bands drift behind content without
 * collapsing into generic blue-purple SaaS gradients.
 *
 * @example
 * <AuroraBackground className="min-h-screen">
 *   <h1 className="text-5xl font-bold">Beautiful aurora</h1>
 * </AuroraBackground>
 */
export function AuroraBackground({
	children,
	colors = [
		'var(--color-brand)',
		'var(--color-streak)',
		'var(--color-level)',
		'var(--color-combo)',
	],
	speed = 1,
	className,
}: AuroraBackgroundProps) {
	const baseDuration = 15 / speed

	return (
		<div
			className={cn(
				'relative flex items-center justify-center overflow-hidden bg-background',
				className,
			)}
		>
			{/* Aurora layers */}
			<div className='absolute inset-0' aria-hidden>
				{colors.map((color, i) => (
					<motion.div
						key={i}
						className='absolute -inset-x-1/2 blur-[100px]'
						style={{
							background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
							height: '50%',
							top: `${15 + i * 12}%`,
							opacity: 0.22,
						}}
						animate={{
							x: ['-10%', '10%', '-5%', '15%', '-10%'],
							skewX: [0, 3, -2, 4, 0],
							scaleY: [1, 1.3, 0.8, 1.1, 1],
						}}
						transition={{
							duration: baseDuration + i * 4,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
					/>
				))}

				{/* Top fade */}
				<div className='absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background to-transparent' />
				{/* Bottom fade */}
				<div className='absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background to-transparent' />
			</div>

			{/* Content */}
			{children && <div className='relative z-10'>{children}</div>}
		</div>
	)
}
