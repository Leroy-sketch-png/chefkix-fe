'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, Clock, Flame, Star, Play, Sparkles, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe, RecommendationResponse } from '@/lib/types/recipe'
import { getTonightsPick } from '@/services/recipe'
import { difficultyToDisplay } from '@/lib/apiUtils'
import { TRANSITION_SPRING, CARD_FEED_HOVER, ICON_BUTTON_HOVER, ICON_BUTTON_TAP } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { logDevError } from '@/lib/dev-log'
import { QualityBadge } from '@/components/recipe/QualityBadge'
import { Skeleton } from '@/components/ui/skeleton'

interface TonightsPickProps {
	className?: string
}

/**
 * "Tonight's Pick" hero card â€” personalized daily recipe recommendation.
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
 * Degrades gracefully: unauthenticated â†’ trending + seasonal + quality only.
 */
export const TonightsPick = ({ className }: TonightsPickProps) => {
	const t = useTranslations('dashboard')
	const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)

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
					<Skeleton className='size-28 flex-shrink-0 rounded-xl md:h-32 md:w-32' />
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
					'relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-bg-card via-bg-card to-brand/5 p-5',
					className,
				)}
			>
				<div className='flex items-center gap-1.5'>
					<Sparkles className='size-3.5 text-streak' />
					<span className='text-xs font-bold uppercase tracking-wider text-streak'>
						{t('tpLabel')}
					</span>
				</div>
				<p className='mt-2 text-sm text-text-secondary'>
					{hasError
						? t('tpErrorMsg')
						: t('tpEmptyMsg')}
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

	const { recipe, whyRecommended, matchSignals, confidenceScore } = recommendation
	const coverImage = recipe.coverImageUrl?.[0] || '/placeholder-recipe.svg'
	const difficulty = difficultyToDisplay(recipe.difficulty)
	const totalTime =
		recipe.totalTimeMinutes || recipe.prepTimeMinutes + recipe.cookTimeMinutes

	return (
		<motion.div
			className={cn(
				'group relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-bg-card via-bg-card to-brand/5 transition-all',
				className,
			)}
			whileHover={CARD_FEED_HOVER}
			transition={TRANSITION_SPRING}
		>
			<Link href={`/recipes/${recipe.id}?cook=true`} className='block'>
				<div className='flex gap-4 p-4 md:p-5'>
					{/* Recipe Image */}
					<div className='relative size-28 flex-shrink-0 overflow-hidden rounded-xl md:h-32 md:w-32'>
						<Image
							src={coverImage}
							alt={recipe.title}
							fill
							className='object-cover transition-transform duration-500 group-hover:scale-110'
							sizes='128px'
						/>
						{/* Cook CTA overlay */}
						<div className='absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30'>
							<motion.div
								className='rounded-full bg-brand p-2 opacity-100 shadow-lg transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100'
								whileHover={ICON_BUTTON_HOVER}
								whileTap={ICON_BUTTON_TAP}
								transition={TRANSITION_SPRING}
							>
								<Play className='size-4 text-white' fill='white' />
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
					<div className='flex flex-1 flex-col justify-between'>
						{/* Label + Confidence */}
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-1.5'>
								<Sparkles className='size-3.5 text-streak' />
								<span className='text-xs font-bold uppercase tracking-wider text-streak'>
									{t('tpLabel')}
								</span>
							</div>
							{confidenceScore >= 0.8 && (
								<span className='flex items-center gap-1 text-xs text-success'>
									<TrendingUp className='size-3' />
									{t('tpGreatMatch')}
								</span>
							)}
						</div>

						{/* Title */}
						<h3 className='line-clamp-2 text-lg font-bold leading-snug text-text transition-colors group-hover:text-brand'>
							{recipe.title}
						</h3>

						{/* Why Recommended */}
						{whyRecommended && (
							<p className='line-clamp-1 text-sm text-brand/80'>
								{whyRecommended}
							</p>
						)}

						{/* Match Signals as tags */}
						{matchSignals && matchSignals.length > 0 && (
							<div className='flex flex-wrap gap-1'>
								{matchSignals.slice(0, 2).map((signal, idx) => (
									<span
										key={idx}
										className='rounded-full bg-brand/10 px-2 py-0.5 text-2xs text-brand'
									>
										{signal}
									</span>
								))}
							</div>
						)}

						{/* Stats row */}
						<div className='flex flex-wrap items-center gap-3 text-xs tabular-nums text-text-muted'>
							{totalTime > 0 && (
								<span className='flex items-center gap-1'>
									<Clock className='size-3.5' />
									{totalTime} min
								</span>
							)}
							<span className='flex items-center gap-1'>
								<Flame className='size-3.5' />
								{difficulty}
							</span>
							{(recipe.averageRating ?? 0) > 0 && (
								<span className='flex items-center gap-1'>
									<Star className='size-3.5 fill-warning text-warning' />
									{recipe.averageRating?.toFixed(1)}
								</span>
							)}
							{recipe.cookCount > 0 && (
								<span className='flex items-center gap-1'>
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
