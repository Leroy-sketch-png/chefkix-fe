'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatItem {
	label: string
	value: string | number
	/** Previous value for trend calculation */
	previousValue?: number
	/** Override trend icon with custom element */
	icon?: React.ReactNode
	/** Suffix like "%" or "XP" */
	suffix?: string
}

interface StatsGridProps {
	stats: StatItem[]
	/** Grid columns: 2, 3, or 4 */
	columns?: 2 | 3 | 4
	className?: string
}

function getTrend(current: string | number, previous?: number) {
	if (previous === undefined) return null
	const cur = typeof current === 'string' ? parseFloat(current) : current
	if (isNaN(cur)) return null
	if (cur > previous) return 'up' as const
	if (cur < previous) return 'down' as const
	return 'flat' as const
}

const trendIcons = {
	up: <TrendingUp className='size-3.5' />,
	down: <TrendingDown className='size-3.5' />,
	flat: <Minus className='size-3.5' />,
}

const trendColors = {
	up: 'text-green-500',
	down: 'text-red-400',
	flat: 'text-text-muted',
}

const colsClass = {
	2: 'grid-cols-2',
	3: 'grid-cols-2 md:grid-cols-3',
	4: 'grid-cols-2 md:grid-cols-4',
}

/**
 * Responsive stat card grid with optional trend indicators.
 * Designed for dashboard KPIs, creator analytics, profile stats.
 */
export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
	return (
		<div className={cn('grid gap-4', colsClass[columns], className)}>
			<AnimatePresence mode='popLayout'>
				{stats.map((stat, i) => {
					const trend = getTrend(stat.value, stat.previousValue)

					return (
						<motion.div
							key={stat.label}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.05, duration: 0.35 }}
							className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card'
						>
							<p className='text-xs font-medium text-text-muted uppercase tracking-wide'>
								{stat.label}
							</p>
							<div className='mt-2 flex items-end gap-2'>
								<span className='text-2xl font-bold text-text tabular-nums'>
									{stat.value}
									{stat.suffix && (
										<span className='ml-0.5 text-sm font-normal text-text-secondary'>
											{stat.suffix}
										</span>
									)}
								</span>
								{stat.icon ??
									(trend && (
										<span
											className={cn(
												'flex items-center pb-1',
												trendColors[trend],
											)}
										>
											{trendIcons[trend]}
										</span>
									))}
							</div>
						</motion.div>
					)
				})}
			</AnimatePresence>
		</div>
	)
}
