'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radar, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, DURATION_S } from '@/lib/motion'

// ============================================
// TYPES
// ============================================

export interface TasteProfile {
	/** Flavor dimensions 0-100 */
	sweet?: number
	savory?: number
	spicy?: number
	fresh?: number
	rich?: number
	umami?: number
}

interface TasteDetectorProps {
	/** Current taste profile (from BE or computed from events) */
	profile?: TasteProfile
	/** Whether actively detecting (show pulse animation) */
	isDetecting?: boolean
	/** Number of events collected so far */
	eventCount?: number
	/** Minimum events needed for a "formed" profile */
	minEvents?: number
	/** Additional class names */
	className?: string
	/** Compact mode for inline display */
	compact?: boolean
}

// ============================================
// CONSTANTS
// ============================================

const TASTE_DIMENSIONS = [
	{ key: 'sweet', labelKey: 'tasteSweet', color: 'text-brand', angle: 0 },
	{ key: 'savory', labelKey: 'tasteSavory', color: 'text-warning', angle: 60 },
	{ key: 'spicy', labelKey: 'tasteSpicy', color: 'text-error', angle: 120 },
	{ key: 'fresh', labelKey: 'tasteFresh', color: 'text-success', angle: 180 },
	{ key: 'rich', labelKey: 'tasteRich', color: 'text-streak', angle: 240 },
	{
		key: 'umami',
		labelKey: 'tasteUmami',
		color: 'text-accent-purple',
		angle: 300,
	},
] as const

const DEFAULT_MIN_EVENTS = 10

// ============================================
// HELPERS
// ============================================

function polarToCartesian(
	cx: number,
	cy: number,
	radius: number,
	angleDeg: number,
) {
	const rad = ((angleDeg - 90) * Math.PI) / 180
	return {
		x: cx + radius * Math.cos(rad),
		y: cy + radius * Math.sin(rad),
	}
}

function buildRadarPath(profile: TasteProfile, size: number) {
	const cx = size / 2
	const cy = size / 2
	const maxRadius = (size / 2) * 0.8 // 80% of half-size

	const points = TASTE_DIMENSIONS.map(dim => {
		const value = profile[dim.key as keyof TasteProfile] ?? 0
		const radius = (value / 100) * maxRadius
		return polarToCartesian(cx, cy, radius, dim.angle)
	})

	if (points.length === 0) return ''

	return (
		points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
		' Z'
	)
}

// ============================================
// COMPONENT
// ============================================

/**
 * TasteDetector — Passive taste detection UI for cold-start onboarding.
 *
 * Shows a mini radar chart that "forms" as the user browses recipes.
 * Uses semantic tokens per DESIGN_SYSTEM.md.
 *
 * Usage:
 * ```tsx
 * <TasteDetector
 *   profile={{ sweet: 60, savory: 80, spicy: 30 }}
 *   isDetecting
 *   eventCount={7}
 *   minEvents={10}
 * />
 * ```
 */
const EMPTY_PROFILE: TasteProfile = {}

