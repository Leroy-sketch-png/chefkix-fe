'use client'

import { X } from 'lucide-react'
import type { Ingredient } from '@/lib/types/recipeCreate'
import { useTranslations } from 'next-intl'
import {
	AsyncCombobox,
	type AsyncComboboxOption,
} from '@/components/ui/async-combobox'
import { autocompleteSearch } from '@/services/search'

// ── Typesense-backed ingredient autocomplete ────────────────────────
const fetchIngredientOptions = async (
	query: string,
): Promise<AsyncComboboxOption[]> => {
	const res = await autocompleteSearch(query, 'ingredients', 8)
	if (res.success && res.data?.ingredients?.hits) {
		return res.data.ingredients.hits.map(h => ({
			value: h.document.id,
			label: h.document.name,
			category: h.document.category,
		}))
	}
	return []
}

// ── Props ───────────────────────────────────────────────────────────
interface IngredientItemProps {
	ingredient: Ingredient
	onRemove: () => void
	onUpdate: (updates: Partial<Ingredient>) => void
}

/**
 * A single editable ingredient row: quantity + name (with Typesense autocomplete) + delete.
 */
export const IngredientItem = ({
	ingredient,
	onRemove,
	onUpdate,
}: IngredientItemProps) => {
	const t = useTranslations('recipe')
	return (
		<div className='group flex items-center gap-3 rounded-xl bg-bg px-4 py-3'>
			<input
				type='text'
				value={ingredient.quantity}
				onChange={e => onUpdate({ quantity: e.target.value })}
				placeholder={t('qtyPlaceholder')}
				className='min-w-24 w-auto max-w-40 bg-transparent text-sm font-bold text-brand outline-none placeholder:text-text-secondary/50 focus-visible:ring-2 focus-visible:ring-brand/50 rounded-md'
			/>
			<AsyncCombobox
				value={ingredient.name}
				onChange={val => onUpdate({ name: val })}
				onSelect={opt => onUpdate({ name: opt.label })}
				fetchOptions={fetchIngredientOptions}
				placeholder={t('ingredientNamePlaceholder')}
				minChars={1}
				className='flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-secondary/50 focus-visible:ring-2 focus-visible:ring-brand/50 rounded-md'
			/>
			<button
				type='button'
				onClick={onRemove}
				aria-label={t('removeIngredient')}
				className='flex size-7 items-center justify-center rounded-lg text-text-secondary md:opacity-0 transition-all md:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/50 hover:bg-error/10 hover:text-error'
			>
				<X className='size-4' />
			</button>
		</div>
	)
}
