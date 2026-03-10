'use client'

import { X } from 'lucide-react'
import type { Ingredient } from '@/lib/types/recipeCreate'

// ── Props ───────────────────────────────────────────────────────────
interface IngredientItemProps {
	ingredient: Ingredient
	onRemove: () => void
	onUpdate: (updates: Partial<Ingredient>) => void
}

/**
 * A single editable ingredient row: quantity + name + delete.
 */
export const IngredientItem = ({
	ingredient,
	onRemove,
	onUpdate,
}: IngredientItemProps) => (
	<div className='group flex items-center gap-3 rounded-xl bg-bg px-4 py-3'>
		<input
			type='text'
			value={ingredient.quantity}
			onChange={e => onUpdate({ quantity: e.target.value })}
			placeholder='Qty'
			className='min-w-24 w-auto max-w-40 bg-transparent text-sm font-bold text-primary outline-none placeholder:text-muted-foreground/50'
		/>
		<input
			type='text'
			value={ingredient.name}
			onChange={e => onUpdate({ name: e.target.value })}
			placeholder='Ingredient name'
			className='flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted-foreground/50'
		/>
		<button
			onClick={onRemove}
			aria-label='Remove ingredient'
			className='flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500'
		>
			<X className='size-4' />
		</button>
	</div>
)
