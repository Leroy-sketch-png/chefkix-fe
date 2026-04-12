'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QualityTier } from '@/lib/types/recipe'
import { TRANSITION_SPRING } from '@/lib/motion'
import { useTranslations } from 'next-intl'

/**
 * QualityBadge — Displays Recipe Quality Score tier
 *
 * Tiers (from BE):
 * - "Foolproof" (85-100): Gold badge — recipe is highly detailed and beginner-friendly
 * - "Good" (70-84): Green badge — solid recipe with good detail
 * - "Needs Work" (50-69): Yellow badge — recipe could use more detail
 * - "Draft Quality" (0-49): Gray badge — minimal detail, needs significant improvement
 *
 * Usage:
 * - RecipeCard: size="sm", compact badge overlay
 * - RecipeDetail: size="md", full badge with score
 * - CookingPlayer header: size="sm"
 */

interface QualityBadgeProps {
	tier: QualityTier
	score?: number
	size?: 'sm' | 'md' | 'lg'
	showScore?: boolean
	showLabel?: boolean
	className?: string
	animate?: boolean
}

const TIER_LABEL_KEYS: Record<QualityTier, string> = {
	Foolproof: 'tierFoolproof',
	Good: 'tierGood',
	'Needs Work': 'tierNeedsWork',
	'Draft Quality': 'tierDraft',
}

const TIER_CONFIG: Record<
	QualityTier,
	{
		icon: typeof Shield
		label: string
		colors: string
		iconColor: string
		bgGlow?: string
	}
> = {
	Foolproof: {
		icon: ShieldCheck,
		label: 'Foolproof',
		colors: 'bg-level/10 text-level border-level/30',
		iconColor: 'text-level',
		bgGlow: 'shadow-level/20',
	},
	Good: {
		icon: Shield,
		label: 'Good',
		colors: 'bg-success/10 text-success border-success/30',
		iconColor: 'text-success',
		bgGlow: 'shadow-success/20',
	},
	'Needs Work': {
		icon: ShieldAlert,
		label: 'Needs Work',
		colors: 'bg-warning/10 text-warning border-warning/30',
		iconColor: 'text-warning',
		bgGlow: 'shadow-warning/20',
	},
	'Draft Quality': {
		icon: ShieldQuestion,
		label: 'Draft',
		colors: 'bg-bg-elevated text-text-tertiary border-border',
		iconColor: 'text-text-muted',
		bgGlow: '',
	},
}

const SIZE_CONFIG = {
	sm: {
		wrapper: 'px-1.5 py-0.5 gap-1 text-2xs',
		icon: 'size-3',
	},
	md: {
		wrapper: 'px-2.5 py-1 gap-1.5 text-xs',
		icon: 'size-4',
	},
	lg: {
		wrapper: 'px-3 py-1.5 gap-2 text-sm',
		icon: 'size-5',
	},
}

const normalizeTier = (tier: string): QualityTier => {
	const normalized = tier.toLowerCase().replace(/[\s_-]/g, '')

	switch (normalized) {
		case 'foolproof':
			return 'Foolproof'
		case 'good':
			return 'Good'
		case 'needswork':
			return 'Needs Work'
		case 'draft':
		case 'draftquality':
			return 'Draft Quality'
		default:
			return 'Draft Quality'
	}
}

const QualityBadgeComponent = ({
	tier,
	score,
	size = 'md',
	showScore = false,
	showLabel = true,
	className,
	animate = true,
}: QualityBadgeProps) => {
	const safeTier = normalizeTier(String(tier ?? ''))
	const config = TIER_CONFIG[safeTier]
	const sizeConfig = SIZE_CONFIG[size]
	const Icon = config.icon
	const t = useTranslations('recipe')

	const badge = (
		<div
			className={cn(
				'inline-flex items-center rounded-full border font-medium',
				config.colors,
				config.bgGlow && `shadow-sm ${config.bgGlow}`,
				sizeConfig.wrapper,
				className,
			)}
		>
			<Icon className={cn(sizeConfig.icon, config.iconColor)} />
			{showLabel && <span>{t(TIER_LABEL_KEYS[safeTier])}</span>}
			{showScore && score !== undefined && (
				<span className='font-display opacity-75'>({score})</span>
			)}
		</div>
	)

	if (!animate) return badge

	return (
		<motion.div
			initial={{ scale: 0.9, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={TRANSITION_SPRING}
			className='inline-flex'
		>
			{badge}
		</motion.div>
	)
}

/**
 * Utility: Get tier from score
 */
export function getTierFromScore(score: number): QualityTier {
	if (score >= 85) return 'Foolproof'
	if (score >= 70) return 'Good'
	if (score >= 50) return 'Needs Work'
	return 'Draft Quality'
}

/**
 * Utility: Check if tier is publishable (score >= 50)
 */
export function isPublishableQuality(tier: QualityTier): boolean {
	return tier !== 'Draft Quality'
}

/**
 * Utility: Get tier display text for UI
 */
export function getTierDescription(tier: QualityTier): string {
	switch (tier) {
		case 'Foolproof':
			return 'Highly detailed recipe that guides cooks through every step'
		case 'Good':
			return 'Solid recipe with good detail for most cooks'
		case 'Needs Work':
			return 'Recipe could use more detail for better results'
		case 'Draft Quality':
			return 'Minimal detail — consider adding more instructions'
	}
}

export const QualityBadge = memo(QualityBadgeComponent)
