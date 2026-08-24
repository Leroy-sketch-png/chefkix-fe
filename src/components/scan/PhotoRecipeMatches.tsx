'use client'

import { Loader2, SearchX, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PhotoRecipeMatch } from '@/lib/types/photo-intelligence'
import { PhotoRecipeMatchCard } from './PhotoRecipeMatchCard'

interface PhotoRecipeMatchesProps {
	matches: PhotoRecipeMatch[]
	loading?: boolean
	error?: string | null
	mode: 'ingredients' | 'dish'
}

/** Shared result list for HGAT ingredient matches and CLIP dish retrieval. */
export function PhotoRecipeMatches({
	matches,
	loading = false,
	error,
	mode,
}: PhotoRecipeMatchesProps) {
	const t = useTranslations('cooking')
	const title =
		mode === 'ingredients'
			? t('scanRecipeMatchesTitle')
			: t('scanDishMatchesTitle')

	return (
		<section className='space-y-3' aria-live='polite' aria-busy={loading}>
			<div className='flex items-center justify-between gap-3'>
				<h2 className='inline-flex items-center gap-2 font-semibold text-text-primary'>
					<Sparkles className='size-4 text-brand' /> {title}
				</h2>
				{!loading && matches.length > 0 && (
					<span className='text-sm text-text-muted'>
						{matches.length} {t('scanRecipesLabel')}
					</span>
				)}
			</div>
			{loading && (
				<div className='flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-4 text-sm text-text-secondary'>
					<Loader2 className='size-4 animate-spin text-brand' />{' '}
					{t('scanFindingRecipes')}
				</div>
			)}
			{error && !loading && (
				<div
					className='rounded-2xl border border-warning/20 bg-warning/8 p-4 text-sm text-warning-vivid'
					role='status'
				>
					{error}
				</div>
			)}
			{!loading && !error && matches.length === 0 && (
				<div className='flex items-center gap-3 rounded-2xl border border-dashed border-border-subtle p-5 text-sm text-text-muted'>
					<SearchX className='size-5 shrink-0' /> {t('scanNoRecipeMatches')}
				</div>
			)}
			{!loading && !error && matches.length > 0 && (
				<div className='space-y-3'>
					{matches.map(match => (
						<PhotoRecipeMatchCard key={match.recipeId} match={match} />
					))}
				</div>
			)}
		</section>
	)
}
