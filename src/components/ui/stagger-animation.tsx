'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StaggerContainerProps {
	children: ReactNode
	className?: string
	staggerDelay?: number
}

export const StaggerContainer = ({
	children,
	className,
	staggerDelay = 0.1,
}: StaggerContainerProps) => {
	return (
		<motion.div
			className={className}
			initial='hidden'
			animate='visible'
			variants={{
				hidden: { opacity: 0 },
				visible: {
					opacity: 1,
					transition: {
						staggerChildren: staggerDelay,
					},
				},
			}}
		>
			{children}
		</motion.div>
	)
}

export const staggerItemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.4,
			ease: 'easeOut' as const,
		},
	},
}
