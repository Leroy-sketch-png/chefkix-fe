'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface NoiseOverlayProps {
	opacity?: number
	frequency?: number
	blendMode?: React.CSSProperties['mixBlendMode']
	className?: string
}

export function NoiseOverlay({
	opacity = 0.04,
	frequency = 0.65,
	blendMode = 'overlay',
	className,
}: NoiseOverlayProps) {
	const id = React.useId()

	return (
		<div
			className={cn('pointer-events-none absolute inset-0', className)}
			style={{ opacity, mixBlendMode: blendMode }}
			aria-hidden
		>
			<svg className='size-full' xmlns='http://www.w3.org/2000/svg'>
				<filter id={`noise-${id}`}>
					<feTurbulence
						type='fractalNoise'
						baseFrequency={frequency}
						numOctaves={4}
						stitchTiles='stitch'
						seed={0}
					/>
					<feColorMatrix type='saturate' values='0' />
				</filter>
				<rect width='100%' height='100%' filter={`url(#noise-${id})`} />
			</svg>
		</div>
	)
}