export const TasteDetector = ({
	profile,
	isDetecting = false,
	eventCount = 0,
	minEvents = DEFAULT_MIN_EVENTS,
	className,
	compact = false,
}: TasteDetectorProps) => {
	const tc = useTranslations('common')
	const stableProfile = profile ?? EMPTY_PROFILE
	const [animatedProfile, setAnimatedProfile] =
		useState<TasteProfile>(stableProfile)
	const prevProfileJson = useRef('')

	// Animate profile changes smoothly — compare by value to avoid infinite loops
	useEffect(() => {
		const json = JSON.stringify(stableProfile)
		if (json !== prevProfileJson.current) {
			prevProfileJson.current = json
			setAnimatedProfile(stableProfile)
		}
	}, [stableProfile])

	const progress = Math.min(100, (eventCount / minEvents) * 100)
	const isFormed = eventCount >= minEvents

	const radarSize = compact ? 64 : 120
	const radarPath = useMemo(
		() => buildRadarPath(animatedProfile, radarSize),
		[animatedProfile, radarSize],
	)

	// Grid lines for radar
	const gridLines = useMemo(() => {
		const cx = radarSize / 2
		const cy = radarSize / 2
		const maxRadius = (radarSize / 2) * 0.8
		return [0.25, 0.5, 0.75, 1]
			.map(scale => {
				const r = maxRadius * scale
				return TASTE_DIMENSIONS.map((dim, i) => {
					const p = polarToCartesian(cx, cy, r, dim.angle)
					const next = TASTE_DIMENSIONS[(i + 1) % TASTE_DIMENSIONS.length]
					const p2 = polarToCartesian(cx, cy, r, next.angle)
					return { x1: p.x, y1: p.y, x2: p2.x, y2: p2.y, key: `${scale}-${i}` }
				})
			})
			.flat()
	}, [radarSize])

	// Spoke lines
	const spokeLines = useMemo(() => {
		const cx = radarSize / 2
		const cy = radarSize / 2
		const maxRadius = (radarSize / 2) * 0.8
		return TASTE_DIMENSIONS.map(dim => {
			const p = polarToCartesian(cx, cy, maxRadius, dim.angle)
			return { x1: cx, y1: cy, x2: p.x, y2: p.y, key: dim.key }
		})
	}, [radarSize])

	if (compact) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={TRANSITION_SPRING}
				className={cn(
					'inline-flex items-center gap-2 rounded-full bg-bg-elevated px-3 py-1.5',
					className,
				)}
			>
				<div className='relative'>
					<svg
						width={radarSize}
						height={radarSize}
						viewBox={`0 0 ${radarSize} ${radarSize}`}
						className='overflow-visible'
					>
						{/* Grid */}
						<g className='stroke-border-subtle' strokeWidth={0.5}>
							{gridLines.map(line => (
								<line
									key={line.key}
									x1={line.x1}
									y1={line.y1}
									x2={line.x2}
									y2={line.y2}
								/>
							))}
						</g>
						{/* Radar fill */}
						<motion.path
							d={radarPath}
							fill='var(--brand)'
							fillOpacity={0.3}
							stroke='var(--brand)'
							strokeWidth={1.5}
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 1 }}
							transition={{ duration: DURATION_S.verySlow, ease: 'easeOut' }}
						/>
					</svg>
					{isDetecting && (
						<motion.div
							className='pointer-events-none absolute inset-0 rounded-full border-2 border-brand'
							animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
							transition={{ duration: 2, repeat: Infinity }}
						/>
					)}
				</div>
				<span className='text-xs font-medium text-text-secondary'>
					{isFormed ? tc('tasteProfileReady') : tc('tasteDetecting')}
				</span>
			</motion.div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'rounded-2xl border border-border-subtle bg-bg-card p-4',
				className,
			)}
		>
			{/* Header */}
			<div className='mb-3 flex items-center gap-2'>
				<div className='flex size-8 items-center justify-center rounded-full bg-brand/10'>
					{isDetecting ? (
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
						>
							<Radar className='size-4 text-brand' />
						</motion.div>
					) : (
						<Sparkles className='size-4 text-brand' />
					)}
				</div>
				<div>
					<h4 className='text-sm font-bold text-text'>
						{isFormed ? tc('tasteYourProfile') : tc('tasteBuildingProfile')}
					</h4>
					<p className='text-xs text-text-muted'>
						{isFormed
							? tc('tastePersonalized')
							: tc('tasteInteractions', {
									count: eventCount,
									total: minEvents,
								})}
					</p>
				</div>
			</div>

			{/* Radar chart */}
			<div className='flex justify-center'>
				<div className='relative'>
					<svg
						width={radarSize}
						height={radarSize}
						viewBox={`0 0 ${radarSize} ${radarSize}`}
						className='overflow-visible'
					>
						{/* Grid circles */}
						<g className='stroke-border-subtle' strokeWidth={0.5} fill='none'>
							{gridLines.map(line => (
								<line
									key={line.key}
									x1={line.x1}
									y1={line.y1}
									x2={line.x2}
									y2={line.y2}
								/>
							))}
						</g>
						{/* Spokes */}
						<g className='stroke-border' strokeWidth={0.5}>
							{spokeLines.map(line => (
								<line
									key={line.key}
									x1={line.x1}
									y1={line.y1}
									x2={line.x2}
									y2={line.y2}
								/>
							))}
						</g>
						{/* Radar fill */}
						<AnimatePresence>
							{radarPath && (
								<motion.path
									d={radarPath}
									fill='var(--brand)'
									fillOpacity={0.2}
									stroke='var(--brand)'
									strokeWidth={2}
									initial={{ pathLength: 0, opacity: 0 }}
									animate={{ pathLength: 1, opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{
										duration: DURATION_S.dramatic,
										ease: 'easeOut',
									}}
								/>
							)}
						</AnimatePresence>
					</svg>

					{/* Detecting pulse */}
					{isDetecting && !isFormed && (
						<motion.div
							className='pointer-events-none absolute inset-0 rounded-full border-2 border-brand/50'
							animate={{
								scale: [1, 1.3, 1],
								opacity: [0.6, 0, 0.6],
							}}
							transition={{ duration: 2, repeat: Infinity }}
						/>
					)}
				</div>
			</div>

			{/* Dimension labels (outside chart) */}
			{!compact && (
				<div className='mt-3 flex flex-wrap justify-center gap-2'>
					{TASTE_DIMENSIONS.map(dim => {
						const value = animatedProfile[dim.key as keyof TasteProfile] ?? 0
						const hasValue = value > 0
						return (
							<motion.span
								key={dim.key}
								className={cn(
									'rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
									hasValue
										? 'bg-brand/10 text-brand'
										: 'bg-bg-elevated text-text-muted',
								)}
								animate={{ opacity: hasValue ? 1 : 0.5 }}
							>
								{tc(dim.labelKey)}
							</motion.span>
						)
					})}
				</div>
			)}

			{/* Progress bar */}
			{!isFormed && (
				<div className='mt-4'>
					<div className='h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated'>
						<motion.div
							className='h-full rounded-full bg-brand'
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{ duration: DURATION_S.slow, ease: 'easeOut' }}
						/>
					</div>
				</div>
			)}
		</motion.div>
	)
}
