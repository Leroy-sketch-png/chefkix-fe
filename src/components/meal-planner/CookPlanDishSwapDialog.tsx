'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
	AsyncCombobox,
	type AsyncComboboxOption,
} from '@/components/ui/async-combobox'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { getUserFriendlyMessage } from '@/lib/error-utils'
import type { CookPlanDish } from '@/lib/types/cookplan'
import type { RecipeSearchDoc } from '@/lib/types/search'
import { autocompleteSearch } from '@/services/search'

interface CookPlanDishSwapDialogProps {
	dish: CookPlanDish
	excludedRecipeIds: string[]
	disabled?: boolean
	onSwap: (replacementRecipeId: string) => Promise<void>
}

export function CookPlanDishSwapDialog({
	dish,
	excludedRecipeIds,
	disabled = false,
	onSwap,
}: CookPlanDishSwapDialogProps) {
	const t = useTranslations('mealPlanner')
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [selected, setSelected] = useState<AsyncComboboxOption | null>(null)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const submissionInFlightRef = useRef(false)
	const excluded = useMemo(
		() => new Set(excludedRecipeIds),
		[excludedRecipeIds],
	)

	const reset = useCallback(() => {
		setQuery('')
		setSelected(null)
		setError(null)
	}, [])

	const handleOpenChange = (nextOpen: boolean) => {
		if (submitting) return
		setOpen(nextOpen)
		if (!nextOpen) reset()
	}

	const fetchRecipeOptions = useCallback(
		async (search: string): Promise<AsyncComboboxOption[]> => {
			const response = await autocompleteSearch(search.trim(), 'recipes', 8)
			if (!response.success) throw new Error('Recipe search unavailable')

			return (response.data?.recipes?.hits ?? [])
				.map(hit => hit.document as RecipeSearchDoc)
				.filter(
					recipe =>
						Boolean(recipe.id && recipe.title) && !excluded.has(recipe.id),
				)
				.slice(0, 6)
				.map(recipe => ({
					value: recipe.id,
					label: recipe.title,
					secondary:
						recipe.cuisine ||
						(recipe.totalTime
							? t('totalMinutes', { count: recipe.totalTime })
							: undefined),
				}))
		},
		[excluded, t],
	)

	const confirmSwap = async () => {
		if (!selected || submissionInFlightRef.current) return
		submissionInFlightRef.current = true
		setSubmitting(true)
		setError(null)

		try {
			await onSwap(selected.value)
			setOpen(false)
			reset()
		} catch (swapError) {
			setError(getUserFriendlyMessage(swapError))
		} finally {
			submissionInFlightRef.current = false
			setSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant='outline' size='sm' disabled={disabled}>
					<RefreshCw />
					{t('replaceDish')}
				</Button>
			</DialogTrigger>
			<DialogContent className='max-h-[min(42rem,calc(100vh-2rem))] overflow-y-auto sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>
						{t('replaceDishTitle', { title: dish.title })}
					</DialogTitle>
					<DialogDescription>{t('replaceDishDesc')}</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					<AsyncCombobox
						value={query}
						onChange={value => {
							setQuery(value)
							setSelected(null)
							setError(null)
						}}
						onSelect={option => {
							setSelected(option)
							setError(null)
						}}
						fetchOptions={fetchRecipeOptions}
						disabled={submitting}
						minChars={2}
						maxResults={6}
						placeholder={t('searchReplacement')}
						emptyMessage={t('noReplacementRecipes')}
						searchingMessage={t('searchingRecipes')}
						errorMessage={t('recipeSearchUnavailable')}
						icon={<Search className='size-4' aria-hidden='true' />}
					/>

					{selected ? (
						<div className='border-l-4 border-brand bg-brand/5 px-4 py-3'>
							<p className='text-xs font-semibold uppercase text-brand'>
								{t('selectedReplacement')}
							</p>
							<p className='mt-1 font-semibold text-text-primary'>
								{selected.label}
							</p>
							{selected.secondary ? (
								<p className='mt-0.5 text-sm text-text-secondary'>
									{selected.secondary}
								</p>
							) : null}
						</div>
					) : null}

					<p className='text-xs leading-5 text-text-muted'>
						{t('swapConstraintsNote')}
					</p>

					{error ? (
						<div
							role='alert'
							className='border-l-4 border-danger bg-danger/5 px-4 py-3 text-sm text-text-primary'
						>
							{error}
						</div>
					) : null}
				</div>

				<DialogFooter className='gap-2 sm:space-x-0'>
					<Button
						type='button'
						variant='outline'
						disabled={submitting}
						onClick={() => handleOpenChange(false)}
					>
						{t('cancel')}
					</Button>
					<Button
						type='button'
						disabled={!selected || submitting}
						onClick={confirmSwap}
					>
						{submitting ? <Loader2 className='animate-spin' /> : <RefreshCw />}
						{submitting ? t('replacingDish') : t('confirmReplacement')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
