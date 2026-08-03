'use client'

import { useCallback, useState } from 'react'
import { Link2, Search, X } from 'lucide-react'
import { useTranslations } from '@/i18n/hooks'
import {
	AsyncCombobox,
	type AsyncComboboxOption,
} from '@/components/ui/async-combobox'
import { autocompleteSearch } from '@/services/search'
import type { RecipeSearchDoc } from '@/lib/types/search'

interface StoryRecipePickerProps {
	selectedRecipe: AsyncComboboxOption | null
	onChange: (recipe: AsyncComboboxOption | null) => void
}

export function StoryRecipePicker({
	selectedRecipe,
	onChange,
}: StoryRecipePickerProps) {
	const t = useTranslations('story')
	const [query, setQuery] = useState('')

	const fetchRecipeOptions = useCallback(
		async (search: string): Promise<AsyncComboboxOption[]> => {
			const response = await autocompleteSearch(search.trim(), 'recipes', 6)
			if (!response.success) throw new Error('Recipe search unavailable')

			return (response.data?.recipes?.hits ?? [])
				.map(hit => hit.document as RecipeSearchDoc)
				.filter(recipe => Boolean(recipe.id && recipe.title))
				.map(recipe => ({
					value: recipe.id,
					label: recipe.title,
					secondary: recipe.cuisine || recipe.description || undefined,
					category: recipe.difficulty || undefined,
				}))
		},
		[],
	)

	return (
		<div className='space-y-2'>
			<div>
				<p className='text-sm font-semibold text-text-primary'>
					{t('linkRecipeLabel')}
				</p>
				<p className='text-xs leading-5 text-text-secondary'>
					{t('linkRecipeDescription')}
				</p>
			</div>

			{selectedRecipe ? (
				<div className='flex min-w-0 items-center gap-3 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2.5'>
					<Link2 className='size-4 shrink-0 text-brand' aria-hidden='true' />
					<div className='min-w-0 flex-1'>
						<p className='truncate text-sm font-semibold text-text-primary'>
							{selectedRecipe.label}
						</p>
						{selectedRecipe.secondary ? (
							<p className='truncate text-xs text-text-secondary'>
								{selectedRecipe.secondary}
							</p>
						) : null}
					</div>
					<button
						type='button'
						onClick={() => onChange(null)}
						className='inline-flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
						aria-label={t('removeLinkedRecipe')}
						title={t('removeLinkedRecipe')}
					>
						<X className='size-4' aria-hidden='true' />
					</button>
				</div>
			) : (
				<AsyncCombobox
					value={query}
					onChange={setQuery}
					onSelect={option => {
						onChange(option)
						setQuery('')
					}}
					fetchOptions={fetchRecipeOptions}
					minChars={2}
					maxResults={6}
					placeholder={t('linkRecipePlaceholder')}
					emptyMessage={t('linkRecipeEmpty')}
					searchingMessage={t('linkRecipeSearching')}
					errorMessage={t('linkRecipeSearchError')}
					icon={<Search className='size-4' aria-hidden='true' />}
				/>
			)}
		</div>
	)
}
