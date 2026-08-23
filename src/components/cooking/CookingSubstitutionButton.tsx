'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, Check, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Portal } from '@/components/ui/portal'
import { useAuth } from '@/hooks/useAuth'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { suggestSubstitutions, type Substitution } from '@/services/ai'
import {
	type SubstitutionFeedbackChoice,
	SubstitutionFeedbackRequest,
} from '@/services/cookingSession'
import { cn } from '@/lib/utils'
import {
	CompoundComparison,
	CompoundExplanation,
} from '@/components/recipe/CompoundExplanation'
import { AllergenSafetyIndicator } from '@/components/recipe/AllergenSafetyIndicator'
import { resolveAllergenSafety } from '@/lib/allergen-safety'

interface CookingSubstitutionButtonProps {
	ingredientName: string
	recipeTitle: string
	stepContext?: string
	onChoice: (
		choice: SubstitutionFeedbackChoice,
		substituteIngredient?: string,
	) => Promise<boolean>
}

function confidenceClass(score: number) {
	if (score >= 0.8) return 'bg-success/15 text-success'
	if (score >= 0.5) return 'bg-warning/15 text-warning'
	return 'bg-destructive/15 text-destructive'
}

/** Fetches real substitution suggestions and records the cook's explicit choice. */
export function CookingSubstitutionButton({
	ingredientName,
	recipeTitle,
	stepContext,
	onChoice,
}: CookingSubstitutionButtonProps) {
	const t = useTranslations('cooking')
	const { user } = useAuth()
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [substitutions, setSubstitutions] = useState<Substitution[]>([])
	const [error, setError] = useState<string | null>(null)
	const [customSubstitute, setCustomSubstitute] = useState('')
	const [submitting, setSubmitting] = useState(false)

	useEscapeKey(open && !submitting, () => setOpen(false))

	const fetchSuggestions = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await suggestSubstitutions(
				ingredientName,
				'unavailable',
				[
					`Recipe: ${recipeTitle}`,
					stepContext ? `Current step: ${stepContext}` : '',
				]
					.filter(Boolean)
					.join('\n'),
				undefined,
				user?.allergenFlags,
			)
			if (response.success && response.data) {
				setSubstitutions(response.data.substitutions)
			} else {
				setError(response.message || t('substitutionSuggestionsUnavailable'))
			}
		} catch {
			setError(t('substitutionSuggestionsUnavailable'))
		} finally {
			setLoading(false)
		}
	}

	const openSuggestions = () => {
		setOpen(true)
		setCustomSubstitute('')
		void fetchSuggestions()
	}

	const recordChoice = async (
		choice: SubstitutionFeedbackChoice,
		substituteIngredient?: string,
	) => {
		setSubmitting(true)
		const recorded = await onChoice(choice, substituteIngredient)
		setSubmitting(false)
		if (recorded) setOpen(false)
	}

	const recordCustomReject = () => {
		const substitute = customSubstitute.trim()
		if (!substitute) return
		void recordChoice('reject', substitute)
	}

	return (
		<>
			<button
				type='button'
				onClick={openSuggestions}
				className='inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/50'
				aria-label={t('findSubstituteForIngredient', {
					ingredient: ingredientName,
				})}
			>
				<ArrowLeftRight className='size-3.5' aria-hidden='true' />
				{t('findSubstitute')}
			</button>

			<AnimatePresence>
				{open && (
					<Portal>
						<div className='fixed inset-0 z-modal flex items-end justify-center bg-black/60 p-4 sm:items-center'>
							<motion.section
								initial={{ opacity: 0, y: 24, scale: 0.98 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 24, scale: 0.98 }}
								className='max-h-[min(90vh,48rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-modal'
								role='dialog'
								aria-modal='true'
								aria-label={t('findSubstituteForIngredient', {
									ingredient: ingredientName,
								})}
							>
								<header className='mb-4 flex items-start justify-between gap-4'>
									<div>
										<p className='text-xs font-semibold uppercase tracking-wide text-brand'>
											{t('substitutionSuggestions')}
										</p>
										<h2 className='mt-1 text-lg font-bold text-text-primary'>
											{t('substitutionChoiceTitle', {
												ingredient: ingredientName,
											})}
										</h2>
									</div>
									<button
										type='button'
										onClick={() => setOpen(false)}
										disabled={submitting}
										className='rounded-full p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
										aria-label={t('closeSubstitution')}
									>
										<X className='size-5' />
									</button>
								</header>

								{loading ? (
									<div className='flex flex-col items-center gap-3 py-12 text-sm text-text-muted'>
										<Loader2 className='size-7 animate-spin text-brand' />
										{t('substitutionLoading')}
									</div>
								) : error ? (
									<p className='rounded-xl bg-warning/10 p-4 text-sm text-warning'>
										{error}
									</p>
								) : substitutions.length > 0 ? (
									<div className='space-y-4'>
										<CompoundComparison
											originalIngredient={ingredientName}
											substitutions={substitutions}
											allergenFlags={user?.allergenFlags}
										/>
										<ul className='space-y-3'>
											{substitutions.map(substitution => {
												const safety = resolveAllergenSafety(
													substitution,
													user?.allergenFlags,
												)
												const blocked = safety.status === 'blocked'
												return (
													<li
														key={substitution.name}
														className='rounded-xl border border-border-subtle bg-bg-elevated p-3'
													>
														<div className='flex items-center justify-between gap-3'>
															<div>
																<p className='font-semibold text-text-primary'>
																	{substitution.name}
																</p>
																<p className='text-xs text-text-muted'>
																	{substitution.ratio}
																</p>
															</div>
															<span
																className={cn(
																	'rounded-full px-2 py-1 text-xs font-semibold',
																	confidenceClass(substitution.confidenceScore),
																)}
															>
																{t('substitutionConfidence')}{' '}
																{Math.round(substitution.confidenceScore * 100)}
																%
															</span>
														</div>
														<AllergenSafetyIndicator safety={safety} />
														{substitution.notes && (
															<p className='mt-2 text-xs text-text-secondary'>
																{substitution.notes}
															</p>
														)}
														<CompoundExplanation
															originalIngredient={ingredientName}
															substitution={substitution}
														/>
														<button
															type='button'
															disabled={blocked || submitting}
															onClick={() =>
																void recordChoice('accept', substitution.name)
															}
															className='mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
														>
															<Check className='size-4' aria-hidden='true' />
															{t('useSubstitute')}
														</button>
													</li>
												)
											})}
										</ul>
									</div>
								) : (
									<p className='rounded-xl bg-bg-elevated p-4 text-sm text-text-muted'>
										{t('substitutionNoSuggestions')}
									</p>
								)}

								<div className='mt-5 space-y-3 border-t border-border-subtle pt-4'>
									<label className='block text-sm font-medium text-text-secondary'>
										{t('usedSomethingElse')}
										<input
											type='text'
											value={customSubstitute}
											onChange={event =>
												setCustomSubstitute(event.target.value)
											}
											placeholder={t('customSubstitutePlaceholder')}
											className='mt-1.5 w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20'
										/>
									</label>
									<button
										type='button'
										disabled={!customSubstitute.trim() || submitting}
										onClick={recordCustomReject}
										className='min-h-10 w-full rounded-xl border border-border-medium px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
									>
										{t('saveCustomSubstitute')}
									</button>
									<button
										type='button'
										disabled={submitting}
										onClick={() => void recordChoice('skip')}
										className='min-h-10 w-full rounded-xl px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
									>
										{t('cookedWithoutSubstitute')}
									</button>
								</div>
							</motion.section>
						</div>
					</Portal>
				)}
			</AnimatePresence>
		</>
	)
}
