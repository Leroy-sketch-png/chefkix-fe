'use client'

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
				scrollable && 'overflow-x-auto scrollbar-none',
				!isPill && 'border-b-2 border-border-subtle',
				className,
			)}
			role="tablist"
		>
			{tabs.map(tab => {
				const isActive = activeTab === tab.key
				const Icon = tab.icon

				return (
					<motion.button
						key={tab.key}
						onClick={() => onTabChange(tab.key)}
						whileTap={isPill ? BUTTON_SUBTLE_TAP : BUTTON_TAP}
						role="tab"
						aria-selected={isActive}
						aria-controls={`tabpanel-${tab.key}`}
						className={cn(
							'relative flex shrink-0 items-center gap-2 font-semibold transition-all duration-200',
							sizes.tab,
							// Pill variant styles
							isPill && [
								'rounded-radius',
								isActive
									? 'bg-gradient-brand text-white shadow-card'
									: 'text-text-secondary hover:bg-bg-elevated hover:text-text',
							],
							// Underline variant styles
							!isPill && [
								'-mb-[2px] whitespace-nowrap border-b-[3px]',
								isActive
									? 'border-brand text-brand'
									: 'border-transparent text-text-secondary hover:bg-bg-hover hover:text-text',
							],
						)}
					>
						{Icon && <Icon className={sizes.icon} />}
						{tab.label}

						{/* Count badge */}
						{tab.count !== undefined && (
							<span
								className={cn(
									'rounded-full font-bold',
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
	const tabs: TabItem<FeedMode>[] = [
		{ key: 'forYou', label: 'For You', icon: Sparkles },
		{ key: 'trending', label: 'Trending', icon: TrendingUp },
		{ key: 'following', label: 'Following', icon: Users2 },
		{ key: 'latest', label: 'Latest', icon: Clock },
	]

	return (
		<FeedTabBar
			tabs={tabs}
			activeTab={activeMode}
			onTabChange={onModeChange}
			variant="pill"
			className={className}
		/>
	)
}
