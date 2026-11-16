'use client'

import Link from 'next/link'
import { ArrowLeft, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getExactIngredientFit } from '@/lib/exactIngredientFit'

interface ScanRecipeFitSummaryProps {
	providedIngredients: string[]
	recipeIngredients: string[]
}

/** Carries an exact-name scan comparison into the recipe decision screen. */
export function ScanRecipeFitSummary({
	providedIngredients,
	recipeIngredients,
}: ScanRecipeFitSummaryProps) {
	const t = useTranslations('cooking')
	const fit = getExactIngredientFit(providedIngredients, recipeIngredients)

	return (
		<section
			aria-labelledby='scan-recipe-fit-title'
			className='mb-5 border-b border-border-subtle pb-4'
		>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h3
					id='scan-recipe-fit-title'
					className='text-sm font-semibold text-text-primary'
				>
					{t('scanDetailFitTitle')}
				</h3>
				<Link
					href='/scan#ingredient-match-results'
					className='inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					<ArrowLeft className='size-4' />
					{t('scanBackToIngredientResults')}
				</Link>
			</div>

			<div className='mt-2 space-y-1 text-sm text-text-secondary'>
				<p>
					<span className='font-semibold text-text-primary'>
						{t('scanDetailFitProvided')} ({fit.provided.length}):
					</span>{' '}
					{fit.provided.join(', ')}
				</p>
				<p>
					<span className='font-semibold text-text-primary'>
						{t('scanDetailFitMatched')} ({fit.matched.length}):
					</span>{' '}
					{fit.matched.length > 0
						? fit.matched.join(', ')
						: t('scanDetailFitNoMatched')}
				</p>
				<p>
					<span className='font-semibold text-text-primary'>
						{t('scanDetailFitMissing')} ({fit.missing.length}):
					</span>{' '}
					{fit.missing.length > 0
						? fit.missing.join(', ')
						: t('scanDetailFitNoMissing')}
				</p>
			</div>

			<p className='mt-2 flex items-start gap-2 text-xs leading-relaxed text-text-muted'>
				<Info className='mt-0.5 size-3.5 shrink-0' />
				{t('scanDetailFitCounts', {
					matched: fit.matched.length,
					provided: fit.provided.length,
				})}{' '}
				{t('scanDetailFitScope')}
			</p>
		</section>
	)
}
