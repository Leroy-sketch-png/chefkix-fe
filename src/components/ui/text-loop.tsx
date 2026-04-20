'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TextLoopProps {
	/** Array of text strings to cycle through */
	texts: string[]
	/** Interval in ms between transitions */
	interval?: number
	className?: string
}

/**
 * Rotating text that smoothly transitions between an array of strings.
 * Used for hero section taglines, loading messages, tip cycling.
 */
export function TextLoop({ texts, interval = 3000, className }: TextLoopProps) {
	const [index, setIndex] = React.useState(0)

	React.useEffect(() => {
		if (texts.length <= 1) return
		const id = setInterval(() => {
			setIndex(prev => (prev + 1) % texts.length)
		}, interval)
		return () => clearInterval(id)
	}, [texts.length, interval])

	return (
		<span className={cn('relative inline-flex overflow-hidden', className)}>
			<AnimatePresence mode='wait'>
				<motion.span
					key={texts[index]}
					initial={{ y: '100%', opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: '-100%', opacity: 0 }}
					transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
					className='inline-block'
				>
					{texts[index]}
				</motion.span>
			</AnimatePresence>
		</span>
	)
}
