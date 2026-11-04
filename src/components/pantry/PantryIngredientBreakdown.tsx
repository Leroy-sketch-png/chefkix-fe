'use client'

import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'

interface PantryIngredientBreakdownProps {
	matchedIngredients: string[]
	missingIngredients: string[]
}

export function PantryIngredientBreakdown({
	matchedIngredients,
	missingIngredients,
}: PantryIngredientBreakdownProps) {
	const t = useTranslations('pantry')
	const totalIngredients = matchedIngredients.length + missingIngredients.length

	return (
		<div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-3 pb-3 text-xs'>
			<p className='text-text-secondary'>
				{missingIngredients.length === 0
					? t('allIngredientsInPantry', { count: totalIngredients })
					: t('ingredientCoverage', {
							matched: matchedIngredients.length,
							total: totalIngredients,
						})}
			</p>
			{missingIngredients.length > 0 && (
				<details className='group min-w-0 max-w-full'>
					<summary className='inline-flex cursor-pointer list-none items-center gap-1 rounded text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'>
						{t('showMissingIngredients', {
							count: missingIngredients.length,
						})}
						<ChevronDown
							className='size-3 transition-transform group-open:rotate-180'
							aria-hidden='true'
						/>
					</summary>
					<p className='mt-1 break-words text-text-muted'>
						<span className='font-semibold text-warning'>
							{t('missingIngredientsLabel')}:{' '}
						</span>
						{missingIngredients.join(', ')}
					</p>
				</details>
			)}
		</div>
	)
}
