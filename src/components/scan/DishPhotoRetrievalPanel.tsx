'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, ScanSearch } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { retrieveRecipesFromDishPhoto } from '@/services/photo-intelligence'
import type { PhotoRecipeMatch } from '@/lib/types/photo-intelligence'
import { PhotoRecipeMatches } from './PhotoRecipeMatches'

/** Upload-only cross-modal flow; the CLIP endpoint is intentionally server-configured. */
export function DishPhotoRetrievalPanel() {
	const t = useTranslations('cooking')
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [matches, setMatches] = useState<PhotoRecipeMatch[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handlePhoto = async (file: File) => {
		setLoading(true)
		setError(null)
		try {
			const result = await retrieveRecipesFromDishPhoto(file)
			setMatches(result.matches)
		} catch (retrievalError) {
			setMatches([])
			setError(
				retrievalError instanceof Error
					? retrievalError.message
					: t('scanDishRetrievalUnavailable'),
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<section className='space-y-4 rounded-3xl border border-border-subtle bg-bg-card p-5 shadow-card sm:p-6'>
			<div className='flex items-start gap-3'>
				<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand'>
					<ScanSearch className='size-5' />
				</div>
				<div>
					<h2 className='font-semibold text-text-primary'>
						{t('scanDishRetrievalTitle')}
					</h2>
					<p className='mt-1 text-sm leading-6 text-text-secondary'>
						{t('scanDishRetrievalDescription')}
					</p>
				</div>
			</div>
			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				className='hidden'
				onChange={event => {
					const file = event.target.files?.[0]
					if (file) void handlePhoto(file)
					event.target.value = ''
				}}
			/>
			<button
				type='button'
				onClick={() => fileInputRef.current?.click()}
				disabled={loading}
				className='inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand/50'
			>
				{loading ? (
					<Loader2 className='size-4 animate-spin' />
				) : (
					<ImagePlus className='size-4' />
				)}
				{loading ? t('scanRetrievingMatches') : t('scanUploadDishPhoto')}
			</button>
			{(loading || error || matches.length > 0) && (
				<PhotoRecipeMatches
					matches={matches}
					loading={loading}
					error={error}
					mode='dish'
				/>
			)}
		</section>
	)
}
