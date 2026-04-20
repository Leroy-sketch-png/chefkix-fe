'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
	label: string
	description?: string
}

interface StepIndicatorProps {
	steps: Step[]
	/** Zero-based index of the current step */
	currentStep: number
	variant?: 'horizontal' | 'vertical'
	className?: string
}

/**
 * Multi-step progress indicator for wizards and workflows.
 * Supports horizontal (default) and vertical layouts.
 */
export function StepIndicator({
	steps,
	currentStep,
	variant = 'horizontal',
	className,
}: StepIndicatorProps) {
	if (variant === 'vertical') {
		return (
			<div className={cn('space-y-0', className)}>
				{steps.map((step, i) => {
					const isComplete = i < currentStep
					const isCurrent = i === currentStep

					return (
						<div key={step.label} className='flex gap-4'>
							<div className='flex flex-col items-center'>
								<div
									className={cn(
										'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
										isComplete && 'border-brand bg-brand text-white',
										isCurrent && 'border-brand text-brand',
										!isComplete &&
											!isCurrent &&
											'border-border-subtle text-text-muted',
									)}
								>
									{isComplete ? <Check className='size-4' /> : i + 1}
								</div>
								{i < steps.length - 1 && (
									<div
										className={cn(
											'h-8 w-0.5',
											i < currentStep ? 'bg-brand' : 'bg-border-subtle',
										)}
									/>
								)}
							</div>

							<div className='pb-8'>
								<p
									className={cn(
										'text-sm font-medium',
										isCurrent && 'text-brand',
										!isComplete && !isCurrent && 'text-text-muted',
									)}
								>
									{step.label}
								</p>
								{step.description && (
									<p className='mt-0.5 text-xs text-text-secondary'>
										{step.description}
									</p>
								)}
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	return (
		<div className={cn('flex items-center', className)}>
			{steps.map((step, i) => {
				const isComplete = i < currentStep
				const isCurrent = i === currentStep

				return (
					<div key={step.label} className='flex flex-1 items-center'>
						<div className='flex flex-col items-center gap-1.5'>
							<div
								className={cn(
									'flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
									isComplete && 'border-brand bg-brand text-white',
									isCurrent && 'border-brand text-brand',
									!isComplete &&
										!isCurrent &&
										'border-border-subtle text-text-muted',
								)}
							>
								{isComplete ? <Check className='size-4' /> : i + 1}
							</div>
							<span
								className={cn(
									'text-xs font-medium',
									isCurrent && 'text-brand',
									!isComplete && !isCurrent && 'text-text-muted',
								)}
							>
								{step.label}
							</span>
						</div>

						{i < steps.length - 1 && (
							<div
								className={cn(
									'mx-2 h-0.5 flex-1',
									i < currentStep ? 'bg-brand' : 'bg-border-subtle',
								)}
							/>
						)}
					</div>
				)
			})}
		</div>
	)
}
