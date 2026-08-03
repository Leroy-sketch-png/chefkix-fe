'use client'

import { ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { IngredientCheck } from '@/components/cooking/IngredientCheck'
import type { Ingredient } from '@/lib/types/recipe'
import { SubstitutionButton } from './SubstitutionButton'

interface RecipeIngredientChecklistItemProps {
	ingredient: Ingredient
	isChecked: boolean
	onToggle: () => void
	buyLink?: string
	recipeTitle: string
	onBuy: () => void
}

export function RecipeIngredientChecklistItem({
	ingredient,
	isChecked,
	onToggle,
	buyLink,
	recipeTitle,
	onBuy,
}: RecipeIngredientChecklistItemProps) {
	const t = useTranslations('recipeDetail')

	return (
		<li className='group flex items-start gap-1 rounded-xl transition-colors hover:bg-bg-elevated'>
			<IngredientCheck
				ingredient={ingredient}
				isChecked={isChecked}
				onToggle={onToggle}
				className='min-w-0 flex-1 items-start bg-transparent hover:bg-transparent'
			>
				<span className='text-text-secondary'>
					<span className='font-semibold text-text-primary'>
						{ingredient.quantity} {ingredient.unit}
					</span>{' '}
					{ingredient.name}
				</span>
			</IngredientCheck>

			<div className='flex flex-shrink-0 items-center gap-1 pr-2 pt-2'>
				{buyLink && (
					<a
						href={buyLink}
						target='_blank'
						rel='noopener noreferrer'
						className='grid size-10 place-items-center rounded-lg text-text-muted opacity-70 transition-all hover:bg-brand/10 hover:text-brand md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
						title={t('buyIngredient', { name: ingredient.name })}
						aria-label={t('buyIngredient', { name: ingredient.name })}
						onClick={onBuy}
					>
						<ShoppingCart className='size-4' />
					</a>
				)}
				<SubstitutionButton
					ingredientName={ingredient.name}
					recipeTitle={recipeTitle}
					className='grid size-10 place-items-center p-0'
				/>
			</div>
		</li>
	)
}
