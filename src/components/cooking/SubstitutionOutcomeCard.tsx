'use client'

import { ThumbsDown, ThumbsUp, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { SubstitutionTasteFeedback } from '@/services/cookingSession'

interface SubstitutionOutcomeCardProps {
	value?: SubstitutionTasteFeedback
	onChange: (value: SubstitutionTasteFeedback) => void
}

const OUTCOMES = [
	{ value: 'up' as const, icon: ThumbsUp, labelKey: 'substitutionOutcomeUp' },
	{
		value: 'neutral' as const,
		icon: Minus,
		labelKey: 'substitutionOutcomeNeutral',
	},
	{
		value: 'down' as const,
		icon: ThumbsDown,
		labelKey: 'substitutionOutcomeDown',
	},
]

/** Captures the post-session outcome of a substitution without changing dish rating. */
export function SubstitutionOutcomeCard({
	value,
	onChange,
}: SubstitutionOutcomeCardProps) {
	const t = useTranslations('cooking')

	return (
		<section
			className='rounded-2xl border border-brand/20 bg-brand/5 p-4'
			aria-labelledby='substitution-outcome-title'
		>
			<h3
				id='substitution-outcome-title'
				className='mb-3 text-center text-sm font-semibold text-text-primary'
			>
				{t('substitutionOutcomeTitle')}
			</h3>
			<div
				className='grid grid-cols-3 gap-2'
				role='radiogroup'
				aria-label={t('substitutionOutcomeTitle')}
			>
				{OUTCOMES.map(({ value: outcome, icon: Icon, labelKey }) => {
					const selected = value === outcome
					return (
						<button
							type='button'
							key={outcome}
							role='radio'
							aria-checked={selected}
							onClick={() => onChange(outcome)}
							className={cn(
								'flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
								selected
									? 'border-brand bg-brand text-white'
									: 'border-border-subtle bg-bg-card text-text-secondary hover:border-brand/40 hover:text-text-primary',
							)}
						>
							<Icon className='size-5' aria-hidden='true' />
							{t(labelKey)}
						</button>
					)
				})}
			</div>
		</section>
	)
}
