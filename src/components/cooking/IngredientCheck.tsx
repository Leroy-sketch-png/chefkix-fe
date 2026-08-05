'use client'

import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_BOUNCY } from '@/lib/motion'

interface IngredientCheckProps {
	ingredient: { name: string; quantity: string; unit: string }
	isChecked: boolean
	onToggle: () => void
	children?: ReactNode
	className?: string
}

/**
 * Animated ingredient checkbox used in both CookingPlayer (fullscreen)
 * and CookingPanel (docked) to ensure feature parity across cooking modes.
 *
 * State is managed by cookingStore (persisted to localStorage via partialize).
 * Key format: "${stepNumber}-${ingredientIndex}" (NOT by name, to avoid
 * collision when same ingredient appears twice on a step).
 */
export const IngredientCheck = ({
	ingredient,
	isChecked,
	onToggle,
	children,
	className,
}: IngredientCheckProps) => (
	<label
		className={cn(
			'flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all',
			isChecked
				? 'bg-success/10 text-success line-through opacity-60'
				: 'bg-bg-elevated hover:bg-bg-hover',
			className,
		)}
	>
		{/* Semantic checkbox for screen readers */}
		<input
			type='checkbox'
			checked={isChecked}
			onChange={onToggle}
			className='sr-only'
			aria-label={`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}
		/>
		{/* Custom checkbox visual */}
		<motion.div
			aria-hidden='true'
			className={cn(
				'grid size-6 flex-shrink-0 place-items-center rounded-xl border-2 transition-colors',
				isChecked
					? 'border-success bg-success'
					: 'border-border-medium bg-transparent',
			)}
		>
			<AnimatePresence>
				{isChecked && (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={TRANSITION_BOUNCY}
					>
						<Check className='size-4 text-white' />
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>

		<span className='min-w-0 flex-1 text-sm font-medium'>
			{children ??
				`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}
		</span>
	</label>
)
