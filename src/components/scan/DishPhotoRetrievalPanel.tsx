'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Loader2, ScanSearch, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
	analyzeDishPhoto,
	parseSubstitutionIntent,
} from '@/services/photo-intelligence'
import { findPhotoDishSubstitutions } from '@/services/photo-substitution'
import type {
	FoodImageAnalysis,
	ParsedSubstitutionIntent,
	PhotoSubstitutionResult,
} from '@/lib/types/photo-intelligence'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** Upload a finished dish photo and show its likely dish and ingredient guesses. */
export function DishPhotoRetrievalPanel() {
	const t = useTranslations('cooking')
	const fileInputRef = useRef<HTMLInputElement>(null)
	const analysisAbortRef = useRef<AbortController | null>(null)
	const substitutionAbortRef = useRef<AbortController | null>(null)
	const [analysis, setAnalysis] = useState<FoodImageAnalysis | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [substitutionPrompt, setSubstitutionPrompt] = useState('')
	const [substitutionLoading, setSubstitutionLoading] = useState(false)
	const [substitutionError, setSubstitutionError] = useState<string | null>(
		null,
	)
	const [substitutionIntent, setSubstitutionIntent] =
		useState<ParsedSubstitutionIntent | null>(null)
	const [substitutionResult, setSubstitutionResult] =
		useState<PhotoSubstitutionResult | null>(null)

	useEffect(
		() => () => {
			analysisAbortRef.current?.abort()
			substitutionAbortRef.current?.abort()
		},
		[],
	)

	const handlePhoto = async (file: File) => {
		analysisAbortRef.current?.abort()
		substitutionAbortRef.current?.abort()
		setAnalysis(null)
		setError(null)
		setSubstitutionPrompt('')
		setSubstitutionError(null)
		setSubstitutionIntent(null)
		setSubstitutionResult(null)
		if (file.size > MAX_IMAGE_BYTES) {
			setError(t('scanFoodPhotoTooLarge'))
			return
		}

		const controller = new AbortController()
		analysisAbortRef.current = controller
		setLoading(true)
		try {
			const result = await analyzeDishPhoto(file, controller.signal)
			if (!controller.signal.aborted) setAnalysis(result)
		} catch (analysisError) {
			if (!controller.signal.aborted) {
				setError(
					analysisError instanceof Error
						? analysisError.message
						: t('scanDishRetrievalUnavailable'),
				)
			}
		} finally {
			if (analysisAbortRef.current === controller) {
				analysisAbortRef.current = null
				if (!controller.signal.aborted) setLoading(false)
			}
		}
	}

	const handleSubstitutionRequest = async (
		event: FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault()
		if (!analysis || analysis.status !== 'identified') return
		const prompt = substitutionPrompt.trim()
		if (!prompt) return

		substitutionAbortRef.current?.abort()
		const controller = new AbortController()
		substitutionAbortRef.current = controller
		setSubstitutionLoading(true)
		setSubstitutionError(null)
		setSubstitutionIntent(null)
		setSubstitutionResult(null)
		try {
			const intent = await parseSubstitutionIntent(prompt, controller.signal)
			if (controller.signal.aborted) return
			setSubstitutionIntent(intent)
			if (intent.needsClarification || !intent.ingredientToReplace) return

			const result = await findPhotoDishSubstitutions(analysis, intent)
			if (!controller.signal.aborted) setSubstitutionResult(result)
		} catch (requestError) {
			if (!controller.signal.aborted) {
				setSubstitutionError(
					requestError instanceof Error
						? requestError.message
						: t('scanSubstitutionUnavailable'),
				)
			}
		} finally {
			if (substitutionAbortRef.current === controller) {
				substitutionAbortRef.current = null
				if (!controller.signal.aborted) setSubstitutionLoading(false)
			}
		}
	}

	const substitutionStatusMessage = (
		result: PhotoSubstitutionResult,
	): string | null => {
		switch (result.status) {
			case 'ingredient_not_in_dish':
				return t('scanSubstitutionIngredientNotInDish', {
					ingredient: result.sourceIngredient,
					dish: result.dishName || t('scanSubstitutionThisDish'),
				})
			case 'ambiguous_source':
				return t('scanSubstitutionAmbiguous')
			case 'source_not_in_graph':
				return t('scanSubstitutionSourceMissing')
			case 'no_graph_edges':
				return t('scanSubstitutionNoEdges')
			case 'constraint_evidence_incomplete':
				return t('scanSubstitutionAllergenEvidenceMissing', {
					count: result.withheldCount,
				})
			case 'no_candidates_after_filter':
				return t('scanSubstitutionNoCandidatesAfterFilter')
			case 'recommendations':
				return null
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
				accept='image/jpeg,image/png,image/webp'
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

			{loading && (
				<div
					className='rounded-2xl border border-border-subtle bg-bg-elevated p-4 text-sm text-text-secondary'
					role='status'
				>
					{t('scanRetrievingMatches')}
				</div>
			)}
			{error && !loading && (
				<div
					className='rounded-2xl border border-warning/20 bg-warning/8 p-4 text-sm text-warning-vivid'
					role='alert'
				>
					{error}
				</div>
			)}
			{analysis && !loading && (
				<div
					className='space-y-4 rounded-2xl border border-border-subtle bg-bg-elevated p-4'
					aria-live='polite'
				>
					<div>
						<p className='text-xs font-semibold uppercase tracking-wide text-text-muted'>
							{analysis.status === 'identified'
								? t('scanFoodAnalysisIdentified')
								: analysis.status === 'uncertain'
									? t('scanFoodAnalysisUncertain')
									: t('scanFoodAnalysisNotFood')}
						</p>
						{analysis.dishName && (
							<h3 className='mt-1 text-lg font-semibold text-text-primary'>
								{analysis.dishName}
							</h3>
						)}
						{analysis.possibleDishes.length > 0 && (
							<p className='mt-1 text-sm text-text-secondary'>
								{t('scanFoodPossibleDishes')}:{' '}
								{analysis.possibleDishes.join(', ')}
							</p>
						)}
					</div>

					{analysis.ingredients.length > 0 ? (
						<div>
							<h4 className='mb-2 font-semibold text-text-primary'>
								{t('scanFoodIngredients')}
							</h4>
							<ul className='flex flex-wrap gap-2'>
								{analysis.ingredients.map((ingredient, index) => (
									<li
										key={`${ingredient.name}-${index}`}
										className='inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-1.5 text-sm text-text-primary'
									>
										<span>{ingredient.name}</span>
										<span className='text-xs text-text-muted'>
											{ingredient.basis === 'visible'
												? t('scanFoodVisible')
												: t('scanFoodInferred')}
										</span>
									</li>
								))}
							</ul>
						</div>
					) : (
						<p className='text-sm text-text-secondary'>
							{t('scanFoodIngredientsUnknown')}
						</p>
					)}
					<p className='text-xs leading-5 text-text-muted'>
						{t('scanFoodAnalysisCaveat')}
					</p>

					<div className='border-t border-border-subtle pt-4'>
						<h4 className='font-semibold text-text-primary'>
							{t('scanSubstitutionTitle')}
						</h4>
						<p className='mt-1 text-sm leading-6 text-text-secondary'>
							{t('scanSubstitutionDescription')}
						</p>
						{analysis.status !== 'identified' ? (
							<p
								className='mt-3 rounded-xl border border-border-subtle bg-bg-card p-3 text-sm text-text-secondary'
								role='status'
							>
								{t('scanSubstitutionIdentifiedDishRequired')}
							</p>
						) : analysis.ingredients.length === 0 ? (
							<p
								className='mt-3 rounded-xl border border-border-subtle bg-bg-card p-3 text-sm text-text-secondary'
								role='status'
							>
								{t('scanSubstitutionIngredientsRequired')}
							</p>
						) : (
							<form
								className='mt-3 space-y-3'
								onSubmit={handleSubstitutionRequest}
							>
								<label className='sr-only' htmlFor='dish-substitution-prompt'>
									{t('scanSubstitutionPromptLabel')}
								</label>
								<textarea
									id='dish-substitution-prompt'
									value={substitutionPrompt}
									onChange={event => setSubstitutionPrompt(event.target.value)}
									maxLength={500}
									placeholder={t('scanSubstitutionPromptPlaceholder')}
									rows={3}
									className='w-full resize-y rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
								/>
								<button
									type='submit'
									disabled={substitutionLoading || !substitutionPrompt.trim()}
									className='inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
								>
									{substitutionLoading ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<Send className='size-4' />
									)}
									{substitutionLoading
										? t('scanSubstitutionWorking')
										: t('scanSubstitutionSubmit')}
								</button>
							</form>
						)}

						{substitutionError && (
							<p
								className='mt-3 rounded-xl border border-warning/20 bg-warning/8 p-3 text-sm text-warning-vivid'
								role='alert'
							>
								{substitutionError}
							</p>
						)}
						{substitutionIntent?.needsClarification && (
							<p
								className='mt-3 rounded-xl border border-border-subtle bg-bg-card p-3 text-sm text-text-secondary'
								role='status'
							>
								{t('scanSubstitutionAskIngredient')}
							</p>
						)}
						{substitutionResult && (
							<div className='mt-3 space-y-3' aria-live='polite'>
								{substitutionStatusMessage(substitutionResult) && (
									<p
										className='rounded-xl border border-border-subtle bg-bg-card p-3 text-sm text-text-secondary'
										role='status'
									>
										{substitutionStatusMessage(substitutionResult)}
									</p>
								)}
								{substitutionResult.status === 'recommendations' && (
									<>
										<p className='text-sm font-medium text-text-primary'>
											{t('scanSubstitutionGraphMatches', {
												ingredient: substitutionResult.sourceIngredient,
											})}
										</p>
										<ul className='space-y-2'>
											{substitutionResult.candidates.map((candidate, index) => (
												<li
													key={`${candidate.alternative}-${index}`}
													className='rounded-xl border border-border-subtle bg-bg-card p-3'
												>
													<p className='font-medium text-text-primary'>
														{candidate.alternative}
													</p>
													{candidate.context && (
														<p className='mt-1 text-sm text-text-secondary'>
															{candidate.context}
														</p>
													)}
													{candidate.ratio !== null && (
														<p className='mt-1 text-xs text-text-muted'>
															{t('scanSubstitutionGraphRatio', {
																ratio: candidate.ratio,
															})}
														</p>
													)}
													{!candidate.targetResolved && (
														<p className='mt-1 text-xs text-warning-vivid'>
															{t('scanSubstitutionTargetUnresolved')}
														</p>
													)}
												</li>
											))}
										</ul>
									</>
								)}
								<p className='text-xs leading-5 text-text-muted'>
									{t('scanSubstitutionGraphCaveat')}
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</section>
	)
}
