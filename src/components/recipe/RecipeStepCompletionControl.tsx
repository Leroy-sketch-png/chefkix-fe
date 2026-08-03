'use client'

import { motion } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { Step } from '@/lib/types/recipe'
import { cn } from '@/lib/utils'

interface RecipeStepCompletionControlProps {
	step: Step
	stepIndex: number
	isCompleted: boolean
	onToggle: () => void
}

export function RecipeStepCompletionControl({
	step,
	stepIndex,
	isCompleted,
	onToggle,
}: RecipeStepCompletionControlProps) {
	const t = useTranslations('recipeDetail')

	return (
		<label className='mb-4 flex cursor-pointer items-center gap-4 rounded-xl focus-within:ring-2 focus-within:ring-brand/50'>
			<input
				type='checkbox'
				checked={isCompleted}
				onChange={onToggle}
				className='sr-only'
				aria-label={`${step.title}: ${t('done')}`}
			/>
			<motion.span
				aria-hidden='true'
				whileHover={{ scale: 1.05 }}
				transition={TRANSITION_SPRING}
				className={cn(
					'grid size-12 flex-shrink-0 place-items-center rounded-xl text-lg font-bold text-white shadow-card transition-all duration-300',
					isCompleted ? 'bg-success shadow-success/20' : 'bg-gradient-hero',
				)}
			>
				{isCompleted ? <Check className='size-5 stroke-[3]' /> : stepIndex + 1}
			</motion.span>
			<span className='min-w-0 flex-1'>
				<span
					className={cn(
						'block text-lg font-bold text-text-primary transition-all duration-300',
						isCompleted &&
							'text-text-muted/70 line-through decoration-success/30',
					)}
				>
					{step.title}
				</span>
				{step.timerSeconds && (
					<span className='flex items-center gap-1 text-sm text-streak'>
						<Clock className='size-3.5' />
						{Math.ceil(step.timerSeconds / 60)} {t('minTimer')}
					</span>
				)}
			</span>
			{isCompleted && (
				<span className='shrink-0 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success'>
					{t('done')}
				</span>
			)}
		</label>
	)
}
