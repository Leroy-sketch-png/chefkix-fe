'use client'

import { useEffect, useState } from 'react'
import { useMotionValue, useTransform, animate } from 'framer-motion'

interface AnimatedNumberProps {
	value: number
	duration?: number
	className?: string
	/** Format function (e.g. for compact notation: 1.2K) */
	format?: (n: number) => string
}

/**
 * Smoothly animates number transitions (count up/down).
 * Used for likes, followers, XP, and other dynamic counts.
 */
export function AnimatedNumber({
	value,
	duration = 0.6,
	className,
	format,
}: AnimatedNumberProps) {
	const motionValue = useMotionValue(0)
	const rounded = useTransform(motionValue, (latest) => Math.round(latest))
	const [display, setDisplay] = useState(value)

	useEffect(() => {
		const controls = animate(motionValue, value, {
			duration,
			ease: 'easeOut',
		})
		const unsubscribe = rounded.on('change', (v) => setDisplay(v))
		return () => {
			controls.stop()
			unsubscribe()
		}
	}, [value, duration, motionValue, rounded])

	return <span className={className}>{format ? format(display) : display}</span>
}
