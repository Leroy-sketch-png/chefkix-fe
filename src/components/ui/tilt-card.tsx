'use client'

import * as React from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TiltCardProps {
	children: React.ReactNode
	maxTilt?: number
	perspective?: number
	scale?: number
	glare?: boolean
	glareOpacity?: number
	className?: string
}

export function TiltCard({
	children,
	maxTilt = 10,
	perspective = 1000,
	scale = 1.02,
	glare = true,
	glareOpacity = 0.15,
	className,
}: TiltCardProps) {
	const ref = React.useRef<HTMLDivElement>(null)

	const xPct = useMotionValue(0.5)
	const yPct = useMotionValue(0.5)
	const isHovered = useMotionValue(0)

	const rotateX = useSpring(useTransform(yPct, [0, 1], [maxTilt, -maxTilt]), {
		stiffness: 200,
		damping: 20,
	})
	const rotateY = useSpring(useTransform(xPct, [0, 1], [-maxTilt, maxTilt]), {
		stiffness: 200,
		damping: 20,
	})
	const scaleVal = useSpring(useTransform(isHovered, [0, 1], [1, scale]), {
		stiffness: 200,
		damping: 20,
	})

	const glareX = useTransform(xPct, [0, 1], [0, 100])
	const glareY = useTransform(yPct, [0, 1], [0, 100])
	const glareOp = useTransform(isHovered, [0, 1], [0, glareOpacity])
	const glareBg = useTransform(
		[glareX, glareY],
		([x, y]) =>
			`radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.5) 0%, transparent 60%)`,
	)

	const onMove = (e: React.MouseEvent) => {
		const el = ref.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		xPct.set((e.clientX - rect.left) / rect.width)
		yPct.set((e.clientY - rect.top) / rect.height)
	}

	return (
		<motion.div
			ref={ref}
			onMouseMove={onMove}
			onMouseEnter={() => isHovered.set(1)}
			onMouseLeave={() => {
				isHovered.set(0)
				xPct.set(0.5)
				yPct.set(0.5)
			}}
			style={{
				perspective,
				rotateX,
				rotateY,
				scale: scaleVal,
				transformStyle: 'preserve-3d',
			}}
			className={cn('relative', className)}
		>
			{children}
			{glare && (
				<motion.div
					className='pointer-events-none absolute inset-0 rounded-[inherit]'
					style={{
						opacity: glareOp,
						background: glareBg,
					}}
					aria-hidden
				/>
			)}
		</motion.div>
	)
}
