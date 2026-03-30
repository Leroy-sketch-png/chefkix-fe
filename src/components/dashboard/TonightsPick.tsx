'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, Clock, Flame, Star, Play, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '@/lib/types/recipe'
import { getTonightsPick } from '@/services/recipe'
import { difficultyToDisplay } from '@/lib/apiUtils'
import { TRANSITION_SPRING, CARD_FEED_HOVER } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'

interface TonightsPickProps {
	className?: string
}

/**
 * "Tonight's Pick" hero card — shows a single trending recipe suggestion.
 *
 * Progressive data levels (Master Plan §2.1):
 * - No data (new user): trending + easy + fast
 * - Taste only: +taste vector (future)
 * - Taste + pantry: +ingredient matching (future)
 * - Full profile: +skill-appropriate (future)
 *
 * Wave 1: Cold-start only — trending recipe, sorted by cook count.
 */
export const TonightsPick = ({ className }: TonightsPickProps) => {
	const [recipe, setRecipe] = useState<Recipe | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)

	useEffect(() => {
		const fetchPick = async () => {
			try {
				const res = await getTonightsPick()
				if (res.success && res.data) {
					setRecipe(res.data)
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
					'animate-pulse rounded-2xl border border-border-subtle bg-bg-card',
					className,
				)}
			>
				<div className='flex gap-4 p-4 md:p-5'>
					<div className='h-28 w-28 flex-shrink-0 rounded-xl bg-bg-elevated md:h-32 md:w-32' />
					<div className='flex flex-1 flex-col justify-between gap-2'>
						<div className='h-4 w-24 rounded bg-bg-elevated' />
						<div className='h-5 w-full rounded bg-bg-elevated' />
						<div className='h-3 w-3/4 rounded bg-bg-elevated' />
						<div className='flex gap-3'>
							<div className='h-3 w-16 rounded bg-bg-elevated' />
							<div className='h-3 w-16 rounded bg-bg-elevated' />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!recipe) {
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
						Tonight&apos;s Pick
					</span>
				</div>
				<p className='mt-2 text-sm text-text-secondary'>
					{hasError
						? "Couldn't load tonight's suggestion — try refreshing the page."
						: 'No trending recipe yet \u2014 be the first to cook and inspire the community!'}
				</p>
				<Link
					href='/explore'
					className='mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline'
				>
					<ChefHat className='size-4' />
					Explore recipes
				</Link>
			</div>
		)
	}

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
					<div className='relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl md:h-32 md:w-32'>
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
								className='rounded-full bg-brand p-2 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100'
								whileHover={{ scale: 1.1 }}
							>
								<Play className='size-4 text-white' fill='white' />
							</motion.div>
						</div>
					</div>

					{/* Recipe Info */}
					<div className='flex flex-1 flex-col justify-between'>
						{/* Label */}
						<div className='flex items-center gap-1.5'>
							<Sparkles className='size-3.5 text-streak' />
							<span className='text-xs font-bold uppercase tracking-wider text-streak'>
								Tonight&apos;s Pick
							</span>
						</div>

						{/* Title */}
						<h3 className='line-clamp-2 text-lg font-bold leading-snug text-text transition-colors group-hover:text-brand'>
							{recipe.title}
						</h3>

						{/* Description */}
						{recipe.description && (
							<p className='line-clamp-1 text-sm text-text-secondary'>
								{recipe.description}
							</p>
						)}

						{/* Stats row */}
						<div className='flex flex-wrap items-center gap-3 text-xs text-text-muted'>
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
									{recipe.cookCount} cooked
								</span>
							)}
						</div>
					</div>
				</div>
			</Link>
		</motion.div>
	)
}
