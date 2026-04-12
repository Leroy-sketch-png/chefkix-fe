'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
	ChefHat,
	Clock,
	Flame,
	Star,
	Play,
	Sparkles,
	TrendingUp,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe, RecommendationResponse } from '@/lib/types/recipe'
import { getTonightsPick } from '@/services/recipe'
import { difficultyToDisplay } from '@/lib/apiUtils'
import {
	TRANSITION_SPRING,
	CARD_FEED_HOVER,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { logDevError } from '@/lib/dev-log'
import { QualityBadge } from '@/components/recipe/QualityBadge'
import { Skeleton } from '@/components/ui/skeleton'

interface TonightsPickProps {
	className?: string
}

const normalizeRecommendationText = (value?: string | null) =>
	(value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

/**
 * "Tonight's Pick" hero card — personalized daily recipe recommendation.
 *
 * BE uses 5-signal scoring (RecipeService.scoreTonightsPick):
 * - Taste match (0.30): user preferences + cuisine history
 * - Trending (0.20): normalized trendingScore
 * - Seasonal (0.20): month-appropriate tag matching
 * - Difficulty fit (0.15): skill-level-appropriate
 * - Quality (0.15): averageRating + cookCount
 *
 * Now returns RecommendationResponse with:
 * - recipe: RecipeDetailResponse
 * - whyRecommended: string (main reason)
 * - matchSignals: string[] (all matching signals)
 * - confidenceScore: number (0-1)
 *
 * Degrades gracefully: unauthenticated → trending + seasonal + quality only.
 */
export const TonightsPick = ({ className }: TonightsPickProps) => {
	const t = useTranslations('dashboard')
	const [recommendation, setRecommendation] =
		useState<RecommendationResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)
	const [imgError, setImgError] = useState(false)

	useEffect(() => {
		const fetchPick = async () => {
			try {
				const res = await getTonightsPick()
				if (res.success && res.data) {
					setRecommendation(res.data)
				}
			} catch (err) {
				logDevError("Failed to fetch Tonight's Pick:", err)
				setHasError(true)
			} finally {
				setIsLoading(false)
			}
		}
		fetchPick()
	}, [])

	if (isLoading) {
		return (
			<div
				className={cn(
					'rounded-2xl border border-border-subtle bg-bg-card',
					className,
				)}
			>
				<div className='flex gap-4 p-4 md:p-5'>
					<Skeleton className='size-20 flex-shrink-0 rounded-xl sm:size-24 md:size-32' />
					<div className='flex flex-1 flex-col justify-between gap-2'>
						<Skeleton className='h-3 w-24' />
						<Skeleton className='h-5 w-full' />
						<Skeleton className='h-4 w-3/4' />
						<div className='flex gap-3'>
							<Skeleton className='h-3 w-16' />
							<Skeleton className='h-3 w-16' />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!recommendation?.recipe) {
		return (
			<div
				className={cn(
					'relative overflow-hidden rounded-2xl border border-brand/20 bg-bg-card p-5 shadow-card',
					className,
				)}
			>
				<div className='flex items-center gap-1.5'>
					<Sparkles className='size-3.5 text-streak' />
					<span className='text-xs font-semibold text-streak'>
						{t('tpLabel')}
					</span>
				</div>
				<p className='mt-2 text-sm text-text-secondary'>
					{hasError ? t('tpErrorMsg') : t('tpEmptyMsg')}
				</p>
				<Link
					href='/explore'
					className='mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline'
				>
					<ChefHat className='size-4' />
					{t('tpExplore')}
				</Link>
			</div>
		)
	}

	const { recipe, whyRecommended, matchSignals, confidenceScore } =
		recommendation
	const coverImage = imgError
		? '/placeholder-recipe.svg'
		: recipe.coverImageUrl?.[0] || '/placeholder-recipe.svg'
	const difficulty = difficultyToDisplay(recipe.difficulty)
	const totalTime =
		recipe.totalTimeMinutes ||
		(recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
	const normalizedWhyRecommended = normalizeRecommendationText(whyRecommended)
	const visibleSignals =
		matchSignals
			?.filter((signal, index, signals) => {
				const normalizedSignal = normalizeRecommendationText(signal)

				if (!normalizedSignal) {
					return false
				}

				const firstMatchIndex = signals.findIndex(
					candidate =>
						normalizeRecommendationText(candidate) === normalizedSignal,
				)

				if (firstMatchIndex !== index) {
					return false
				}

				if (!normalizedWhyRecommended) {
					return true
				}

				return (
					!normalizedSignal.includes(normalizedWhyRecommended) &&
					!normalizedWhyRecommended.includes(normalizedSignal)
				)
			})
			.slice(0, 2) ?? []

	return (
		<motion.div
			className={cn(
				'group relative overflow-hidden rounded-2xl border border-brand/20 bg-bg-card shadow-card transition-all',
				className,
			)}
			whileHover={CARD_FEED_HOVER}
			transition={TRANSITION_SPRING}
		>
			<Link
				href={`/recipes/${recipe.id}?cook=true`}
				className='block'
				aria-label={t('tpCookAriaLabel', { title: recipe.title })}
			>
				<div className='flex gap-3 p-3 sm:gap-4 sm:p-4 md:p-5'>
					{/* Recipe Image */}
					<div className='relative size-20 flex-shrink-0 overflow-hidden rounded-xl sm:size-24 md:size-32'>
						<Image
							src={coverImage}
							alt={recipe.title}
							fill
							className='object-cover transition-transform duration-500 group-hover:scale-110'
							sizes='128px'
							onError={() => setImgError(true)}
						/>
						{/* Cook CTA overlay */}
						<div className='absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30'>
							<motion.div
								className='rounded-full bg-brand p-2.5 opacity-100 shadow-lg transition-opacity duration-300 md:p-3 md:opacity-0 md:group-hover:opacity-100'
								whileHover={ICON_BUTTON_HOVER}
								whileTap={ICON_BUTTON_TAP}
								transition={TRANSITION_SPRING}
							>
								<Play className='size-5 text-white' fill='white' />
							</motion.div>
						</div>
						{/* Quality badge - show Foolproof tier */}
						{recipe.qualityTier === 'Foolproof' && (
							<div className='absolute bottom-2 left-2'>
								<QualityBadge
									tier='Foolproof'
									size='sm'
									showLabel={false}
									animate={false}
								/>
							</div>
						)}
					</div>

					{/* Recipe Info */}
					<div className='flex min-w-0 flex-1 flex-col justify-between gap-1.5 sm:gap-2'>
						{/* Label + Confidence */}
						<div className='flex flex-wrap items-center justify-between gap-2'>
							<div className='flex items-center gap-1.5'>
								<Sparkles className='size-3.5 text-streak' />
								<span className='text-xs font-semibold text-streak'>
									{t('tpLabel')}
								</span>
							</div>
							{confidenceScore >= 0.8 && (
								<span className='flex shrink-0 items-center gap-1 text-xs text-success'>
									<TrendingUp className='size-3' />
									{t('tpGreatMatch')}
								</span>
							)}
						</div>

						{/* Title */}
						<h3
							className='line-clamp-2 text-base font-bold leading-snug text-text transition-colors group-hover:text-brand sm:text-lg'
							title={recipe.title}
						>
							{recipe.title}
						</h3>

						{/* Why Recommended — hide when signals cover the same info */}
						{whyRecommended && visibleSignals.length === 0 && (
							<p className='line-clamp-1 text-xs leading-snug text-text-secondary sm:text-sm'>
								{whyRecommended}
							</p>
						)}

						{/* Match Signals as tags (skip whyRecommended to avoid duplication) */}
						{visibleSignals.length > 0 && (
							<div className='flex flex-wrap gap-1.5'>
								{visibleSignals.slice(0, 2).map((signal, idx) => (
									<span
										key={idx}
										title={signal}
										className='inline-flex max-w-full truncate rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium leading-tight text-brand'
									>
										{signal}
									</span>
								))}
							</div>
						)}

						{/* Stats row */}
						<div className='grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs tabular-nums text-text-muted sm:flex sm:flex-wrap sm:items-center'>
							{totalTime > 0 && (
								<span className='flex items-center gap-1 whitespace-nowrap'>
									<Clock className='size-3.5' />
									{t('tpMin', { count: totalTime })}
								</span>
							)}
							<span className='flex items-center gap-1 whitespace-nowrap'>
								<Flame className='size-3.5' />
								{difficulty}
							</span>
							{(recipe.averageRating ?? 0) > 0 && (
								<span className='flex items-center gap-1 whitespace-nowrap'>
									<Star className='size-3.5 fill-warning text-warning' />
									{recipe.averageRating?.toFixed(1)}
								</span>
							)}
							{recipe.cookCount > 0 && (
								<span className='flex items-center gap-1 whitespace-nowrap'>
									<ChefHat className='size-3.5' />
									{t('tpCooked', { count: recipe.cookCount })}
								</span>
							)}
						</div>
					</div>
				</div>
			</Link>
		</motion.div>
	)
}
