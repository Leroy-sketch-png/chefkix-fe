'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BorderBeamProps {
	children: React.ReactNode
	/** Beam start color */
	color?: string
	/** Beam end color */
	colorTo?: string
	/** Animation duration in seconds */
	duration?: number
	/** Length of the beam in px */
	beamSize?: number
	/** Border width */
	borderWidth?: number
	className?: string
}

/**
 * Animated border beam effect — a glowing light that travels along the border.
 * Used for featured cards, premium content, achievement unlocks.
 */
export function BorderBeam({
	children,
	color = 'var(--color-brand)',
	colorTo = 'var(--color-level)',
	duration = 6,
	beamSize = 80,
	borderWidth = 1,
	className,
}: BorderBeamProps) {
	const id = React.useId()

	return (
		<div className={cn('relative overflow-hidden rounded-radius', className)}>
			<div
				className='absolute inset-0 z-0 rounded-radius border border-border-subtle'
				aria-hidden
			/>
			<svg
				className='pointer-events-none absolute inset-0 z-10 size-full'
				aria-hidden
			>
				<rect
					width='100%'
					height='100%'
					fill='none'
					stroke={`url(#beam-gradient-${id})`}
					strokeWidth={borderWidth * 2}
					strokeDasharray={`${beamSize} 1000`}
					strokeLinecap='round'
					className='animate-border-beam'
					style={{ animationDuration: `${duration}s` }}
					pathLength={1000 + beamSize}
					rx='var(--radius)'
					ry='var(--radius)'
				/>
				<defs>
					<linearGradient id={`beam-gradient-${id}`}>
						<stop stopColor={color} stopOpacity={0} />
						<stop offset='0.5' stopColor={color} />
						<stop offset='1' stopColor={colorTo} stopOpacity={0} />
					</linearGradient>
				</defs>
			</svg>
			<div className='relative z-20'>{children}</div>
		</div>
	)
}
