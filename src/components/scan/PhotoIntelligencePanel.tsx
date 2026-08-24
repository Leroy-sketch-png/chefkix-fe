'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { IngredientDetectionResult } from '@/lib/types/ingredient-detection'
import type { PhotoRecipeMatch } from '@/lib/types/photo-intelligence'
import { findRecipesFromIngredients } from '@/services/photo-intelligence'
import { PhotoRecipeMatches } from './PhotoRecipeMatches'

interface PhotoIntelligencePanelProps {
	result: IngredientDetectionResult | null
}

/** Orchestrates detection output into the Lead-owned HGAT recipe matching seam. */
export function PhotoIntelligencePanel({
	result,
}: PhotoIntelligencePanelProps) {
	const t = useTranslations('cooking')
	const [matches, setMatches] = useState<PhotoRecipeMatch[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!result || result.detections.length === 0) {
			setMatches([])
			setError(null)
			return
		}

		let active = true
		setLoading(true)
		setError(null)
		void findRecipesFromIngredients(
			result.detections.map(detection => detection.name),
		)
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
		}
	}, [result, t])

	if (!result) return null
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
					{!loading && !error && (
						<p className='mt-1 text-sm font-medium text-brand'>
							{t('scanYouHaveIngredientsFor', { count: matches.length })}
						</p>
					)}
				</div>
				<span className='rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-muted'>
					{result.source === 'backend'
						? t('scanModelLive')
						: t('scanModelDemo')}
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
