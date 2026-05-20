'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MeshGradientProps {
	children?: React.ReactNode
	colors?: string[]
	speed?: number
	opacity?: number
	className?: string
}

export function MeshGradient({
	children,
	colors = [
		'oklch(0.75 0.15 25)',
		'oklch(0.72 0.12 55)',
		'oklch(0.68 0.10 15)',
		'oklch(0.78 0.08 80)',
	],
	speed = 1,
	opacity = 0.12,
	className,
}: MeshGradientProps) {
	const baseDuration = 20 / speed

	return (
		<div className={cn('relative overflow-hidden bg-bg', className)}>
			<div className='pointer-events-none absolute inset-0' aria-hidden>
				{colors.map((color, index) => {
					const size = 50 + (index % 2) * 20
					return (
						<motion.div
							key={index}
							className='absolute rounded-full mix-blend-screen blur-[90px] dark:mix-blend-normal'
							style={{
								width: `${size}%`,
								height: `${size}%`,
								background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
								opacity,
							}}
							animate={{
								x: [
									`${-20 + index * 15}%`,
									`${20 - index * 10}%`,
									`${-10 + index * 5}%`,
								],
								y: [
									`${-10 + index * 10}%`,
									`${30 - index * 5}%`,
									`${-10 + index * 10}%`,
								],
								scale: [1, 1.15, 0.95, 1],
							}}
							transition={{
								duration: baseDuration + index * 5,
								repeat: Infinity,
								ease: 'easeInOut',
							}}
						/>
					)
				})}
			</div>

			{children ? <div className='relative z-10'>{children}</div> : null}
		</div>
	)
}
