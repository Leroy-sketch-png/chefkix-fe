'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
	ChefHat,
	Clock,
	Flame,
	Star,
	TrendingUp,
	RefreshCw,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { RecommendationResponse } from '@/lib/types/recipe'
import { getTonightsPick } from '@/services/recipe'
import { difficultyToDisplay } from '@/lib/apiUtils'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { logDevError } from '@/lib/dev-log'
import { Skeleton } from '@/components/ui/skeleton'
import { MagicCard } from '@/components/ui/magic-card'
import { NumberTicker } from '@/components/ui/number-ticker'

interface TonightsPickProps {
	className?: string
}

/**
 * Tonight's Pick — AI-powered personalized dinner recommendation.
 *
 * Backend scoring algorithm (5-signal weighted blend):
 *   1. Taste profile match  — 0.30 weight
 *   2. Trending score       — 0.20 weight
 *   3. Seasonal relevance   — 0.20 weight
 *   4. Difficulty fit        — 0.15 weight
 *   5. Quality rating       — 0.15 weight
 *
 * The recommendation refreshes daily and falls back to trending
 * if the personalization endpoint is unavailable.
 */

const TONIGHTS_PICK_TIMEOUT_MS = 8000

const normalizeRecommendationText = (value?: string | null) =>
	(value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

export const TonightsPick = ({ className }: TonightsPickProps) => {
	const t = useTranslations('dashboard')
	const [recommendation, setRecommendation] =
		useState<RecommendationResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)
	const [imgError, setImgError] = useState(false)
	const [retryCount, setRetryCount] = useState(0)

	useEffect(() => {
		let cancelled = false

		const fetchPick = async () => {
			setIsLoading(true)
			setHasError(false)
			try {
				const res = await getTonightsPick({
					timeoutMs: TONIGHTS_PICK_TIMEOUT_MS,
				})
				if (cancelled) return

				if (res.success && res.data?.recipe) {
					setRecommendation(res.data)
					setHasError(false)
					return
				}

				setHasError(true)
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
	}, [retryCount])

	if (isLoading) {
		return (
			<div
				data-testid='tonights-pick'
				className={cn(
					'relative overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card sm:p-5',
					className,
				)}
			>
				<div className='mb-4 flex items-center justify-between'>
					<div className='inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-3 py-1 text-xs font-bold text-brand'>
						<ChefHat className='size-3.5' />
						{t('tpLabel')}
					</div>
					<Skeleton className='h-6 w-20 rounded-full' />
				</div>

				<div className='grid gap-4'>
					<Skeleton className='h-40 w-full rounded-xl' />
					<div className='space-y-2'>
						<Skeleton className='h-5 w-3/4' />
						<Skeleton className='h-4 w-11/12' />
					</div>
					<div className='flex gap-2'>
						<Skeleton className='h-6 w-16 rounded-full' />
						<Skeleton className='h-6 w-20 rounded-full' />
						<Skeleton className='h-6 w-14 rounded-full' />
					</div>
				</div>
			</div>
		)
	}

	if (!recommendation?.recipe) {
		return (
			<div
				data-testid='tonights-pick'
				className={cn(
					'relative overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card sm:p-5',
					className,
				)}
			>
				<div className='mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-3 py-1 text-xs font-bold text-brand'>
					<ChefHat className='size-3.5' />
					{t('tpLabel')}
				</div>

				<div className='space-y-2'>
					<h3 className='text-base font-bold text-text-primary'>
						{hasError ? t('tpErrorMsg') : t('tpEmptyMsg')}
					</h3>
					<p className='text-sm text-text-secondary'>
						{hasError ? t('tpErrorDesc') : t('tpEmptyDesc')}
					</p>
				</div>

				<div className='mt-4 flex flex-wrap gap-2'>
					{hasError && (
						<button
							type='button'
							onClick={() => setRetryCount(c => c + 1)}
							className='inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand/90'
						>
							<RefreshCw className='size-3.5' />
							{t('tpRetry')}
						</button>
					)}
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary'
					>
						<ChefHat className='size-3.5' />
						{t('tpExplore')}
					</Link>
				</div>
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

				if (!normalizedSignal) return false

				const firstMatchIndex = signals.findIndex(
					candidate =>
						normalizeRecommendationText(candidate) === normalizedSignal,
				)

				if (firstMatchIndex !== index) return false
				if (!normalizedWhyRecommended) return true

				return (
					!normalizedSignal.includes(normalizedWhyRecommended) &&
					!normalizedWhyRecommended.includes(normalizedSignal)
				)
			})
			.slice(0, 2) ?? []

	return (
		<MagicCard
			data-testid='tonights-pick'
			mode='orb'
			glowFrom='var(--color-brand)'
			glowTo='var(--color-xp)'
			className={cn(
				'relative overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card/75 backdrop-blur-md shadow-card p-0',
				className,
			)}
		>
			<Link
				href={`/recipes/${recipe.id}?cook=true`}
				className='group block relative z-40'
				data-testid='tonights-pick-link'
				aria-label={t('tpCookAriaLabel', { title: recipe.title })}
			>
				<div className='relative h-44 w-full overflow-hidden'>
					<Image
						src={coverImage}
						alt={recipe.title}
						fill
						className='object-cover transition-transform duration-300 group-hover:scale-105'
						sizes='(max-width: 1280px) 100vw, 352px'
						onError={() => setImgError(true)}
					/>
					<div className='absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent' />

					<div className='absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-2xs font-bold text-white'>
						<ChefHat className='size-3' />
						<span>{t('tpLabel')}</span>
					</div>

					{confidenceScore >= 0.8 && (
						<div className='absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-success/35 bg-success/15 px-2.5 py-1 text-2xs font-bold text-success'>
							<TrendingUp className='size-3' />
							{t('tpGreatMatch')}
						</div>
					)}
				</div>

				<div className='space-y-3 p-4'>
					{whyRecommended && (
						<span className='inline-flex items-center rounded-lg border border-brand/20 bg-brand/8 px-2.5 py-1 text-xs font-semibold text-brand'>
							{whyRecommended}
						</span>
					)}

					<h3 className='line-clamp-2 text-lg font-bold leading-tight text-text-primary transition-colors duration-200 group-hover:text-brand'>
						{recipe.title}
					</h3>

					{visibleSignals.length > 0 && (
						<div className='flex flex-wrap gap-1.5'>
							{visibleSignals.map((signal, idx) => (
								<span
									key={`${signal}-${idx}`}
									className='inline-flex items-center rounded-full border border-border-subtle bg-bg-elevated px-2 py-0.5 text-2xs font-medium text-text-secondary'
								>
									{signal}
								</span>
							))}
						</div>
					)}

					<div className='flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs font-medium text-text-secondary'>
						{totalTime > 0 && (
							<span className='inline-flex items-center gap-1'>
								<Clock className='size-3.5' />
								<span className='font-semibold text-text-secondary'>
									{totalTime}
								</span>{' '}
								{t('tpMin', { count: totalTime })
									.replace(totalTime.toString(), '')
									.trim()}
							</span>
						)}
						<span className='inline-flex items-center gap-1'>
							<Flame className='size-3.5 text-streak' />
							{difficulty}
						</span>
						{(recipe.averageRating ?? 0) > 0 && (
							<span className='inline-flex items-center gap-1'>
								<Star className='size-3.5 fill-warning text-warning' />
								<span className='font-semibold text-text-secondary'>
									{(recipe.averageRating ?? 0).toFixed(1)}
								</span>
							</span>
						)}
						{recipe.cookCount > 0 && (
							<span className='inline-flex items-center gap-1'>
								<ChefHat className='size-3.5' />
								<span>
									<NumberTicker
										value={recipe.cookCount}
										className='font-semibold text-text-secondary'
									/>{' '}
									{t('tpCooked', { count: recipe.cookCount })
										.replace(recipe.cookCount.toString(), '')
										.trim()}
								</span>
							</span>
						)}
					</div>
				</div>
			</Link>
		</MagicCard>
	)
}
