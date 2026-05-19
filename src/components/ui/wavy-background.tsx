'use client'

import * as React from 'react'
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
	const wavePaths = React.useMemo(() => {
		return Array.from({ length: Math.min(layers, colors.length) }, (_, i) => {
			const yOffset = 100 - waveHeight + i * (waveHeight / layers) * 0.6
			const amplitude = 8 - i * 2
			const frequency = 1.5 + i * 0.5
			// Generate a smooth sine-wave path
			const points: string[] = []
			for (let x = 0; x <= 100; x += 2) {
				const y =
					yOffset +
					Math.sin((x / 100) * Math.PI * frequency) * amplitude +
					Math.sin((x / 100) * Math.PI * frequency * 2.3) * (amplitude * 0.4)
				points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`)
			}
			return `${points.join(' ')} L 100 100 L 0 100 Z`
		})
	}, [layers, colors.length, waveHeight])

	return (
		<div
			className={cn(
				'relative flex items-center justify-center overflow-hidden bg-background',
				className,
			)}
		>
			{/* Waves */}
			<svg
				className={cn(
					'absolute inset-x-0 bottom-0 size-full',
					animate && 'animate-wave',
				)}
				viewBox='0 0 100 100'
				preserveAspectRatio='none'
				aria-hidden
			>
				{wavePaths.map((d, i) => (
					<path
						key={i}
						d={d}
						fill={colors[i] ?? colors[colors.length - 1]}
						style={
							animate
								? {
										animation: `wave-shift ${12 + i * 3}s ease-in-out infinite alternate`,
										transformOrigin: 'center',
									}
								: undefined
						}
					/>
				))}
			</svg>

			{/* Content */}
			{children && <div className='relative z-10'>{children}</div>}
		</div>
	)
}

/* Required CSS (add to globals.css):
@keyframes wave-shift {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-5%); }
}
*/
