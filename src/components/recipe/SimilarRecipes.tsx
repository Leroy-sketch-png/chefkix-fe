'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, Clock, Flame, Star, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '@/lib/types/recipe'
import { getSimilarRecipes } from '@/services/recipe'
import { difficultyToDisplay } from '@/lib/apiUtils'
import { TRANSITION_SPRING, CARD_HOVER, staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

interface SimilarRecipesProps {
	recipeId: string
	className?: string
}

export const SimilarRecipes = ({ recipeId, className }: SimilarRecipesProps) => {
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const t = useTranslations('recipe')

	useEffect(() => {
		const fetchSimilar = async () => {
			try {
				const res = await getSimilarRecipes(recipeId, 6)
				if (res.success && res.data) {
					setRecipes(Array.isArray(res.data) ? res.data : (res.data as unknown as { content: Recipe[] }).content ?? [])
				}
			} catch (err) {
				logDevError('Failed to fetch similar recipes:', err)
			} finally {
				setIsLoading(false)
			}
		}
		fetchSimilar()
	}, [recipeId])

	if (isLoading) {
		return (
			<div className={cn('mt-10', className)}>
				<div className='mb-6 flex items-center gap-2'>
					<Sparkles className='size-5 text-brand' />
				<h2 className='text-2xl font-bold text-text'>{t('youMightAlsoLike')}</h2>
				</div>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{[1, 2, 3].map(i => (
						<div
							key={i}
							className='animate-pulse rounded-2xl border border-border-subtle bg-bg-card shadow-card'
						>
							<div className='h-40 rounded-t-2xl bg-bg-elevated' />
							<div className='space-y-2 p-4'>
								<div className='h-5 w-3/4 rounded bg-bg-elevated' />
								<div className='h-4 w-1/2 rounded bg-bg-elevated' />
								<div className='flex gap-3'>
									<div className='h-3 w-16 rounded bg-bg-elevated' />
									<div className='h-3 w-16 rounded bg-bg-elevated' />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	if (recipes.length === 0) return null

	return (
		<div className={cn('mt-10', className)}>
			<div className='mb-6 flex items-center gap-2'>
				<Sparkles className='size-5 text-brand' />
				<h2 className='text-2xl font-bold text-text'>{t('youMightAlsoLike')}</h2>
			</div>
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
			>
				{recipes.map(recipe => (
					<SimilarRecipeCard key={recipe.id} recipe={recipe} />
				))}
			</motion.div>
		</div>
	)
}

function SimilarRecipeCard({ recipe }: { recipe: Recipe }) {
	const coverImage = recipe.coverImageUrl?.[0] || '/placeholder-recipe.svg'
	const difficulty = difficultyToDisplay(recipe.difficulty)
	const totalTime =
		recipe.totalTimeMinutes || recipe.prepTimeMinutes + recipe.cookTimeMinutes

	return (
		<motion.div
			variants={staggerItem}
			whileHover={CARD_HOVER}
			transition={TRANSITION_SPRING}
			className='group overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-all hover:shadow-warm'
		>
			<Link href={`/recipes/${recipe.id}`} className='block'>
				<div className='relative h-40 overflow-hidden'>
					<Image
						src={coverImage}
						alt={recipe.title}
						fill
						className='object-cover transition-transform duration-500 group-hover:scale-110'
						sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
					/>
				</div>
				<div className='p-4'>
					<h3 className='line-clamp-2 text-base font-serif font-bold text-text transition-colors group-hover:text-brand'>
						{recipe.title}
					</h3>
					<div className='mt-2 flex flex-wrap items-center gap-3 text-xs tabular-nums text-text-muted'>
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
								{recipe.cookCount}
							</span>
						)}
					</div>
				</div>
			</Link>
		</motion.div>
	)
}
