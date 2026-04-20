'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpotlightProps {
	children: React.ReactNode
	size?: number
	color?: string
	opacity?: number
	className?: string
}

export function Spotlight({
	children,
	size = 300,
	color = 'var(--color-brand)',
	opacity = 0.1,
	className,
}: SpotlightProps) {
	const containerRef = React.useRef<HTMLDivElement>(null)
	const [position, setPosition] = React.useState({ x: 0, y: 0 })
	const [isHovered, setIsHovered] = React.useState(false)

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const el = containerRef.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		setPosition({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		})
	}

	return (
		<div
			ref={containerRef}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={cn('relative overflow-hidden', className)}
		>
			<div
				className='pointer-events-none absolute inset-0 z-10 transition-opacity duration-300'
				style={{
					opacity: isHovered ? opacity : 0,
					background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, ${color} 0%, transparent 70%)`,
					mixBlendMode: 'soft-light',
				}}
				aria-hidden
			/>
			<div className='relative z-20'>{children}</div>
		</div>
	)
}
