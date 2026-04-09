'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, Sparkles, ArrowLeft } from 'lucide-react'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type PageHeaderGradient =
	| 'orange' // hero gradient (coral → purple) - default
	| 'yellow' // streak gradient (orange → yellow) - challenges
	| 'purple' // xp gradient - gamification
	| 'blue' // info/notifications
	| 'green' // success/groups
	| 'gray' // neutral/settings
	| 'warm' // warm tones
	| 'pink' // community/social

export interface PageHeaderProps {
	/** Page icon (Lucide icon) */
	icon: LucideIcon
	/** Page title */
	title: string
	/** Page subtitle/description */
	subtitle: string
	/** Gradient color scheme for icon box */
	gradient?: PageHeaderGradient
	/** Optional icon animation (for settings gear, etc.) */
	iconAnimation?: {
		rotate?: number
		scale?: number
	}
	/** Optional right-side action (button, etc.) */
	rightAction?: React.ReactNode
	/** Show sparkles in subtitle */
	showSparkles?: boolean
	/** Custom subtitle icon (replaces sparkles) */
	subtitleIcon?: LucideIcon
	/** Bottom margin class */
	marginBottom?: 'sm' | 'md' | 'lg'
	/** Additional className for container */
	className?: string
	/** Show back button (for SECONDARY pages reached via links) */
	showBack?: boolean
}

// ─────────────────────────────────────────────────────────────────
// Gradient mappings
// ─────────────────────────────────────────────────────────────────

const gradientMap: Record<PageHeaderGradient, { bg: string; shadow: string }> =
	{
		orange: {
			bg: 'bg-gradient-hero',
			shadow: 'shadow-brand/25',
		},
		yellow: {
			bg: 'bg-gradient-streak',
			shadow: 'shadow-streak/25',
		},
		purple: {
			bg: 'bg-gradient-xp',
			shadow: 'shadow-level/25',
		},
		blue: {
			bg: 'bg-gradient-indigo',
			shadow: 'shadow-info/25',
		},
		green: {
			bg: 'bg-gradient-success',
			shadow: 'shadow-success/25',
		},
		gray: {
			bg: 'bg-gradient-to-br from-border-strong to-text-muted',
			shadow: 'shadow-border-strong/25',
		},
		warm: {
			bg: 'bg-gradient-warm',
			shadow: 'shadow-brand/20',
		},
		pink: {
			bg: 'bg-gradient-social',
			shadow: 'shadow-xp/25',
		},
	}

const marginMap = {
	sm: 'mb-4',
	md: 'mb-6',
	lg: 'mb-8',
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export function PageHeader({
	icon: Icon,
	title,
	subtitle,
	gradient = 'orange',
	iconAnimation,
	rightAction,
	showSparkles = true,
	subtitleIcon: SubtitleIcon,
	marginBottom = 'lg',
	className,
	showBack = false,
}: PageHeaderProps) {
	const router = useRouter()
	const t = useTranslations('pageHeader')
	const { bg, shadow } = gradientMap[gradient]
	const ActualSubtitleIcon = SubtitleIcon ?? (showSparkles ? Sparkles : null)

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(marginMap[marginBottom], className)}
		>
			{showBack && (
				<button
					type='button'
					onClick={() => router.back()}
					className='mb-3 flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text'
				>
					<ArrowLeft className='size-4' />
					<span>{t('back')}</span>
				</button>
			)}
			<div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
				<div className='flex items-center gap-3'>
					{/* Icon Box */}
					<motion.div
						initial={{ scale: 0 }}
						animate={{
							scale: 1,
							...(iconAnimation?.rotate && { rotate: iconAnimation.rotate }),
						}}
						transition={{ delay: 0.2, ...TRANSITION_SPRING }}
						className={cn(
							'flex size-12 items-center justify-center rounded-2xl shadow-card',
							bg,
							shadow,
						)}
					>
						<Icon className='size-6 text-white' />
					</motion.div>

					{/* Title */}
					<h1 className='text-2xl sm:text-3xl font-bold text-text'>{title}</h1>
				</div>

				{/* Right Action */}
				{rightAction}
			</div>

			{/* Subtitle */}
			<p className='flex items-center gap-2 text-text-secondary'>
				{ActualSubtitleIcon && (
					<ActualSubtitleIcon className='size-4 text-streak' />
				)}
				{subtitle}
			</p>
		</motion.div>
	)
}
