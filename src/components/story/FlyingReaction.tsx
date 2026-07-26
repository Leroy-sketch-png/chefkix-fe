import { motion } from 'framer-motion'
import React from 'react'

interface FlyingReactionProps {
	id: number
	icon: React.ReactNode
	xOffset: number
	onAnimationComplete: (id: number) => void
}

export default function FlyingReaction({
	id,
	icon,
	xOffset,
	onAnimationComplete,
}: FlyingReactionProps) {
	return (
		<motion.div
			key={id}
			initial={{
				opacity: 1,
				y: 0,
				x: xOffset,
				scale: 1,
			}}
			animate={{
				opacity: 0,
				y: -300,
				x: xOffset + (Math.random() * 40 - 20),
				scale: 2,
			}}
			transition={{
				duration: 1.5,
				ease: 'easeOut',
			}}
			onAnimationComplete={() => onAnimationComplete(id)}
			className='absolute bottom-16 pointer-events-none z-50 text-2xl'
		>
			{icon}
		</motion.div>
	)
}
