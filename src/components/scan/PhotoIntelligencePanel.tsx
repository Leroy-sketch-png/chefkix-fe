'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { parseError, type ApiError } from '@/lib/error-utils'
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
	const [matchSource, setMatchSource] = useState<
		'backend' | 'stored-overlap' | null
	>(null)
	const [withheldRecipeCount, setWithheldRecipeCount] = useState(0)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<ApiError | null>(null)
	const [retryKey, setRetryKey] = useState(0)
	const loadingRef = useRef(false)

	useEffect(() => {
		if (ingredients.length === 0) {
			loadingRef.current = false
			setMatches([])
			setMatchSource(null)
			setWithheldRecipeCount(0)
			setError(null)
			setLoading(false)
			return
		}

		let active = true
		const controller = new AbortController()
		loadingRef.current = true
		setLoading(true)
		setMatchSource(null)
		setWithheldRecipeCount(0)
		setError(null)
		void findRecipesFromIngredients(ingredients, controller.signal)
			.then(response => {
				if (active) setMatches(response.matches)
				if (active) setMatchSource(response.source)
				if (active) setWithheldRecipeCount(response.withheldRecipeCount ?? 0)
			})
			.catch(matchError => {
				if (active && !controller.signal.aborted) {
					setMatches([])
					setMatchSource(null)
					setWithheldRecipeCount(0)
					setError(parseError(matchError))
				}
			})
			.finally(() => {
				if (active) {
					loadingRef.current = false
					setLoading(false)
				}
			})
		return () => {
			active = false
			controller.abort()
			loadingRef.current = false
		}
	}, [ingredients, retryKey, t])

	const retryMatching = () => {
		if (loadingRef.current) return
		loadingRef.current = true
		setError(null)
		setLoading(true)
		setRetryKey(key => key + 1)
	}

	if (ingredients.length === 0) return null
	return (
		<div
			id='ingredient-match-results'
			tabIndex={-1}
			className='mt-6 scroll-mt-6 border-t border-border-subtle pt-6'
		>
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
							{matchSource === 'stored-overlap'
								? t('scanStoredOverlapResultsCount', {
										count: matches.length,
									})
								: t('scanYouHaveIngredientsFor', {
										count: matches.length,
									})}
						</p>
					)}
				</div>
				<span className='rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-muted'>
					{t(`scanRecipeInputSource${inputSource}`)}
				</span>
			</div>
			{matchSource === 'stored-overlap' && (
				<p className='mb-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs text-text-secondary'>
					{t('scanStoredOverlapDisclosure', {
						withheld: withheldRecipeCount,
					})}
				</p>
			)}
			<PhotoRecipeMatches
				matches={matches}
				loading={loading}
				error={error}
				mode='ingredients'
				source={matchSource ?? 'backend'}
				onRetry={retryMatching}
			/>
		</div>
	)
}
