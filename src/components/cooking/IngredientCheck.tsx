'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, TRANSITION_BOUNCY } from '@/lib/motion'

interface IngredientCheckProps {
	ingredient: { name: string; quantity: string; unit: string }
	isChecked: boolean
	onToggle: () => void
	index: number
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
	index,
}: IngredientCheckProps) => (
	<motion.label
		initial={{ opacity: 0, x: -20 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ delay: index * 0.05, ...TRANSITION_SPRING }}
		onClick={onToggle}
		className={cn(
			'flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all',
			isChecked
				? 'bg-success/10 text-success line-through opacity-60'
				: 'bg-bg-elevated hover:bg-bg-hover',
		)}
	>
		{/* Custom checkbox */}
		<motion.div
			animate={{
				backgroundColor: isChecked ? 'var(--color-success)' : 'transparent',
				borderColor: isChecked
					? 'var(--color-success)'
					: 'var(--border-medium)',
			}}
			className='grid size-6 flex-shrink-0 place-items-center rounded-lg border-2'
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

		<span className='flex-1 text-sm font-medium'>
			{ingredient.quantity} {ingredient.unit} {ingredient.name}
		</span>
	</motion.label>
)
