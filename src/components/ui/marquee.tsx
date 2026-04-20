'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps {
	children: React.ReactNode
	/** Pixels per second */
	speed?: number
	/** Scroll direction */
	direction?: 'left' | 'right'
	/** Pause on hover */
	pauseOnHover?: boolean
	className?: string
}

/**
 * Infinite scrolling marquee for social proof, trending tags, etc.
 * Requires `@keyframes marquee` in globals.css.
 *
 * @example
 * <Marquee>
 *   <Badge>Trending: Pasta</Badge>
 *   <Badge>Trending: Sushi</Badge>
 * </Marquee>
 */
export function Marquee({
	children,
	speed = 40,
	direction = 'left',
	pauseOnHover = true,
	className,
}: MarqueeProps) {
	const duration = `${100 / (Math.max(speed, 1) / 40)}s`

	return (
		<div
			className={cn(
				'group flex gap-4 overflow-hidden motion-reduce:overflow-auto',
				className,
			)}
			style={
				{
					'--marquee-duration': duration,
					'--marquee-direction': direction === 'left' ? 'normal' : 'reverse',
				} as React.CSSProperties
			}
		>
			{[0, 1].map(i => (
				<div
					key={i}
					className={cn(
						'flex shrink-0 items-center gap-4',
						'animate-marquee motion-reduce:animate-none',
						pauseOnHover && 'group-hover:[animation-play-state:paused]',
					)}
					aria-hidden={i === 1}
				>
					{children}
				</div>
			))}
		</div>
	)
}
