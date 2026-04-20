'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Stat {
	/** Target numeric value. */
	value: number
	/** Label below the number. */
	label: string
	/** Prefix before number (e.g., "★ "). */
	prefix?: string
	/** Suffix after number (e.g., "+", "%"). */
	suffix?: string
	/** Decimal places (default: 0 = integer). */
	decimals?: number
}

interface CountUpStatsProps {
	stats: Stat[]
	/** Grid columns. */
	columns?: 2 | 3 | 4
	/** Animation duration in seconds. */
	duration?: number
	className?: string
}

/**
 * Statistics grid with count-up numbers on scroll.
 * Numbers animate from 0 → target using spring physics when in view.
 *
 * @example
 * <CountUpStats stats={[
 *   { value: 12500, label: "Recipes Cooked", suffix: "+" },
 *   { value: 4.8, label: "Avg Rating", prefix: "★ ", decimals: 1 },
 * ]} />
 */
export function CountUpStats({
	stats,
	columns = 4,
	duration = 2,
	className,
}: CountUpStatsProps) {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { once: true, margin: '-80px' })

	const colClass = {
		2: 'grid-cols-2',
		3: 'grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-2 lg:grid-cols-4',
	}

	return (
		<div
			ref={ref}
			className={cn('grid gap-6 text-center', colClass[columns], className)}
		>
			{stats.map(stat => (
				<StatItem
					key={stat.label}
					stat={stat}
					isInView={isInView}
					duration={duration}
				/>
			))}
		</div>
	)
}

function StatItem({
	stat,
	isInView,
	duration,
}: {
	stat: Stat
	isInView: boolean
	duration: number
}) {
	const motionValue = useMotionValue(0)
	const spring = useSpring(motionValue, {
		duration: duration * 1000,
		bounce: 0,
	})
	const [display, setDisplay] = useState('0')

	useEffect(() => {
		if (isInView) motionValue.set(stat.value)
	}, [isInView, motionValue, stat.value])

	useEffect(() => {
		const unsubscribe = spring.on('change', latest => {
			setDisplay(
				stat.decimals != null
					? latest.toFixed(stat.decimals)
					: Math.round(latest).toLocaleString(),
			)
		})
		return unsubscribe
	}, [spring, stat.decimals])

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={isInView ? { opacity: 1, y: 0 } : {}}
			transition={{ duration: 0.4 }}
			className='space-y-1'
		>
			<p className='text-3xl font-bold tracking-tight text-text md:text-4xl'>
				{stat.prefix}
				{display}
				{stat.suffix}
			</p>
			<p className='text-sm text-text-secondary'>{stat.label}</p>
		</motion.div>
	)
}
