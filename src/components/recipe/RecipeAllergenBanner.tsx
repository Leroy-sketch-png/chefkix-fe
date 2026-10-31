'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react'
import { findRecipeAllergenConflicts } from '@/lib/allergen-safety'
import type { Ingredient } from '@/lib/types/recipe'

interface RecipeAllergenBannerProps {
	ingredients: Ingredient[]
	allergenFlags?: string[]
}
export function RecipeAllergenBanner({
	ingredients,
	allergenFlags,
}: RecipeAllergenBannerProps) {
	const conflicts = findRecipeAllergenConflicts(
		ingredients.map(ingredient => ingredient.name),
		allergenFlags,
	)
	if (conflicts.length === 0) return null

	return (
		<div
			className='mb-4 rounded-xl border border-warning/25 bg-warning/5 p-3'
			data-testid='recipe-allergen-banner'
			role='alert'
		>
			<div className='flex items-start gap-2.5'>
				<div className='grid size-8 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning'>
					<ShieldAlert className='size-4' />
				</div>
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<AlertTriangle className='size-3.5 text-warning' />
						<p className='text-sm font-semibold text-text-primary'>
							Allergen check needed
						</p>
					</div>
					<p className='mt-1 text-xs leading-relaxed text-text-secondary'>
						This recipe includes ingredients that match your saved profile.
						Review the highlighted items and verify the product label before
						cooking.
					</p>
					<ul className='mt-2 space-y-1'>
						{conflicts.map(conflict => (
							<li key={conflict.ingredient} className='text-xs text-warning'>
								<span className='font-semibold'>{conflict.ingredient}</span> ·{' '}
								{conflict.reason}
							</li>
						))}
					</ul>
					<Link
						href='/settings?tab=cooking'
						className='mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline'
					>
						Review safety profile <ArrowRight className='size-3' />
					</Link>
				</div>
			</div>
		</div>
	)
}
