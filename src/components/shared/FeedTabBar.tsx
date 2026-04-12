'use client'

import { useTranslations } from 'next-intl'

import * as React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, Sparkles, TrendingUp, Users2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BUTTON_SUBTLE_TAP, BUTTON_TAP } from '@/lib/motion'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface TabItem<T extends string = string> {
	/** Unique identifier for the tab */
	key: T
	/** Display label */
	label: string
	/** Optional icon component */
	icon?: LucideIcon
	/** Optional count/badge to display */
	count?: number
	/** Optional custom badge content */
	badge?: React.ReactNode
}

export interface FeedTabBarProps<T extends string = string> {
	/** Array of tab items */
	tabs: TabItem<T>[]
	/** Currently active tab key */
	activeTab: T
	/** Callback when tab changes */
	onTabChange: (tab: T) => void
	/** Visual variant: pill (filled) or underline (border) */
	variant?: 'pill' | 'underline'
	/** Size variant */
	size?: 'sm' | 'md' | 'lg'
	/** Additional className for the container */
	className?: string
	/** Whether to allow horizontal scrolling */
	scrollable?: boolean
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export function FeedTabBar<T extends string = string>({
	tabs,
	activeTab,
	onTabChange,
	variant = 'pill',
	size = 'md',
	className,
	scrollable = true,
}: FeedTabBarProps<T>) {
	// Size-based styles
	const sizeStyles = {
		sm: {
			container: 'gap-1.5',
			tab: 'px-3 py-1.5 text-sm',
			icon: 'size-3.5',
			count: 'text-2xs px-1.5 py-0.5',
		},
		md: {
			container: 'gap-2',
			tab: 'px-4 py-2 text-sm',
			icon: 'size-4',
			count: 'text-xs px-2 py-0.5',
		},
		lg: {
			container: 'gap-3',
			tab: 'px-5 py-2.5 text-base',
			icon: 'size-5',
			count: 'text-xs px-2.5 py-1',
		},
	}

	const sizes = sizeStyles[size]

	// Variant-based styles
	const isPill = variant === 'pill'

	return (
		<div
			className={cn(
				'flex',
				sizes.container,
				scrollable && 'overflow-x-auto scrollbar-hide',
				!isPill && 'border-b-2 border-border-subtle',
				className,
			)}
			role='tablist'
		>
			{tabs.map(tab => {
				const isActive = activeTab === tab.key
				const Icon = tab.icon

				return (
					<motion.button
						type='button'
						key={tab.key}
						onClick={() => onTabChange(tab.key)}
						whileTap={isPill ? BUTTON_SUBTLE_TAP : BUTTON_TAP}
						role='tab'
						aria-selected={isActive}
						aria-controls={`tabpanel-${tab.key}`}
						className={cn(
							'relative flex shrink-0 items-center gap-2 font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/50',
							sizes.tab,
							// Pill variant styles
							isPill && [
								'rounded-radius',
								isActive
									? 'text-white'
									: 'text-text-secondary hover:bg-bg-elevated hover:text-text',
							],
							// Underline variant styles
							!isPill && [
								'-mb-[2px] whitespace-nowrap border-b-[3px]',
								isActive
									? 'border-transparent text-brand'
									: 'border-transparent text-text-secondary hover:bg-bg-hover hover:text-text',
							],
						)}
					>
						{/* Animated pill background */}
						{isPill && isActive && (
							<motion.div
								layoutId='feed-tab-pill'
								className='absolute inset-0 rounded-radius bg-gradient-brand shadow-card'
								transition={{ type: 'spring', stiffness: 400, damping: 30 }}
							/>
						)}
						{/* Animated underline indicator */}
						{!isPill && isActive && (
							<motion.div
								layoutId='feed-tab-underline'
								className='absolute inset-x-0 -bottom-[2px] h-[3px] rounded-full bg-brand'
								transition={{ type: 'spring', stiffness: 400, damping: 30 }}
							/>
						)}
						<span className='relative z-10 flex items-center gap-2'>
							{Icon && <Icon className={sizes.icon} />}
							{tab.label}

							{/* Count badge */}
							{tab.count !== undefined && (
								<span
									className={cn(
										'rounded-full font-bold tabular-nums',
										sizes.count,
										isPill
											? isActive
												? 'bg-white/20 text-white'
												: 'bg-bg-elevated text-text-secondary'
											: isActive
												? 'bg-brand/15 text-brand'
												: 'bg-bg-elevated text-text-secondary',
									)}
								>
									{tab.count}
								</span>
							)}

							{/* Custom badge */}
							{tab.badge}
						</span>
					</motion.button>
				)
			})}
		</div>
	)
}

// ─────────────────────────────────────────────────────────────────
// Convenience exports for specific use cases
// ─────────────────────────────────────────────────────────────────

export type FeedMode = 'forYou' | 'trending' | 'following' | 'latest'

export interface FeedModeTabBarProps {
	activeMode: FeedMode
	onModeChange: (mode: FeedMode) => void
	className?: string
}

/**
 * Pre-configured tab bar for feed mode selection (For You, Trending, Following, Latest)
 */
export function FeedModeTabBar({
	activeMode,
	onModeChange,
	className,
}: FeedModeTabBarProps) {
	const t = useTranslations('shared')
	const tabs: TabItem<FeedMode>[] = [
		{ key: 'forYou', label: t('ftForYou'), icon: Sparkles },
		{ key: 'trending', label: t('ftTrending'), icon: TrendingUp },
		{ key: 'following', label: t('ftFollowing'), icon: Users2 },
		{ key: 'latest', label: t('ftLatest'), icon: Clock },
	]

	return (
		<FeedTabBar
			tabs={tabs}
			activeTab={activeMode}
			onTabChange={onModeChange}
			variant='pill'
			className={className}
		/>
	)
}
