'use client'

import * as React from 'react'
import { motion, useSpring, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NumberTickerProps {
	/** Target value */
	value: number
	/** Starting value (default 0) */
	from?: number
	/** Decimal places */
	decimals?: number
	/** Prefix (e.g. "$") */
	prefix?: string
	/** Suffix (e.g. "%", "k", "+") */
	suffix?: string
	/** Duration in seconds */
	duration?: number
	/** Animate once when in view */
	once?: boolean
	/** Format with locale separators */
	locale?: string
	className?: string
}

/**
 * Animated number counter with spring physics.
 * Numbers roll/tick up with smooth easing — the premium stats effect.
 *
 * @example
 * <NumberTicker value={10583} prefix="$" />
 * <NumberTicker value={99.9} suffix="%" decimals={1} />
 */
export function NumberTicker({
	value,
	from = 0,
	decimals = 0,
	prefix = '',
	suffix = '',
	duration = 2,
	once = true,
	locale,
	className,
}: NumberTickerProps) {
	const ref = React.useRef<HTMLSpanElement>(null)
	const inView = useInView(ref, { once, margin: '0px 0px -40px 0px' })
	const motionValue = useSpring(from, {
		duration: duration * 1000,
		bounce: 0,
	})
	const [display, setDisplay] = React.useState(
		formatNum(from, decimals, locale),
	)

	React.useEffect(() => {
		if (inView) motionValue.set(value)
	}, [inView, value, motionValue])

	React.useEffect(() => {
		return motionValue.on('change', v => {
			setDisplay(formatNum(v, decimals, locale))
		})
	}, [motionValue, decimals, locale])

	return (
		<motion.span ref={ref} className={cn('tabular-nums', className)}>
			{prefix}
			{display}
			{suffix}
		</motion.span>
	)
}

function formatNum(n: number, decimals: number, locale?: string): string {
	if (locale) {
		return n.toLocaleString(locale, {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		})
	}
	return n.toFixed(decimals)
}
