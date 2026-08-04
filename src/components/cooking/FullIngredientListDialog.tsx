'use client'

import { ListChecks } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import type { Ingredient } from '@/lib/types/recipe'

interface FullIngredientListDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	ingredients: Ingredient[]
	recipeTitle: string
}

export function FullIngredientListDialog({
	open,
	onOpenChange,
	ingredients,
	recipeTitle,
}: FullIngredientListDialogProps) {
	const t = useTranslations('cooking')

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[min(42rem,calc(100vh-2rem))] overflow-hidden bg-bg-card p-0 sm:max-w-lg'>
				<DialogHeader className='border-b border-border-subtle px-6 py-5 pr-16 text-left'>
					<div className='flex items-center gap-3'>
						<div className='grid size-11 shrink-0 place-items-center rounded-lg border border-brand/20 bg-brand/10 text-brand'>
							<ListChecks className='size-5' />
						</div>
						<div className='min-w-0'>
							<DialogTitle className='text-xl font-bold text-text-primary'>
								{t('allIngredients')}
							</DialogTitle>
							<DialogDescription className='mt-1'>
								{t('allIngredientsFor', {
									count: ingredients.length,
									recipe: recipeTitle,
								})}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className='overflow-y-auto px-6 pb-6'>
					<ul className='divide-y divide-border-subtle' role='list'>
						{ingredients.map((ingredient, index) => {
							const amount = [ingredient.quantity, ingredient.unit]
								.map(value => value?.trim())
								.filter(Boolean)
								.join(' ')

							return (
								<li
									key={`${ingredient.name}-${index}`}
									className='flex min-h-14 items-center justify-between gap-4 py-3'
								>
									<span className='min-w-0 font-medium text-text-primary'>
										{ingredient.name}
									</span>
									<span className='shrink-0 text-right text-sm font-semibold tabular-nums text-text-secondary'>
										{amount || t('quantityAsNeeded')}
									</span>
								</li>
							)
						})}
					</ul>
				</div>
			</DialogContent>
		</Dialog>
	)
}
