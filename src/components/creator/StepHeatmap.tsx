'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
	AlertTriangle,
	CheckCircle2,
	SkipForward,
	Clock,
	BarChart3,
	ChevronDown,
	ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
	DURATION_S,
} from '@/lib/motion'
import {
	getStepHeatmap,
	StepHeatmapResponse,
	StepAnalytics,
} from '@/services/creator'
import { logDevError } from '@/lib/dev-log'

interface StepHeatmapProps {
	recipeId: string
	recipeTitle?: string
	className?: string
}

const formatTime = (seconds: number | null): string => {
	if (seconds === null) return '--'
	if (seconds < 60) return `${Math.round(seconds)}s`
	const min = Math.floor(seconds / 60)
	const sec = Math.round(seconds % 60)
	return sec > 0 ? `${min}m ${sec}s` : `${min}m`
}

const getCompletionColor = (rate: number): string => {
	if (rate >= 90) return 'text-success'
	if (rate >= 70) return 'text-brand'
	if (rate >= 50) return 'text-streak'
	return 'text-error'
}

const getBarWidth = (rate: number): string => {
	return `${Math.max(rate, 4)}%`
}

const getBarColor = (step: StepAnalytics): string => {
	if (step.strugglePoint) return 'bg-error/80'
	if (step.completionRate >= 90) return 'bg-success/80'
	if (step.completionRate >= 70) return 'bg-brand/80'
	return 'bg-streak/80'
}

export function StepHeatmap({
	recipeId,
	recipeTitle,
	className,
}: StepHeatmapProps) {
	const [data, setData] = useState<StepHeatmapResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [expanded, setExpanded] = useState(false)
	const t = useTranslations('creator')

	useEffect(() => {
		let cancelled = false
		const fetch = async () => {
			setLoading(true)
			try {
				const res = await getStepHeatmap(recipeId)
				if (cancelled) return
				if (res.success && res.data) {
					setData(res.data)
				}
			} catch (err) {
				logDevError('Failed to fetch step heatmap:', err)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		fetch()
		return () => {
			cancelled = true
		}
	}, [recipeId])

	if (loading) {
		return (
			<div className={cn('space-y-3', className)}>
				{[0, 1, 2, 3].map(i => (
					<div
						key={i}
						className='h-14 animate-pulse rounded-lg bg-bg-elevated'
					/>
				))}
			</div>
		)
	}

	if (!data || data.steps.length === 0) {
		return (
			<div
				className={cn(
					'rounded-xl border border-border-subtle bg-bg-card p-6 text-center',
					className,
				)}
			>
				<BarChart3 className='mx-auto mb-2 size-8 text-text-muted' />
				<p className='text-sm text-text-secondary'>
					No cooking data yet. When people cook this recipe, you&apos;ll see
					step-by-step analytics here.
				</p>
			</div>
		)
	}

	const struggleSteps = data.steps.filter(s => s.strugglePoint)
	const displaySteps = expanded ? data.steps : data.steps.slice(0, 5)

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'rounded-xl border border-border-subtle bg-bg-card shadow-card',
				className,
			)}
		>
			{/* Header */}
			<div className='border-b border-border-subtle p-4'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='text-sm font-semibold text-text'>
							{t('stepHeatmap')}
						</h3>
						<p className='text-xs text-text-muted'>
							{recipeTitle ?? data.recipeTitle} &middot; {data.totalSessions}{' '}
							cook{data.totalSessions !== 1 ? 's' : ''}
						</p>
					</div>
					{struggleSteps.length > 0 && (
						<div className='flex items-center gap-1.5 rounded-full bg-error/10 px-2.5 py-1'>
							<AlertTriangle className='size-3.5 text-error' />
							<span className='text-xs font-medium text-error'>
								{struggleSteps.length !== 1
									? t('strugglePointsPlural', { n: struggleSteps.length })
									: t('strugglePoints', { n: struggleSteps.length })}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Steps */}
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='divide-y divide-border-subtle'
			>
				{displaySteps.map(step => (
					<motion.div
						key={step.stepNumber}
						variants={staggerItem}
						className={cn(
							'flex items-center gap-3 px-4 py-3 transition-colors',
							step.strugglePoint && 'bg-error/5',
						)}
					>
						{/* Step number */}
						<div
							className={cn(
								'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
								step.strugglePoint
									? 'bg-error/20 text-error'
									: step.completionRate >= 90
										? 'bg-success/20 text-success'
										: 'bg-bg-elevated text-text-secondary',
							)}
						>
							{step.stepNumber}
						</div>

						{/* Bar + title */}
						<div className='min-w-0 flex-1'>
							<div className='mb-1 flex items-center justify-between'>
								<span className='truncate text-xs font-medium text-text'>
									{step.title}
								</span>
								<span
									className={cn(
										'ml-2 shrink-0 text-xs font-semibold',
										getCompletionColor(step.completionRate),
									)}
								>
									{step.completionRate}%
								</span>
							</div>
							<div className='h-1.5 overflow-hidden rounded-full bg-bg-elevated'>
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: getBarWidth(step.completionRate) }}
									transition={{
										duration: DURATION_S.verySlow,
										ease: 'easeOut',
									}}
									className={cn('h-full rounded-full', getBarColor(step))}
								/>
							</div>
						</div>

						{/* Metrics */}
						<div className='flex shrink-0 gap-3'>
							{step.skipRate > 0 && (
								<div className='flex items-center gap-1' title={t('skipRate')}>
									<SkipForward className='size-3 text-streak' />
									<span className='text-2xs text-text-muted'>
										{step.skipRate}%
									</span>
								</div>
							)}
							{step.avgTimeSeconds !== null && (
								<div className='flex items-center gap-1' title={t('avgTime')}>
									<Clock className='size-3 text-text-muted' />
									<span className='text-2xs text-text-muted'>
										{formatTime(step.avgTimeSeconds)}
										{step.estimatedTimeSeconds
											? ` / ${formatTime(step.estimatedTimeSeconds)}`
											: ''}
									</span>
								</div>
							)}
							{step.abandonedAtCount > 0 && (
								<div
									className='flex items-center gap-1'
									title={t('sessionsAbandonedHere')}
								>
									<AlertTriangle className='size-3 text-error' />
									<span className='text-2xs text-error'>
										{step.abandonedAtCount}
									</span>
								</div>
							)}
							{step.completionRate >= 95 && step.skipRate === 0 && (
								<CheckCircle2 className='size-3.5 text-success' />
							)}
						</div>
					</motion.div>
				))}
			</motion.div>

			{/* Expand/collapse */}
			{data.steps.length > 5 && (
				<button
					type='button'
					onClick={() => setExpanded(!expanded)}
					className='flex w-full items-center justify-center gap-1 border-t border-border-subtle py-2.5 text-xs font-medium text-text-secondary transition-colors hover:text-text'
				>
					{expanded ? (
						<>
							{t('showLess')} <ChevronUp className='size-3.5' />
						</>
					) : (
						<>
							Show all {data.steps.length} steps{' '}
							<ChevronDown className='size-3.5' />
						</>
					)}
				</button>
			)}
		</motion.div>
	)
}

export default StepHeatmap
