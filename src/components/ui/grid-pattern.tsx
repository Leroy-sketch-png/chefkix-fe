'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GridPatternProps extends React.SVGAttributes<SVGSVGElement> {
	size?: number
	strokeWidth?: number
	color?: string
	highlighted?: [number, number][]
	highlightColor?: string
	fade?: boolean
	className?: string
}

export function GridPattern({
	size = 40,
	strokeWidth = 1,
	color = 'currentColor',
	highlighted = [],
	highlightColor = 'currentColor',
	fade = false,
	className,
	...props
}: GridPatternProps) {
	const id = React.useId()
	const patternId = `grid-pattern-${id}`
	const maskId = `grid-mask-${id}`

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
					width={size}
					height={size}
					patternUnits='userSpaceOnUse'
				>
					<path
						d={`M ${size} 0 L 0 0 0 ${size}`}
						fill='none'
						stroke={color}
						strokeWidth={strokeWidth}
						opacity={0.15}
					/>
				</pattern>
				{fade && (
					<radialGradient id={maskId}>
						<stop offset='0%' stopColor='white' />
						<stop offset='100%' stopColor='white' stopOpacity='0' />
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

			{highlighted.map(([x, y], i) => (
				<rect
					key={i}
					x={x * size}
					y={y * size}
					width={size}
					height={size}
					fill={highlightColor}
					opacity={0.1}
				/>
			))}
		</svg>
	)
}
