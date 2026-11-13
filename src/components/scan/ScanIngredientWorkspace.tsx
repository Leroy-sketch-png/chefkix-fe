'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { PATHS } from '@/constants'
import { IngredientScanner } from './IngredientScanner'
import { PhotoIntelligencePanel } from './PhotoIntelligencePanel'

/** Connects confirmed or manually entered ingredients to recipe search and matching. */
export function ScanIngredientWorkspace() {
	const [scannedIngredients, setScannedIngredients] = useState<string[]>([])
	const [manualDraft, setManualDraft] = useState('')
	const [manualIngredients, setManualIngredients] = useState<string[]>([])
	const t = useTranslations('cooking')
	const ingredients = useMemo(() => {
		const unique = new Map<string, string>()
		for (const ingredient of [...scannedIngredients, ...manualIngredients]) {
			const normalized = ingredient.trim()
			if (normalized && !unique.has(normalized.toLowerCase())) {
				unique.set(normalized.toLowerCase(), normalized)
			}
		}
		return [...unique.values()]
	}, [scannedIngredients, manualIngredients])
	const inputSource =
		scannedIngredients.length > 0 && manualIngredients.length > 0
			? 'mixed'
			: scannedIngredients.length > 0
				? 'scan'
				: 'manual'

	const addManualIngredient = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const ingredient = manualDraft.trim().replace(/\s+/g, ' ')
		if (!ingredient) return
		setManualIngredients(current =>
			current.some(item => item.toLowerCase() === ingredient.toLowerCase())
				? current
				: [...current, ingredient],
		)
		setManualDraft('')
	}

	return (
		<>
			<IngredientScanner onConfirmedIngredientsChange={setScannedIngredients} />
			<section className='mt-4 rounded-2xl border border-border-subtle bg-bg-elevated p-4'>
				<label
					htmlFor='manual-ingredient'
					className='text-sm font-semibold text-text-primary'
				>
					{t('scanManualIngredientLabel')}
				</label>
				<form onSubmit={addManualIngredient} className='mt-2 flex gap-2'>
					<input
						id='manual-ingredient'
						value={manualDraft}
						onChange={event => setManualDraft(event.target.value)}
						maxLength={120}
						placeholder={t('scanManualIngredientPlaceholder')}
						className='min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
					/>
					<button
						type='submit'
						disabled={!manualDraft.trim()}
						className='min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'
					>
						{t('scanAddIngredient')}
					</button>
				</form>
				{manualIngredients.length > 0 && (
					<ul
						className='mt-3 flex flex-wrap gap-2'
						aria-label={t('scanManualIngredientList')}
					>
						{manualIngredients.map(ingredient => (
							<li
								key={ingredient.toLowerCase()}
								className='inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-1 text-sm text-text-primary'
							>
								{ingredient}
								<button
									type='button'
									aria-label={t('scanRemoveIngredient', { ingredient })}
									onClick={() =>
										setManualIngredients(current =>
											current.filter(item => item !== ingredient),
										)
									}
									className='font-bold text-text-muted hover:text-text-primary'
								>
									×
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
			{ingredients.length > 0 && (
				<Link
					href={`${PATHS.SEARCH}?q=${encodeURIComponent(ingredients.join(' '))}`}
					className='mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					<Search className='size-4' />
					{t('scanSearchRecipesWithIngredients')}
				</Link>
			)}
			<PhotoIntelligencePanel
				ingredients={ingredients}
				inputSource={inputSource}
			/>
		</>
	)
}
