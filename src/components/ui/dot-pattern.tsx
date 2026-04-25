'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface DotPatternProps extends React.SVGAttributes<SVGSVGElement> {
	/** Dot spacing in px. */
	spacing?: number
	/** Dot radius in px. */
	radius?: number
	/** Dot color (CSS value or design token var). */
	color?: string
	/** Radial fade (vignette effect). */
	fade?: boolean
	className?: string
}

/**
 * SVG dot grid background pattern for sections and hero areas.
 * Lightweight, pure SVG — no external dependencies.
 *
 * @example
 * <div className="relative h-96">
 *   <DotPattern fade className="absolute inset-0 opacity-30" />
 *   <div className="relative z-10">Content on dots</div>
 * </div>
 */
export function DotPattern({
	spacing = 20,
	radius = 1,
	color = 'currentColor',
	fade = false,
	className,
	...props
}: DotPatternProps) {
	const id = useId()
	const patternId = `dot-${id}`
	const maskId = `dot-mask-${id}`

	return (
		<svg
			className={cn('pointer-events-none size-full', className)}
			aria-hidden
			{...props}
		>
			<defs>
				<pattern
					id={patternId}
					x={0}
					y={0}
					width={spacing}
					height={spacing}
					patternUnits='userSpaceOnUse'
				>
					<circle cx={spacing / 2} cy={spacing / 2} r={radius} fill={color} />
				</pattern>
				{fade && (
					<radialGradient id={maskId}>
						<stop offset='0%' stopColor='white' />
						<stop offset='100%' stopColor='black' />
					</radialGradient>
				)}
			</defs>
			<rect
				width='100%'
				height='100%'
				fill={`url(#${patternId})`}
				mask={fade ? `url(#${maskId}-mask)` : undefined}
			/>
			{fade && (
				<mask id={`${maskId}-mask`}>
					<rect width='100%' height='100%' fill={`url(#${maskId})`} />
				</mask>
			)}
		</svg>
	)
}
