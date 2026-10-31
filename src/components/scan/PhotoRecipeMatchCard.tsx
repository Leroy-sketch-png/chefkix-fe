'use client'

import Link from 'next/link'
import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SubstitutionButton } from '@/components/recipe/SubstitutionButton'
import { safeRecipeImageSrc } from '@/lib/imageSafety'
import type { PhotoRecipeMatch } from '@/lib/types/photo-intelligence'

interface PhotoRecipeMatchCardProps {
	match: PhotoRecipeMatch
}

/** Displays one graph/retrieval match and keeps substitution actions local to the card. */
export function PhotoRecipeMatchCard({ match }: PhotoRecipeMatchCardProps) {
	const t = useTranslations('cooking')
	const imageUrl = safeRecipeImageSrc(match.coverImageUrl ?? undefined)

	return (
		<article className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-sm'>
			<div className='flex gap-4 p-4'>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt=''
						className='size-20 shrink-0 rounded-xl object-cover'
						loading='lazy'
					/>
				) : (
					<div
						className='size-20 shrink-0 rounded-xl bg-brand/10'
						aria-hidden='true'
					/>
				)}
				<div className='min-w-0 flex-1'>
					<div className='flex items-start justify-between gap-3'>
						<h3 className='font-semibold text-text-primary'>
							{match.recipeTitle}
						</h3>
						<span className='shrink-0 rounded-full bg-success/12 px-2 py-1 text-xs font-bold text-success'>
							{Math.round(match.matchScore * 100)}%
						</span>
					</div>
					<div className='mt-2 flex flex-wrap gap-3 text-xs text-text-muted'>
						{match.totalTimeMinutes !== undefined && (
							<span className='inline-flex items-center gap-1'>
								<Clock3 className='size-3.5' /> {match.totalTimeMinutes} min
							</span>
						)}
						{match.difficulty && <span>{match.difficulty}</span>}
					</div>
				</div>
			</div>

			<div className='space-y-4 border-t border-border-subtle px-4 py-3'>
				<div className='grid gap-3 sm:grid-cols-2'>
					<div>
						<p className='mb-1 text-xs font-semibold uppercase tracking-wide text-success'>
							{t('scanMatchedIngredients')}
						</p>
						<p className='text-sm text-text-secondary'>
							{match.matchedIngredients.length > 0
								? match.matchedIngredients.join(', ')
								: t('scanNoMatchedIngredients')}
						</p>
					</div>
					<div>
						<p className='mb-1 text-xs font-semibold uppercase tracking-wide text-warning-vivid'>
							{t('scanMissingIngredients')}
						</p>
						{match.missingIngredients.length > 0 ? (
							<ul className='space-y-1 text-sm text-text-secondary'>
								{match.missingIngredients.map(ingredient => (
									<li
										key={ingredient}
										className='group flex items-center justify-between gap-2'
									>
										<span>{ingredient}</span>
										<SubstitutionButton
											ingredientName={ingredient}
											recipeTitle={match.recipeTitle}
										/>
									</li>
								))}
							</ul>
						) : (
							<p className='text-sm text-text-secondary'>
								{t('scanNoMissingIngredients')}
							</p>
						)}
					</div>
				</div>

				<div className='flex flex-wrap items-center justify-between gap-3'>
					<p className='inline-flex items-center gap-1.5 text-xs text-text-muted'>
						<Sparkles className='size-3.5 text-brand' />{' '}
						{t('scanSubstitutionSafetyHint')}
					</p>
					<Link
						href={`/recipes/${match.recipeId}`}
						className='inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand/80'
					>
						{t('scanViewRecipe')} <ArrowRight className='size-4' />
					</Link>
				</div>
			</div>
		</article>
	)
}
