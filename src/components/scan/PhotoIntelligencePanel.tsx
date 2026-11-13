'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { PhotoRecipeMatch } from '@/lib/types/photo-intelligence'
import { findRecipesFromIngredients } from '@/services/photo-intelligence'
import { PhotoRecipeMatches } from './PhotoRecipeMatches'

interface PhotoIntelligencePanelProps {
	ingredients: string[]
	inputSource: 'scan' | 'manual' | 'mixed'
}

/** Sends only the ingredient list the user confirmed or entered to HGAT matching. */
export function PhotoIntelligencePanel({
	ingredients,
	inputSource,
}: PhotoIntelligencePanelProps) {
	const t = useTranslations('cooking')
	const [matches, setMatches] = useState<PhotoRecipeMatch[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (ingredients.length === 0) {
			setMatches([])
			setError(null)
			setLoading(false)
			return
		}

		let active = true
		const controller = new AbortController()
		setLoading(true)
		setError(null)
		void findRecipesFromIngredients(ingredients, controller.signal)
			.then(response => {
				if (active) setMatches(response.matches)
			})
			.catch(matchError => {
				if (active) {
					setMatches([])
					setError(
						matchError instanceof Error
							? matchError.message
							: t('scanRecipeMatchingUnavailable'),
					)
				}
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
			controller.abort()
		}
	}, [ingredients, t])

	if (ingredients.length === 0) return null
	return (
		<div className='mt-6 border-t border-border-subtle pt-6'>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
				<div>
					<h2 className='font-semibold text-text-primary'>
						{t('scanIngredientIntelligenceTitle')}
					</h2>
					<p className='mt-1 text-sm text-text-secondary'>
						{t('scanIngredientIntelligenceDescription')}
					</p>
					<ul
						className='mt-2 flex flex-wrap gap-1.5'
						aria-label={t('scanIngredientsSentToMatching')}
					>
						{ingredients.map(ingredient => (
							<li
								key={ingredient.toLowerCase()}
								className='rounded-full border border-border-subtle bg-bg-card px-2.5 py-1 text-xs text-text-primary'
							>
								{ingredient}
							</li>
						))}
					</ul>
					{!loading && !error && (
						<p className='mt-1 text-sm font-medium text-brand'>
							{t('scanYouHaveIngredientsFor', { count: matches.length })}
						</p>
					)}
				</div>
				<span className='rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-muted'>
					{t(`scanRecipeInputSource${inputSource}`)}
				</span>
			</div>
			<PhotoRecipeMatches
				matches={matches}
				loading={loading}
				error={error}
				mode='ingredients'
			/>
		</div>
	)
}
