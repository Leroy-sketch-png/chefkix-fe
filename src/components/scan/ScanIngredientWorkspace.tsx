'use client'

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type FormEvent,
} from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
	MAX_SCAN_INGREDIENTS,
	useScanIngredientDraftStore,
} from '@/store/scanIngredientDraftStore'
import { IngredientScanner } from './IngredientScanner'
import { PhotoIntelligencePanel } from './PhotoIntelligencePanel'

/** Connects confirmed or manually entered ingredients to recipe search and matching. */
export function ScanIngredientWorkspace() {
	const [manualDraft, setManualDraft] = useState('')
	const ownerId = useAuthStore(state => state.user?.userId ?? null)
	const setOwnerId = useScanIngredientDraftStore(state => state.setOwnerId)
	const setConfirmedScanIngredients = useScanIngredientDraftStore(
		state => state.setConfirmedScanIngredients,
	)
	const addManual = useScanIngredientDraftStore(
		state => state.addManualIngredient,
	)
	const removeConfirmedScanIngredient = useScanIngredientDraftStore(
		state => state.removeConfirmedScanIngredient,
	)
	const removeManual = useScanIngredientDraftStore(
		state => state.removeManualIngredient,
	)
	const clearSelection = useScanIngredientDraftStore(
		state => state.clearSelection,
	)
	const scannedIngredients = useScanIngredientDraftStore(state =>
		state.ownerId === ownerId
			? state.confirmedScanIngredients
			: EMPTY_INGREDIENTS,
	)
	const manualIngredients = useScanIngredientDraftStore(state =>
		state.ownerId === ownerId ? state.manualIngredients : EMPTY_INGREDIENTS,
	)
	const t = useTranslations('cooking')
	useEffect(() => setOwnerId(ownerId), [ownerId, setOwnerId])
	const handleConfirmedIngredientsChange = useCallback(
		(ingredients: string[]) =>
			setConfirmedScanIngredients(ownerId, ingredients),
		[ownerId, setConfirmedScanIngredients],
	)
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
		if (addManual(ownerId, ingredient)) setManualDraft('')
	}

	return (
		<>
			<IngredientScanner
				key={ownerId ?? 'guest'}
				confirmedIngredients={scannedIngredients}
				disableAdditionalConfirmations={
					ingredients.length >= MAX_SCAN_INGREDIENTS
				}
				onConfirmedIngredientsChange={handleConfirmedIngredientsChange}
			/>
			{scannedIngredients.length > 0 && (
				<div className='mt-4'>
					<p className='mb-2 text-sm font-semibold text-text-secondary'>
						{t('scanConfirmedIngredientList')}
					</p>
					<ul
						className='flex flex-wrap gap-2'
						aria-label={t('scanConfirmedIngredientList')}
					>
						{scannedIngredients.map(ingredient => (
							<li
								key={ingredient.toLowerCase()}
								className='inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-1 text-sm text-text-primary'
							>
								<span className='min-w-0 [overflow-wrap:anywhere]'>
									{ingredient}
								</span>
								<button
									type='button'
									aria-label={t('scanRemoveIngredient', { ingredient })}
									onClick={() =>
										removeConfirmedScanIngredient(ownerId, ingredient)
									}
									className='shrink-0 font-bold text-text-muted hover:text-text-primary'
								>
									×
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
			<section className='mt-4 rounded-2xl border border-border-subtle bg-bg-elevated p-4'>
				<label
					htmlFor='manual-ingredient'
					className='text-sm font-semibold text-text-primary'
				>
					{t('scanManualIngredientLabel')}
				</label>
				<form
					onSubmit={addManualIngredient}
					className='mt-2 flex min-w-0 gap-2'
				>
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
						disabled={
							!manualDraft.trim() || ingredients.length >= MAX_SCAN_INGREDIENTS
						}
						className='min-h-11 shrink-0 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'
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
								className='inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-1 text-sm text-text-primary'
							>
								<span className='min-w-0 [overflow-wrap:anywhere]'>
									{ingredient}
								</span>
								<button
									type='button'
									aria-label={t('scanRemoveIngredient', { ingredient })}
									onClick={() => removeManual(ownerId, ingredient)}
									className='shrink-0 font-bold text-text-muted hover:text-text-primary'
								>
									×
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
			{ingredients.length > 0 && (
				<div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
					<p className='text-xs text-text-muted'>
						{t('scanIngredientSelectionLimit', {
							count: ingredients.length,
							max: MAX_SCAN_INGREDIENTS,
						})}
					</p>
					<button
						type='button'
						className='min-h-10 rounded-lg px-2 text-sm font-medium text-text-secondary underline underline-offset-2'
						onClick={() => clearSelection(ownerId)}
					>
						{t('scanClearIngredients')}
					</button>
				</div>
			)}
			{ingredients.length > 0 && (
				<Link
					href='#ingredient-match-results'
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

const EMPTY_INGREDIENTS: string[] = []
