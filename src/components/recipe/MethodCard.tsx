'use client'

import { cn } from '@/lib/utils'
import type { CreateMethod } from '@/lib/types/recipeCreate'

// ── Props ───────────────────────────────────────────────────────────
interface MethodCardProps {
	method: CreateMethod
	icon: React.ReactNode
	title: string
	description: string
	isActive: boolean
	badge?: string
	onClick: () => void
}

/**
 * Selection card for choosing between AI parse and manual entry.
 */
export const MethodCard = ({
	method,
	icon,
	title,
	description,
	isActive,
	badge,
	onClick,
}: MethodCardProps) => (
	<button
		type='button'
		onClick={onClick}
		className={cn(
			'relative flex items-center gap-3.5 rounded-2xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
			isActive
				? 'border-brand bg-brand/10'
				: 'border-border bg-bg-card hover:border-muted-foreground',
		)}
	>
		<div
			className={cn(
				'flex size-12 items-center justify-center rounded-xl',
				method === 'ai'
					? 'bg-gradient-hero text-white'
					: 'bg-bg text-text-secondary',
			)}
		>
			{icon}
		</div>
		<div className='flex-1'>
			<span className='text-base font-bold text-text'>{title}</span>
			<span className='mt-0.5 block text-xs text-text-secondary'>
				{description}
			</span>
		</div>
		{badge && (
			<span className='absolute -top-2 right-3 rounded-lg bg-gradient-hero px-2.5 py-1 text-2xs font-bold text-white'>
				{badge}
			</span>
		)}
	</button>
)
