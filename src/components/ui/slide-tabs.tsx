'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SlideTab {
	id: string
	label: string
	icon?: React.ReactNode
}

export interface SlideTabsProps {
	tabs: SlideTab[]
	activeTab: string
	onTabChange: (id: string) => void
	variant?: 'pill' | 'underline'
	size?: 'sm' | 'md' | 'lg'
	fullWidth?: boolean
	className?: string
}

const sizeClass = {
	sm: 'text-[11px] px-2.5 py-1.5 sm:text-sm sm:px-4 sm:py-2',
	md: 'text-sm px-3.5 py-1.5 sm:text-base sm:px-5 sm:py-2',
	lg: 'text-base px-5 py-2.5',
}

export function SlideTabs({
	tabs,
	activeTab,
	onTabChange,
	variant = 'pill',
	size = 'sm',
	fullWidth = false,
	className,
}: SlideTabsProps) {
	const layoutId = `slide-tab-${useId()}`

	return (
		<div
			className={cn(
				'relative inline-flex items-center',
				variant === 'pill' &&
					'rounded-full border border-border-subtle bg-bg-elevated p-1',
				variant === 'underline' && 'border-b border-border-subtle',
				fullWidth && 'w-full',
				className,
			)}
			role='tablist'
		>
			{tabs.map(tab => {
				const isActive = tab.id === activeTab
				return (
					<button
						type='button'
						key={tab.id}
						role='tab'
						aria-selected={isActive}
						onClick={() => onTabChange(tab.id)}
						className={cn(
							'relative z-10 flex items-center gap-1.5 rounded-full font-semibold transition-colors',
							sizeClass[size],
							fullWidth && 'flex-1 justify-center',
							isActive
								? 'text-text-primary'
								: 'text-text-secondary hover:text-text-primary',
						)}
					>
						{tab.icon}
						{tab.label}

						{isActive && variant === 'pill' && (
							<motion.div
								layoutId={layoutId}
								className='absolute inset-0 z-[-1] rounded-full bg-bg-card shadow-card'
								transition={{ type: 'spring', stiffness: 400, damping: 30 }}
							/>
						)}
						{isActive && variant === 'underline' && (
							<motion.div
								layoutId={layoutId}
								className='absolute inset-x-0 -bottom-px z-[-1] h-0.5 bg-brand'
								transition={{ type: 'spring', stiffness: 400, damping: 30 }}
							/>
						)}
					</button>
				)
			})}
		</div>
	)
}
