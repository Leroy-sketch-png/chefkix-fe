'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface TimelineItem {
	title: string
	description?: string
	date?: string
	icon?: LucideIcon
	variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info'
}

interface TimelineProps {
	items: TimelineItem[]
	className?: string
}

export function Timeline({ items, className }: TimelineProps) {
	const dotColor = (variant: TimelineItem['variant'] = 'default') => {
		switch (variant) {
			case 'success':
				return 'bg-green-500'
			case 'warning':
				return 'bg-yellow-500'
			case 'destructive':
				return 'bg-red-500'
			case 'info':
				return 'bg-blue-500'
			default:
				return 'bg-brand'
		}
	}

	return (
		<div className={cn('space-y-0', className)}>
			{items.map((item, i) => (
				<div key={i} className='flex gap-4'>
					<div className='flex flex-col items-center'>
						{item.icon ? (
							<div
								className={cn(
									'flex size-8 shrink-0 items-center justify-center rounded-full',
									dotColor(item.variant),
								)}
							>
								<item.icon className='size-4 text-white' />
							</div>
						) : (
							<div
								className={cn(
									'mt-1.5 size-3 shrink-0 rounded-full',
									dotColor(item.variant),
								)}
							/>
						)}
						{i < items.length - 1 && (
							<div className='mt-1 w-px flex-1 bg-border-subtle' />
						)}
					</div>
					<div className='pb-8'>
						<div className='flex items-baseline gap-2'>
							<h4 className='text-sm font-semibold text-text'>{item.title}</h4>
							{item.date && (
								<time className='text-xs text-text-muted'>{item.date}</time>
							)}
						</div>
						{item.description && (
							<p className='mt-1 text-sm text-text-secondary'>
								{item.description}
							</p>
						)}
					</div>
				</div>
			))}
		</div>
	)
}
