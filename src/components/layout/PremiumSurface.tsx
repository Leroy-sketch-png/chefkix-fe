import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SurfaceTone =
	| 'brand'
	| 'xp'
	| 'success'
	| 'streak'
	| 'blue'
	| 'glass'
	| 'depth'

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
}

const toneClasses: Record<SurfaceTone, { border: string; gradient: string }> = {
	brand: {
		border: 'border-brand/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	xp: {
		border: 'border-xp/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	success: {
		border: 'border-success/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	streak: {
		border: 'border-streak/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	blue: {
		border: 'border-info/15',
		gradient: 'from-bg-card/97 via-bg-card/90 to-bg-elevated/75',
	},
	glass: {
		border: 'border-white/15',
		gradient: 'from-white/12 via-white/8 to-white/4',
	},
	depth: {
		border: 'border-border-medium',
		gradient: 'from-bg-elevated/95 via-bg-elevated/90 to-bg/85',
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
			<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
				{eyebrow}
			</p>
			{chipText ? (
				<span
					className={cn(
						'inline-flex h-6 items-center rounded-full border border-border-subtle/80 bg-gradient-to-r from-bg-card to-bg-elevated px-3 text-2xs font-semibold text-text-secondary tabular-nums shadow-card',
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
}: PremiumSurfaceProps) {
	const surface = toneClasses[tone]

	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-3xl border bg-gradient-to-br p-3 shadow-card backdrop-blur-sm transition-colors duration-300',
				surface.gradient,
				surface.border,
				className,
			)}
		>
			<div className='pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/30 via-white/10 to-transparent dark:from-white/8 dark:via-white/3' />
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
