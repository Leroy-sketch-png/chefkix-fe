'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AnimatedGradientTextProps {
	children: React.ReactNode
	/** Gradient start color */
	from?: string
	/** Gradient middle color */
	via?: string
	/** Gradient end color */
	to?: string
	/** Animation duration in seconds */
	duration?: number
	className?: string
}

/**
 * Text with an animated gradient sweep effect.
 * Used for level-up announcements, achievement titles, premium badges.
 */
export function AnimatedGradientText({
	children,
	from = 'var(--color-brand)',
	via = 'var(--color-level)',
	to = 'var(--color-xp)',
	duration = 4,
	className,
}: AnimatedGradientTextProps) {
	return (
		<span
			className={cn(
				'inline-block bg-clip-text text-transparent animate-gradient-text',
				className,
			)}
			style={{
				backgroundImage: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${from})`,
				backgroundSize: '300% 100%',
				animationDuration: `${duration}s`,
			}}
		>
			{children}
		</span>
	)
}
