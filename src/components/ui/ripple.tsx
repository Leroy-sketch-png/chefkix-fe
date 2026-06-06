import React, { type ComponentPropsWithoutRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface RippleProps extends ComponentPropsWithoutRef<'div'> {
	mainCircleSize?: number
	mainCircleOpacity?: number
	numCircles?: number
}

export const Ripple = React.memo(function Ripple({
	mainCircleSize = 48,
	mainCircleOpacity = 0.24,
	numCircles = 4,
	className,
	...props
}: RippleProps) {
	return (
		<div
			className={cn(
				'pointer-events-none absolute inset-0 select-none',
				className,
			)}
			{...props}
		>
			{Array.from({ length: numCircles }, (_, i) => {
				const size = mainCircleSize + i * 34
				const opacity = mainCircleOpacity - i * 0.04
				const animationDelay = `${i * 0.1}s`

				return (
					<div
						key={i}
						className='animate-ripple absolute rounded-full border bg-brand/20 shadow-xl'
						style={
							{
								'--i': i,
								width: `${size}px`,
								height: `${size}px`,
								opacity,
								animationDelay,
								borderStyle: 'solid',
								borderWidth: '1px',
								borderColor: 'var(--color-brand)',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%) scale(1)',
							} as CSSProperties
						}
					/>
				)
			})}
		</div>
	)
})

Ripple.displayName = 'Ripple'
