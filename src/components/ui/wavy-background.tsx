'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── Props ──────────────────────────────────────────────────────────────
interface WavyBackgroundProps {
	children?: React.ReactNode
	/** Wave colors (bottom to top layering) */
	colors?: string[]
	/** Number of wave layers */
	layers?: number
	/** Animate wave motion */
	animate?: boolean
	/** Wave height percentage */
	waveHeight?: number
	className?: string
}

// ── Component ──────────────────────────────────────────────────────────
/**
 * SVG animated wave background.
 * Stacked sine-wave layers with optional CSS animation.
 * The section divider / hero background from creative landing pages.
 *
 * @example
 * <WavyBackground className="min-h-screen">
 *   <h1 className="text-5xl font-bold">Ride the wave</h1>
 * </WavyBackground>
 *
 * // Custom colors
 * <WavyBackground
 *   colors={["oklch(0.7 0.25 270 / 30%)", "oklch(0.6 0.3 330 / 20%)"]}
 *   layers={3}
 * />
 */
export function WavyBackground({
	children,
	colors = [
		'oklch(from var(--primary) l c h / 15%)',
		'oklch(from var(--primary) l c h / 10%)',
		'oklch(from var(--primary) l c h / 5%)',
	],
	layers = 3,
	animate = true,
	waveHeight = 30,
	className,
}: WavyBackgroundProps) {
	const prefersReducedMotion = useReducedMotion()
	const shouldAnimate = animate && !prefersReducedMotion

	const overscan = 35
	const startX = -overscan
	const endX = 100 + overscan
	const viewBoxWidth = 100 + overscan * 2

	const wavePaths = React.useMemo(() => {
		return Array.from({ length: Math.min(layers, colors.length) }, (_, i) => {
			const yOffset = 100 - waveHeight + i * (waveHeight / layers) * 0.6
			const amplitude = 8 - i * 2
			const frequency = 1.5 + i * 0.5
			// Generate a smooth sine-wave path
			const points: string[] = []
			for (let x = startX; x <= endX; x += 2) {
				const y =
					yOffset +
					Math.sin((x / 100) * Math.PI * frequency) * amplitude +
					Math.sin((x / 100) * Math.PI * frequency * 2.3) * (amplitude * 0.4)
				points.push(`${x === startX ? 'M' : 'L'} ${x} ${y}`)
			}
			return `${points.join(' ')} L ${endX} 100 L ${startX} 100 Z`
		})
	}, [layers, colors.length, waveHeight, startX, endX])

	return (
		<div
			className={cn(
				'relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-background',
				className,
			)}
		>
			{/* Waves */}
			<motion.svg
				className='pointer-events-none absolute inset-x-1/2 bottom-0 h-full w-[calc(100vw+16rem)] max-w-none -translate-x-1/2'
				viewBox={`${startX} 0 ${viewBoxWidth} 100`}
				preserveAspectRatio='none'
				animate={
					shouldAnimate
						? {
								x: [-40, 40, -40],
								y: [8, -8, 8],
							}
						: undefined
				}
				transition={
					shouldAnimate
						? {
								duration: 8,
								ease: 'easeInOut',
								repeat: Number.POSITIVE_INFINITY,
							}
						: undefined
				}
				aria-hidden
			>
				{wavePaths.map((d, i) => (
					<path key={i} d={d} fill={colors[i] ?? colors[colors.length - 1]}>
						{shouldAnimate && (
							<animate
								attributeName='opacity'
								values='1;0.93;1'
								dur={`${6 + i * 1.4}s`}
								repeatCount='indefinite'
							/>
						)}
					</path>
				))}
			</motion.svg>

			{/* Content */}
			{children && (
				<div className='relative z-10 flex w-full items-center justify-center'>
					{children}
				</div>
			)}
		</div>
	)
}
