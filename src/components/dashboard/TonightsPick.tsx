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
import { GlowCard } from '@/components/ui/glow-card'
import { Spotlight } from '@/components/ui/spotlight'

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
		let cancelled = false
		const fetchPick = async () => {
			try {
				const res = await getTonightsPick()
				if (cancelled) return
				if (res.success && res.data) {
					setRecommendation(res.data)
				}
			} catch (err) {
				logDevError("Failed to fetch Tonight's Pick:", err)
				if (!cancelled) setHasError(true)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}
		fetchPick()
		return () => {
			cancelled = true
		}
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
					href='/create'
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
		<GlowCard
			className={cn(
				'overflow-hidden border-0 p-0 relative shadow-2xl rounded-[2rem]',
				className,
			)}
			intensity={0.3}
		>
			<motion.div
				className='group relative h-[360px] w-full cursor-pointer'
				whileHover={{ scale: 0.99 }}
				transition={TRANSITION_SPRING}
			>
				<Link
					href={`/recipes/${recipe.id}?cook=true`}
					className='relative block h-full'
					aria-label={t('tpCookAriaLabel', { title: recipe.title })}
				>
					{/* Full-bleed Background Image */}
					<Image
						src={coverImage}
						alt={recipe.title}
						fill
						className='object-cover transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-1'
						sizes='(max-width: 768px) 100vw, 50vw'
						onError={() => setImgError(true)}
						priority
					/>

					{/* Deep Gradient Overlays for readability and premium feel */}
					<div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300' />
					<div className='absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent opacity-50' />

					{/* Top Label */}
					<div className='absolute top-5 left-5 z-10'>
						<div className='inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 text-sm font-bold text-white shadow-lg'>
							<Sparkles className='size-4 text-streak' />
							<span className='bg-gradient-to-r from-streak to-combo bg-clip-text text-transparent'>
								{t('tpLabel')}
							</span>
						</div>
					</div>

					{/* Top Right Confidence Badge */}
					{confidenceScore >= 0.8 && (
						<div className='absolute top-5 right-5 z-10'>
							<div className='inline-flex items-center gap-1.5 rounded-full bg-success/20 backdrop-blur-md border border-success/30 px-3 py-1.5 text-xs font-bold text-success shadow-lg'>
								<TrendingUp className='size-3.5' />
								{t('tpGreatMatch')}
							</div>
						</div>
					)}

					{/* Center Hover Play Button */}
					<div className='absolute inset-0 flex items-center justify-center z-20 pointer-events-none'>
						<motion.div className='rounded-full bg-brand/90 p-5 shadow-[0_0_40px_rgba(var(--brand),0.6)] opacity-0 scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 backdrop-blur-sm'>
							<Play className='size-8 text-white ml-1' fill='white' />
						</motion.div>
					</div>

					{/* Content at Bottom */}
					<div className='absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col gap-3 z-10'>
						<h3
							className='line-clamp-2 text-3xl font-black leading-tight text-white drop-shadow-md sm:text-4xl'
							title={recipe.title}
						>
							{recipe.title}
						</h3>

						{/* Match Signals */}
						{visibleSignals.length > 0 && (
							<div className='flex flex-wrap gap-2 mt-1'>
								{visibleSignals.slice(0, 3).map((signal, idx) => (
									<span
										key={idx}
										title={signal}
										className='inline-flex items-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold text-white shadow-sm'
									>
										{signal}
									</span>
								))}
							</div>
						)}

						{/* Stats row */}
						<div className='mt-2 flex flex-wrap items-center gap-4 text-sm font-bold text-white/90 drop-shadow-sm'>
							{totalTime > 0 && (
								<span className='flex items-center gap-1.5'>
									<Clock className='size-4 text-white/70' />
									{t('tpMin', { count: totalTime })}
								</span>
							)}
							<span className='flex items-center gap-1.5'>
								<Flame className='size-4 text-streak' />
								{difficulty}
							</span>
							{(recipe.averageRating ?? 0) > 0 && (
								<span className='flex items-center gap-1.5'>
									<Star className='size-4 fill-warning text-warning' />
									{recipe.averageRating?.toFixed(1)}
								</span>
							)}
							{recipe.cookCount > 0 && (
								<span className='flex items-center gap-1.5'>
									<ChefHat className='size-4 text-white/70' />
									{t('tpCooked', { count: recipe.cookCount })}
								</span>
							)}
						</div>
					</div>
				</Link>
			</motion.div>
		</GlowCard>
	)
}
