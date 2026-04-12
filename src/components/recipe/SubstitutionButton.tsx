'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'
import { ArrowLeftRight, Loader2, X } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
	suggestSubstitutions,
	type Substitution,
	type SubstitutionReason,
} from '@/services/ai'

interface SubstitutionButtonProps {
	ingredientName: string
	recipeTitle?: string
}

export function SubstitutionButton({
	ingredientName,
	recipeTitle,
}: SubstitutionButtonProps) {
	const t = useTranslations('recipe')
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [substitutions, setSubstitutions] = useState<Substitution[] | null>(
		null,
	)
	const [reason, setReason] = useState<SubstitutionReason>('unavailable')
	const [error, setError] = useState<string | null>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const [pos, setPos] = useState({ top: 0, left: 0 })

	const REASON_LABEL_KEYS: Record<SubstitutionReason, string> = {
		unavailable: 'reasonUnavailable',
		allergy: 'reasonAllergy',
		dietary: 'reasonDietary',
		preference: 'reasonPreference',
	}

	useEscapeKey(open, () => setOpen(false))

	useEffect(() => {
		if (open && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			setPos({
				top: rect.bottom + 8,
				left: Math.min(rect.left, window.innerWidth - 320),
			})
		}
	}, [open])

	const handleFetch = async (r: SubstitutionReason) => {
		setReason(r)
		setLoading(true)
		setError(null)
		try {
			const res = await suggestSubstitutions(
				ingredientName,
				r,
				recipeTitle ? `Recipe: ${recipeTitle}` : undefined,
			)
			if (res.success && res.data) {
				setSubstitutions(res.data.substitutions)
			} else {
				setError(res.message || t('failedToGetSuggestions'))
			}
		} catch {
			setError(t('failedToGetSuggestions'))
		} finally {
			setLoading(false)
		}
	}

	const handleOpen = () => {
		setOpen(true)
		setSubstitutions(null)
		setError(null)
		handleFetch('unavailable')
	}

	return (
		<>
			<button
				type='button'
				ref={buttonRef}
				onClick={handleOpen}
				className='rounded-md p-1 text-text-muted opacity-70 transition-all hover:bg-brand/10 hover:text-brand md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
				title={t('findSubstituteFor', { ingredient: ingredientName })}
				aria-label={t('findSubstituteFor', { ingredient: ingredientName })}
			>
				<ArrowLeftRight className='size-3.5' />
			</button>

			<AnimatePresence>
				{open && (
					<Portal>
						<div
							className='fixed inset-0 z-dropdown'
							onMouseDown={() => setOpen(false)}
						>
							<motion.div
								initial={{ opacity: 0, y: -4, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -4, scale: 0.96 }}
								transition={{ duration: DURATION_S.fast }}
								className='fixed w-72 rounded-xl border border-border-subtle bg-bg-card p-4 shadow-warm'
								style={{ top: pos.top, left: pos.left }}
								role='dialog'
								aria-label={t('findSubstituteFor', {
									ingredient: ingredientName,
								})}
								onMouseDown={e => e.stopPropagation()}
							>
								{/* Header */}
								<div className='mb-3 flex items-center justify-between'>
									<h4 className='text-sm font-semibold text-text'>
										{t('swapIngredient', { ingredient: ingredientName })}
									</h4>
									<button
										type='button'
										onClick={() => setOpen(false)}
										aria-label={t('subClose')}
										className='rounded-md p-1 text-text-muted hover:bg-bg-elevated'
									>
										<X className='size-3.5' />
									</button>
								</div>

								{/* Reason Tabs */}
								<div className='mb-3 flex gap-1'>
									{(
										['unavailable', 'allergy', 'dietary', 'preference'] as const
									).map(r => (
										<button
											type='button'
											key={r}
											onClick={() => handleFetch(r)}
											disabled={loading}
											className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors disabled:opacity-50 ${
												reason === r
													? 'bg-brand/15 text-brand'
													: 'bg-bg-elevated text-text-muted hover:text-text-secondary'
											}`}
										>
											{t(REASON_LABEL_KEYS[r])}
										</button>
									))}
								</div>

								{/* Content */}
								{loading ? (
									<div className='flex items-center justify-center py-6'>
										<Loader2 className='size-5 animate-spin text-brand' />
									</div>
								) : error ? (
									<p className='py-4 text-center text-xs text-text-muted'>
										{error}
									</p>
								) : substitutions && substitutions.length > 0 ? (
									<ul className='max-h-64 space-y-2 overflow-y-auto'>
										{substitutions.map(sub => (
											<li
												key={sub.name}
												className='rounded-lg bg-bg-elevated p-2.5'
											>
												<div className='flex items-center justify-between'>
													<span className='text-sm font-medium text-text'>
														{sub.name}
													</span>
													<span
														className={`rounded-full px-1.5 py-0.5 text-2xs font-semibold ${
															sub.confidenceScore >= 0.8
																? 'bg-success/15 text-success'
																: sub.confidenceScore >= 0.5
																	? 'bg-warning/15 text-warning'
																	: 'bg-destructive/15 text-destructive'
														}`}
													>
														{Math.round(sub.confidenceScore * 100)}%
													</span>
												</div>
												<p className='mt-0.5 text-xs text-brand/80'>
													{sub.ratio}
												</p>
												{sub.notes && (
													<p className='mt-0.5 text-xs text-text-muted'>
														{sub.notes}
													</p>
												)}
											</li>
										))}
									</ul>
								) : (
									<p className='py-4 text-center text-xs text-text-muted'>
										{t('noSubstitutionsFound')}
									</p>
								)}
							</motion.div>
						</div>
					</Portal>
				)}
			</AnimatePresence>
		</>
	)
}
