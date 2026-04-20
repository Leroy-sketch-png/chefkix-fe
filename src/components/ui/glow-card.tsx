'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlowCardProps {
	children: React.ReactNode
	/** Glow color (CSS color value) */
	color?: string
	/** Glow radius in pixels */
	radius?: number
	/** Glow intensity (0-1) */
	intensity?: number
	className?: string
}

/**
 * Card with a mouse-tracking radial glow effect.
 * Subtle warmth on hover — premium feel without being distracting.
 */
export function GlowCard({
	children,
	color = 'var(--color-brand)',
	radius = 200,
	intensity = 0.3,
	className,
}: GlowCardProps) {
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
			className={cn('group relative', className)}
		>
			<div
				className='pointer-events-none absolute -inset-px z-0 rounded-radius transition-opacity duration-300'
				style={{
					opacity: isHovered ? intensity : 0,
					background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, ${color}, transparent 70%)`,
				}}
				aria-hidden
			/>
			<div className='relative z-10 overflow-hidden rounded-radius border border-border-subtle bg-bg-card'>
				{children}
			</div>
		</div>
	)
}
