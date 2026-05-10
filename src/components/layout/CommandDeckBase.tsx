'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
	label: string
	value: string | number
	icon?: ReactNode
	tone?: 'brand' | 'info' | 'success' | 'xp' | 'streak' | 'error' | 'muted'
}

interface CommandDeckBaseProps {
	eyebrow: string
	title: string
	subtitle?: string
	stats?: StatCardProps[]
	controls?: ReactNode
	children?: ReactNode
	gradient?: 'brand' | 'info' | 'success' | 'xp' | 'error'
	className?: string
}

// Stat card for command decks — standardized across all routes
export function CommandDeckStatCard({
	label,
	value,
	icon,
	tone = 'muted',
}: StatCardProps) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		info: 'border-info/20 bg-info/8 text-info',
		success: 'border-success/20 bg-success/8 text-success',
		xp: 'border-xp/20 bg-xp/8 text-xp',
		streak: 'border-streak/20 bg-streak/8 text-streak',
		error: 'border-error/20 bg-error/8 text-error',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-xl border border-border-subtle bg-bg-card p-3 shadow-card'>
			<div className='flex items-center justify-between gap-2'>
				<div className='flex-1'>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1.5 text-xl font-black tabular-nums text-text-primary'>
						{value}
					</p>
				</div>
				{icon && (
					<div className={cn('rounded-md border p-1.5', toneClass)}>{icon}</div>
				)}
			</div>
		</div>
	)
}

export function CommandDeckStatGrid({
	stats,
	className,
}: {
	stats: StatCardProps[]
	className?: string
}) {
	return (
		<div className={cn('grid grid-cols-2 gap-2 lg:grid-cols-4', className)}>
			{stats.map((stat, idx) => (
				<CommandDeckStatCard key={idx} {...stat} />
			))}
		</div>
	)
}

// Base command deck wrapper — use this for all route command surfaces
export function CommandDeckBase({
	eyebrow,
	title,
	subtitle,
	stats,
	controls,
	children,
	gradient = 'brand',
	className,
}: CommandDeckBaseProps) {
	const gradientClass = {
		brand: 'to-brand/8',
		info: 'to-info/8',
		success: 'to-success/8',
		xp: 'to-xp/6',
		error: 'to-error/8',
	}[gradient]

	const eyebrowClass = {
		brand: 'text-brand',
		info: 'text-info',
		success: 'text-success',
		xp: 'text-xp',
		error: 'text-error',
	}[gradient]

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card',
				gradientClass,
				'p-4 shadow-card md:p-5',
				className,
			)}
		>
			{/* Header */}
			<div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<p
						className={cn(
							'text-[11px] font-bold uppercase tracking-[0.16em]',
							eyebrowClass,
						)}
					>
						{eyebrow}
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>{title}</h2>
					{subtitle && (
						<p className='mt-1 text-xs text-text-secondary'>{subtitle}</p>
					)}
				</div>
				{controls && <div className='flex flex-wrap gap-2'>{controls}</div>}
			</div>

			{/* Stats grid */}
			{stats && <CommandDeckStatGrid stats={stats} />}

			{/* Children (for custom layouts) */}
			{children && <div className='mt-4'>{children}</div>}
		</motion.section>
	)
}
