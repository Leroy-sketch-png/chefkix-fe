'use client'

import { Loader2, RotateCw, SearchX, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import type { ApiError } from '@/lib/error-utils'
import type { PhotoRecipeMatch } from '@/lib/types/photo-intelligence'
import { PhotoRecipeMatchCard } from './PhotoRecipeMatchCard'

interface PhotoRecipeMatchesProps {
	matches: PhotoRecipeMatch[]
	loading?: boolean
	error?: ApiError | null
	mode: 'ingredients' | 'dish'
	source?: 'backend' | 'stored-overlap'
	onRetry?: () => void
}

/** Shared result list for HGAT ingredient matches and CLIP dish retrieval. */
export function PhotoRecipeMatches({
	matches,
	loading = false,
	error,
	mode,
	source = 'backend',
	onRetry,
}: PhotoRecipeMatchesProps) {
	const t = useTranslations('cooking')
	const title =
		mode === 'ingredients'
			? t(
					source === 'stored-overlap'
						? 'scanStoredOverlapTitle'
						: 'scanRecipeMatchesTitle',
				)
			: t('scanDishMatchesTitle')
	const requiresSignIn = error?.status === 401
	const accessDenied = error?.status === 403
	const retryable =
		error !== null &&
		error !== undefined &&
		(error.status === 0 ||
			error.status === 408 ||
			error.status === 429 ||
			error.status >= 500)
	const errorMessage = requiresSignIn
		? t('scanMatchingRequiresSignIn')
		: accessDenied
			? t('scanMatchingAccessDenied')
			: retryable
				? t('scanRecipeMatchingUnavailable')
				: t('scanMatchingCouldNotComplete')

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
					role='alert'
				>
					<div className='flex min-w-0 flex-wrap items-center justify-between gap-3'>
						<p className='min-w-0 [overflow-wrap:anywhere]'>{errorMessage}</p>
						{requiresSignIn && (
							<Link
								href={`${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(PATHS.SCAN)}`}
								className='inline-flex min-h-10 items-center rounded-lg border border-border bg-bg-card px-3 py-2 font-medium text-text-primary hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
							>
								{t('scanSignInToMatch')}
							</Link>
						)}
						{retryable && onRetry && (
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={onRetry}
							>
								<RotateCw aria-hidden='true' />
								{t('scanRetryIngredientMatching')}
							</Button>
						)}
					</div>
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
