'use client'

import { memo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
	CheckCircle2,
	AlertCircle,
	XCircle,
	Timer,
	Eye,
	Lightbulb,
	ChefHat,
	ListChecks,
	Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	TRANSITION_SMOOTH,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'
import { Button } from '@/components/ui/button'
import type { Step } from '@/lib/types/recipe'

/**
 * StepQualityIndicator — Per-step quality indicator for recipe creation
 *
 * Shows red/yellow/green dot based on step completeness:
 * - Green (complete): Has title, description, timer (if cooking step), visual cues
 * - Yellow (partial): Has basics but missing enhancements
 * - Red (incomplete): Missing critical fields
 *
 * Tap to expand: Shows specific improvement suggestions with one-tap fix buttons
 */

interface StepQualityIndicatorProps {
	step: Partial<Step>
	stepIndex: number
	onSuggestFix?: (
		field: keyof Step,
		suggestion: string,
		stepIndex: number,
	) => void
	className?: string
	compact?: boolean
}

interface QualityCheck {
	field: keyof Step
	labelKey: string
	icon: typeof CheckCircle2
	check: (step: Partial<Step>) => boolean
	suggestionKey: string
	weight: number // 1-3, higher = more important
}

const QUALITY_CHECKS: QualityCheck[] = [
	{
		field: 'title',
		labelKey: 'qualityStepTitle',
		icon: Target,
		check: s => !!s.title?.trim(),
		suggestionKey: 'qualitySuggestTitle',
		weight: 3,
	},
	{
		field: 'description',
		labelKey: 'qualityInstructions',
		icon: ListChecks,
		check: s => !!s.description?.trim() && s.description.length > 20,
		suggestionKey: 'qualitySuggestInstructions',
		weight: 3,
	},
	{
		field: 'timerSeconds',
		labelKey: 'qualityTimer',
		icon: Timer,
		check: s => s.timerSeconds !== undefined && s.timerSeconds > 0,
		suggestionKey: 'qualitySuggestTimer',
		weight: 2,
	},
	{
		field: 'visualCues',
		labelKey: 'qualityVisualCues',
		icon: Eye,
		check: s => !!s.visualCues?.trim(),
		suggestionKey: 'qualitySuggestVisualCues',
		weight: 2,
	},
	{
		field: 'chefTip',
		labelKey: 'qualityChefTip',
		icon: ChefHat,
		check: s => !!s.chefTip?.trim(),
		suggestionKey: 'qualitySuggestChefTip',
		weight: 1,
	},
	{
		field: 'commonMistake',
		labelKey: 'qualityCommonMistake',
		icon: AlertCircle,
		check: s => !!s.commonMistake?.trim(),
		suggestionKey: 'qualitySuggestCommonMistake',
		weight: 1,
	},
	{
		field: 'goal',
		labelKey: 'qualityStepGoal',
		icon: Lightbulb,
		check: s => !!s.goal?.trim(),
		suggestionKey: 'qualitySuggestStepGoal',
		weight: 1,
	},
]

type QualityLevel = 'complete' | 'partial' | 'incomplete'

function calculateQuality(step: Partial<Step>): {
	level: QualityLevel
	score: number
	passed: QualityCheck[]
	failed: QualityCheck[]
} {
	const passed: QualityCheck[] = []
	const failed: QualityCheck[] = []
	let totalWeight = 0
	let earnedWeight = 0

	for (const check of QUALITY_CHECKS) {
		totalWeight += check.weight
		if (check.check(step)) {
			earnedWeight += check.weight
			passed.push(check)
		} else {
			failed.push(check)
		}
	}

	const score = Math.round((earnedWeight / totalWeight) * 100)

	let level: QualityLevel
	if (score >= 80) {
		level = 'complete'
	} else if (score >= 50) {
		level = 'partial'
	} else {
		level = 'incomplete'
	}

	return { level, score, passed, failed }
}

const LEVEL_CONFIG: Record<
	QualityLevel,
	{
		color: string
		bgColor: string
		borderColor: string
		icon: typeof CheckCircle2
		labelKey: string
	}
> = {
	complete: {
		color: 'text-success',
		bgColor: 'bg-success/10',
		borderColor: 'border-success/30',
		icon: CheckCircle2,
		labelKey: 'qualityComplete',
	},
	partial: {
		color: 'text-warning',
		bgColor: 'bg-warning/10',
		borderColor: 'border-warning/30',
		icon: AlertCircle,
		labelKey: 'qualityNeedsPolish',
	},
	incomplete: {
		color: 'text-error',
		bgColor: 'bg-error/10',
		borderColor: 'border-error/30',
		icon: XCircle,
		labelKey: 'qualityIncomplete',
	},
}

const QUALITY_CHECK_LABEL_KEYS: Record<string, string> = {
	title: 'sqiStepTitle',
	description: 'sqiInstructions',
	timerSeconds: 'sqiTimer',
	visualCues: 'sqiVisualCues',
	chefTip: 'sqiChefTip',
	commonMistake: 'sqiCommonMistake',
	goal: 'sqiStepGoal',
}

const QUALITY_CHECK_SUGGESTION_KEYS: Record<string, string> = {
	title: 'sqiAddTitle',
	description: 'sqiAddInstructions',
	timerSeconds: 'sqiAddTimer',
	visualCues: 'sqiAddVisualCues',
	chefTip: 'sqiAddChefTip',
	commonMistake: 'sqiAddCommonMistake',
	goal: 'sqiAddStepGoal',
}

const LEVEL_LABEL_KEYS: Record<QualityLevel, string> = {
	complete: 'sqiComplete',
	partial: 'sqiNeedsPolish',
	incomplete: 'sqiIncomplete',
}

const StepQualityIndicatorComponent = ({
	step,
	stepIndex,
	onSuggestFix,
	className,
	compact = false,
}: StepQualityIndicatorProps) => {
	const t = useTranslations('recipe')
	const [isExpanded, setIsExpanded] = useState(false)
	const { level, score, failed } = calculateQuality(step)
	const config = LEVEL_CONFIG[level]
	const Icon = config.icon

	// Sort failed checks by weight (most important first)
	const sortedFailed = [...failed].sort((a, b) => b.weight - a.weight)

	if (compact) {
		// Just the dot
		return (
			<motion.button
				type='button'
				onClick={() => setIsExpanded(!isExpanded)}
				whileHover={ICON_BUTTON_HOVER}
				whileTap={ICON_BUTTON_TAP}
				className={cn(
					'relative size-3 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
					level === 'complete' && 'bg-success',
					level === 'partial' && 'bg-warning',
					level === 'incomplete' && 'bg-error',
					className,
				)}
				aria-label={t('sqiStepQuality', {
					label: t(LEVEL_LABEL_KEYS[level]),
					score,
				})}
			>
				{level !== 'complete' && (
					<motion.span
						className='absolute inset-0 rounded-full'
						style={{
							backgroundColor:
								level === 'partial' ? 'rgb(234 179 8)' : 'rgb(239 68 68)',
						}}
						animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
						transition={{ duration: 2, repeat: Infinity }}
					/>
				)}
			</motion.button>
		)
	}

	return (
		<div className={cn('relative', className)}>
			{/* Main indicator button */}
			<motion.button
				type='button'
				onClick={() => setIsExpanded(!isExpanded)}
				whileHover={LIST_ITEM_HOVER}
				whileTap={LIST_ITEM_TAP}
				className={cn(
					'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
					config.bgColor,
					config.borderColor,
					isExpanded && 'ring-2 ring-offset-1',
					level === 'complete' && 'ring-emerald-300',
					level === 'partial' && 'ring-yellow-300',
					level === 'incomplete' && 'ring-red-300',
				)}
			>
				<Icon className={cn('size-4', config.color)} />
				<span className={cn('text-xs font-medium', config.color)}>
					{t(LEVEL_LABEL_KEYS[level])}
				</span>
				<span className='ml-auto font-display text-xs text-text-muted'>
					{score}%
				</span>
			</motion.button>

			{/* Expanded suggestions panel */}
			<AnimatePresence>
				{isExpanded && sortedFailed.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: -8, height: 0 }}
						animate={{ opacity: 1, y: 0, height: 'auto' }}
						exit={{ opacity: 0, y: -8, height: 0 }}
						transition={TRANSITION_SMOOTH}
						className='mt-2 overflow-hidden rounded-lg border border-border bg-bg-card p-3 shadow-card'
					>
						<p className='mb-2 text-xs font-medium text-text-secondary'>
							{t('sqiSuggestionsToImprove')}
						</p>
						<div className='space-y-2'>
							{sortedFailed.slice(0, 3).map(check => {
								const CheckIcon = check.icon
								return (
									<div key={check.field} className='flex items-start gap-2'>
										<CheckIcon className='mt-0.5 size-4 shrink-0 text-text-muted' />
										<div className='flex-1'>
											<p className='text-xs text-text'>
												{t(
													QUALITY_CHECK_SUGGESTION_KEYS[check.field] ||
														check.field,
												)}
											</p>
										</div>
										{onSuggestFix && (
											<Button
												size='sm'
												variant='ghost'
												className='h-6 px-2 text-2xs'
												onClick={e => {
													e.stopPropagation()
													onSuggestFix(
														check.field,
														t(check.suggestionKey),
														stepIndex,
													)
												}}
											>
												{t('sqiAdd')}
											</Button>
										)}
									</div>
								)
							})}
						</div>
						{sortedFailed.length > 3 && (
							<p className='mt-2 text-2xs text-text-muted'>
								{t('sqiMoreSuggestions', { count: sortedFailed.length - 3 })}
							</p>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

/**
 * StepQualityDot — Minimal dot-only indicator for inline use
 */
export const StepQualityDot = memo(
	({ step, className }: { step: Partial<Step>; className?: string }) => {
		const t = useTranslations('recipe')
		const { level, score } = calculateQuality(step)

		return (
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={TRANSITION_SPRING}
				className={cn(
					'size-2.5 rounded-full',
					level === 'complete' && 'bg-success',
					level === 'partial' && 'bg-warning',
					level === 'incomplete' && 'bg-error',
					className,
				)}
				title={t('sqiStepQualityScore', { score })}
			/>
		)
	},
)

StepQualityDot.displayName = 'StepQualityDot'

export const StepQualityIndicator = memo(StepQualityIndicatorComponent)
export { calculateQuality, type QualityLevel }
