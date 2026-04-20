'use client'

import * as React from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Skill {
	name: string
	/** 0-100 */
	level: number
	/** Optional override color (CSS value) */
	color?: string
}

interface SkillBarsProps {
	skills: Skill[]
	showPercentage?: boolean
	/** Animation duration in seconds */
	duration?: number
	barHeight?: 'sm' | 'md' | 'lg'
	/** Default bar color */
	color?: string
	className?: string
}

const heightClass = {
	sm: 'h-1.5',
	md: 'h-2.5',
	lg: 'h-4',
}

/**
 * Animated horizontal skill/progress bars.
 * Bars fill on scroll into view. Used for taste dimensions, skill trees, stats.
 */
export function SkillBars({
	skills,
	showPercentage = true,
	duration = 1,
	barHeight = 'md',
	color = 'var(--color-brand)',
	className,
}: SkillBarsProps) {
	const ref = React.useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { once: true })

	return (
		<div ref={ref} className={cn('space-y-5', className)}>
			{skills.map((skill, i) => (
				<div key={skill.name}>
					<div className='mb-1.5 flex items-center justify-between'>
						<span className='text-sm font-medium text-text'>{skill.name}</span>
						{showPercentage && (
							<span className='text-xs text-text-muted'>{skill.level}%</span>
						)}
					</div>
					<div
						className={cn(
							'overflow-hidden rounded-full bg-bg-elevated',
							heightClass[barHeight],
						)}
					>
						<motion.div
							initial={{ width: 0 }}
							animate={inView ? { width: `${skill.level}%` } : { width: 0 }}
							transition={{
								duration,
								delay: i * 0.1,
								ease: [0.21, 0.47, 0.32, 0.98],
							}}
							className='h-full rounded-full'
							style={{ backgroundColor: skill.color ?? color }}
						/>
					</div>
				</div>
			))}
		</div>
	)
}
