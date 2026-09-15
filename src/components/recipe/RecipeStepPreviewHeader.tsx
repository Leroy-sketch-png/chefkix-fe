import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Step } from '@/lib/types/recipe'

interface RecipeStepPreviewHeaderProps {
	step: Step
	stepIndex: number
}

export function RecipeStepPreviewHeader({
	step,
	stepIndex,
}: RecipeStepPreviewHeaderProps) {
	const t = useTranslations('recipeDetail')

	return (
		<div className='mb-4 flex items-center gap-4'>
			<span
				aria-hidden='true'
				className='grid size-12 flex-shrink-0 place-items-center rounded-xl bg-gradient-hero text-lg font-bold text-white shadow-card'
			>
				{stepIndex + 1}
			</span>
			<div className='min-w-0 flex-1'>
				<h3 className='text-lg font-bold text-text-primary'>{step.title}</h3>
				{step.timerSeconds && (
					<span className='flex items-center gap-1 text-sm text-streak'>
						<Clock className='size-3.5' />
						{Math.ceil(step.timerSeconds / 60)} {t('minTimer')}
					</span>
				)}
			</div>
		</div>
	)
}
