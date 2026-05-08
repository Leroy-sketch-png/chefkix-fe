import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SurfaceTone = 'brand' | 'xp' | 'success' | 'streak' | 'blue'

interface SurfaceSectionHeaderProps {
	eyebrow: string
	chipText?: string
	className?: string
	chipClassName?: string
}

interface PremiumSurfaceProps {
	children: ReactNode
	className?: string
	contentClassName?: string
	eyebrow?: string
	chipText?: string
	chipClassName?: string
	tone?: SurfaceTone
	showOrbs?: boolean
}

const toneClasses: Record<
	SurfaceTone,
	{ left: string; right: string; border: string; gradient: string }
> = {
	brand: {
		left: 'bg-brand/12',
		right: 'bg-xp/10',
		border: 'border-brand/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	xp: {
		left: 'bg-xp/14',
		right: 'bg-brand/10',
		border: 'border-xp/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	success: {
		left: 'bg-brand/10',
		right: 'bg-success/12',
		border: 'border-success/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	streak: {
		left: 'bg-streak/14',
		right: 'bg-brand/10',
		border: 'border-streak/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	blue: {
		left: 'bg-brand/8',
		right: 'bg-info/14',
		border: 'border-info/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
}

export function SurfaceSectionHeader({
	eyebrow,
	chipText,
	className,
	chipClassName,
}: SurfaceSectionHeaderProps) {
	return (
		<div className={cn('flex items-center justify-between gap-3', className)}>
			<p className='text-[10.5px] font-bold uppercase tracking-[0.2em] text-text-muted'>
				{eyebrow}
			</p>
			{chipText ? (
				<span
					className={cn(
						'inline-flex h-6 items-center rounded-full border border-border-subtle/80 bg-gradient-to-r from-bg-card to-bg-elevated px-3 text-[11px] font-semibold text-text-secondary tabular-nums shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
						chipClassName,
					)}
				>
					{chipText}
				</span>
			) : null}
		</div>
	)
}

export function PremiumSurface({
	children,
	className,
	contentClassName,
	eyebrow,
	chipText,
	chipClassName,
	tone = 'brand',
	showOrbs = true,
}: PremiumSurfaceProps) {
	const orbs = toneClasses[tone]

	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-3xl border bg-gradient-to-br p-3 shadow-card backdrop-blur-sm transition-colors duration-300',
				orbs.gradient,
				orbs.border,
				className,
			)}
		>
			{showOrbs ? (
				<>
					{/* Primary orb — top-left */}
					<div
						className={cn(
							'pointer-events-none absolute -left-12 -top-14 size-36 rounded-full blur-3xl',
							orbs.left,
						)}
					/>
					{/* Secondary orb — bottom-right */}
					<div
						className={cn(
							'pointer-events-none absolute -bottom-18 -right-14 size-36 rounded-full blur-3xl',
							orbs.right,
						)}
					/>
					{/* Micro orb — center for depth */}
					<div
						className={cn(
							'pointer-events-none absolute left-1/2 top-1/3 size-20 -translate-x-1/2 rounded-full blur-2xl opacity-40',
							orbs.left,
						)}
					/>
				</>
			) : null}

			{/* Top sheen — double gradient for glass depth */}
			<div className='pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/30 via-white/10 to-transparent dark:from-white/8 dark:via-white/3' />

			{/* Subtle inner border highlight */}
			<div className='pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 dark:ring-white/8' />

			<div className={cn('relative z-10', contentClassName)}>
				{eyebrow ? (
					<SurfaceSectionHeader
						eyebrow={eyebrow}
						chipText={chipText}
						className='mb-2'
						chipClassName={chipClassName}
					/>
				) : null}
				{children}
			</div>
		</div>
	)
}
