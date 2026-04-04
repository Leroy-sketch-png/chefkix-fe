'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Lightbulb,
	AlertTriangle,
	Target,
	ListChecks,
	ChefHat,
	Timer,
	Eye,
	ChevronDown,
	ChevronUp,
	Wrench,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, TRANSITION_SMOOTH } from '@/lib/motion'
import type { Step, Ingredient } from '@/lib/types/recipe'

/**
 * StepV2Renderer — Goal-oriented step display with 3 rendering modes
 *
 * Modes:
 * - "full" (default): All V2 fields visible with collapsible sections
 * - "quick": Action line + timer only, single-line per step
 * - "kitchen": Action in 28px+ text, timer in 48px+ text (arm's length readable)
 *
 * V2 fields rendered (when available):
 * - goal: What this step achieves (shown prominently)
 * - microSteps: Atomic action breakdown
 * - visualCues: What it should look like when done
 * - commonMistake: Warning about what to avoid
 * - chefTip: Pro tip from the chef
 * - techniqueExplanation: Deep dive into the technique
 * - equipmentNeeded: Tools required for this step
 * - estimatedHandsOnTime: How long this actually takes
 *
 * Backwards compatible: Gracefully falls back to V1 rendering when V2 fields missing
 */

export type StepRenderMode = 'full' | 'quick' | 'kitchen'

interface StepV2RendererProps {
	step: Step
	mode: StepRenderMode
	totalSteps: number
	timerComponent?: React.ReactNode // External timer component to render
	ingredientChecklistComponent?: React.ReactNode // External ingredient checklist
	className?: string
}

// Collapsible section wrapper
const CollapsibleSection = ({
	title,
	icon: Icon,
	children,
	defaultOpen = false,
	variant = 'default',
}: {
	title: string
	icon: typeof Lightbulb
	children: React.ReactNode
	defaultOpen?: boolean
	variant?: 'default' | 'warning' | 'tip'
}) => {
	const [isOpen, setIsOpen] = useState(defaultOpen)

	const variantStyles = {
		default: 'border-border-subtle bg-bg-card',
		warning: 'border-warning/30 bg-warning/10',
		tip: 'border-success/30 bg-success/5',
	}

	const iconColors = {
		default: 'text-text-muted',
		warning: 'text-warning',
		tip: 'text-success',
	}

	return (
		<div
			className={cn(
				'overflow-hidden rounded-xl border transition-all',
				variantStyles[variant],
			)}
		>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='flex w-full items-center justify-between p-3 text-left'
			>
				<div className='flex items-center gap-2'>
					<Icon className={cn('size-4', iconColors[variant])} />
					<span className='text-sm font-medium text-text'>{title}</span>
				</div>
				{isOpen ? (
					<ChevronUp className='size-4 text-text-muted' />
				) : (
					<ChevronDown className='size-4 text-text-muted' />
				)}
			</button>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={TRANSITION_SMOOTH}
						className='overflow-hidden'
					>
						<div className='border-t border-border-subtle p-3'>
							{children}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

// Check if step has V2 enriched fields
function hasV2Fields(step: Step): boolean {
	return !!(
		step.goal ||
		step.microSteps?.length ||
		step.visualCues ||
		step.commonMistake ||
		step.chefTip ||
		step.techniqueExplanation ||
		step.equipmentNeeded?.length ||
		step.estimatedHandsOnTime
	)
}

// Full mode renderer - all fields with collapsible sections
const FullModeRenderer = ({
	step,
	timerComponent,
	ingredientChecklistComponent,
}: {
	step: Step
	timerComponent?: React.ReactNode
	ingredientChecklistComponent?: React.ReactNode
}) => {
	const hasEnrichments = hasV2Fields(step)

	return (
		<div className='space-y-4'>
			{/* Step Video (priority) or Image */}
			{step.videoUrl ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.1 }}
					className='relative mx-auto mb-4 aspect-video w-full max-w-2xl overflow-hidden rounded-2xl shadow-lg'
				>
					<video
						src={step.videoUrl}
						poster={step.videoThumbnailUrl || undefined}
						controls
						loop
						muted
						playsInline
						className='h-full w-full object-cover'
					/>
				</motion.div>
			) : step.imageUrl ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.1 }}
					className='relative mx-auto mb-4 aspect-video w-full max-w-2xl overflow-hidden rounded-2xl shadow-lg'
				>
					<Image
						src={step.imageUrl}
						alt={step.title ?? `Step ${step.stepNumber}`}
						fill
						className='object-cover'
					/>
				</motion.div>
			) : null}

			{/* Step Title */}
			<motion.h3
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15 }}
				className='text-center text-xl font-bold text-text md:text-2xl'
			>
				Step {step.stepNumber}: {step.title ?? 'Cook'}
			</motion.h3>

			{/* Goal (V2) - prominent display */}
			{step.goal && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.18 }}
					className='mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4'
				>
					<Target className='mt-0.5 size-5 shrink-0 text-brand' />
					<div>
						<p className='text-xs font-semibold uppercase tracking-wide text-brand'>
							Goal
						</p>
						<p className='text-text'>{step.goal}</p>
					</div>
				</motion.div>
			)}

			{/* Main Description */}
			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className='mx-auto max-w-lg text-center text-lg leading-relaxed text-text-secondary md:text-xl'
			>
				{step.description}
			</motion.p>

			{/* Micro-Steps (V2) */}
			{step.microSteps && step.microSteps.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.22 }}
					className='mx-auto max-w-md rounded-xl border border-border-subtle bg-bg-card p-4'
				>
					<div className='mb-3 flex items-center gap-2'>
						<ListChecks className='size-4 text-text-muted' />
						<span className='text-sm font-semibold text-text'>
							Step-by-step
						</span>
					</div>
					<ol className='space-y-2'>
						{step.microSteps.map((microStep, idx) => (
							<li
								key={idx}
								className='flex items-start gap-3 text-sm text-text-secondary'
							>
								<span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand'>
									{idx + 1}
								</span>
								<span>{microStep}</span>
							</li>
						))}
					</ol>
				</motion.div>
			)}

			{/* Timer */}
			{timerComponent && (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.25 }}
					className='mb-4'
				>
					{timerComponent}
				</motion.div>
			)}

			{/* Visual Cues (V2) */}
			{step.visualCues && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.28 }}
					className='mx-auto flex max-w-md items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4'
				>
					<Eye className='mt-0.5 size-5 shrink-0 text-success' />
					<div>
						<p className='text-xs font-semibold uppercase tracking-wide text-success'>
							Look for
						</p>
						<p className='text-success'>{step.visualCues}</p>
					</div>
				</motion.div>
			)}

			{/* Common Mistake (V2) */}
			{step.commonMistake && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className='mx-auto flex max-w-md items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4'
				>
					<AlertTriangle className='mt-0.5 size-5 shrink-0 text-warning' />
					<div>
						<p className='text-xs font-semibold uppercase tracking-wide text-warning-vivid'>
							Avoid this mistake
						</p>
						<p className='text-warning-vivid'>{step.commonMistake}</p>
					</div>
				</motion.div>
			)}

			{/* Chef Tip / Tips */}
			{(step.chefTip || step.tips) && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.32 }}
					className='mx-auto flex max-w-md items-start gap-3 rounded-xl bg-bonus/10 p-4'
				>
					<span className='text-lg'>💡</span>
					<p className='text-bonus'>{step.chefTip || step.tips}</p>
				</motion.div>
			)}

			{/* Collapsible enrichments */}
			{hasEnrichments && (
				<div className='mx-auto max-w-md space-y-2'>
					{/* Technique Explanation */}
					{step.techniqueExplanation && (
						<CollapsibleSection
							title='Technique deep-dive'
							icon={ChefHat}
							variant='tip'
						>
							<p className='text-sm text-success'>
								{step.techniqueExplanation}
							</p>
						</CollapsibleSection>
					)}

					{/* Equipment Needed */}
					{step.equipmentNeeded && step.equipmentNeeded.length > 0 && (
						<CollapsibleSection title='Equipment needed' icon={Wrench}>
							<div className='flex flex-wrap gap-2'>
								{step.equipmentNeeded.map((item, idx) => (
									<span
										key={idx}
										className='rounded-full bg-bg-elevated px-3 py-1 text-xs text-text-secondary'
									>
										{item}
									</span>
								))}
							</div>
						</CollapsibleSection>
					)}

					{/* Estimated Time */}
					{step.estimatedHandsOnTime && (
						<div className='flex items-center justify-center gap-2 text-sm text-text-muted'>
							<Timer className='size-4' />
							<span>
								~{Math.ceil(step.estimatedHandsOnTime / 60)} min hands-on
							</span>
						</div>
					)}
				</div>
			)}

			{/* Ingredients Checklist */}
			{ingredientChecklistComponent}
		</div>
	)
}

// Quick mode renderer - minimal, single-line focus
const QuickModeRenderer = ({
	step,
	timerComponent,
}: {
	step: Step
	timerComponent?: React.ReactNode
}) => {
	return (
		<div className='space-y-4'>
			{/* Compact header */}
			<div className='text-center'>
				<span className='text-xs font-semibold uppercase tracking-wide text-text-muted'>
					Step {step.stepNumber}
				</span>
				<h3 className='text-lg font-bold text-text'>{step.title ?? 'Cook'}</h3>
			</div>

			{/* Action line only */}
			<p className='mx-auto max-w-lg text-center text-base leading-relaxed text-text-secondary'>
				{step.description}
			</p>

			{/* Timer (compact) */}
			{timerComponent}

			{/* Quick tip if available */}
			{(step.chefTip || step.tips) && (
				<p className='mx-auto max-w-md text-center text-sm text-bonus'>
					💡 {step.chefTip || step.tips}
				</p>
			)}
		</div>
	)
}

// Kitchen distance mode - large text, arm's length readable
const KitchenModeRenderer = ({
	step,
	timerComponent,
}: {
	step: Step
	timerComponent?: React.ReactNode
}) => {
	return (
		<div className='space-y-6'>
			{/* Video (auto-plays, useful at distance for visual reference) */}
			{step.videoUrl && (
				<div className='relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-2xl shadow-lg'>
					<video
						src={step.videoUrl}
						poster={step.videoThumbnailUrl || undefined}
						autoPlay
						loop
						muted
						playsInline
						className='h-full w-full object-cover'
					/>
				</div>
			)}

			{/* Large step number */}
			<div className='text-center'>
				<span className='font-display text-4xl font-bold text-brand md:text-5xl'>
					{step.stepNumber}
				</span>
				<p className='text-lg font-medium text-text-muted'>
					of {step.title ?? 'Cook'}
				</p>
			</div>

			{/* Goal if available - very prominent */}
			{step.goal && (
				<div className='rounded-2xl bg-brand/10 p-6 text-center'>
					<p className='text-2xl font-semibold text-brand md:text-3xl'>
						{step.goal}
					</p>
				</div>
			)}

			{/* Main instruction - LARGE */}
			<p className='mx-auto max-w-2xl text-center text-2xl font-medium leading-relaxed text-text md:text-3xl'>
				{step.description}
			</p>

			{/* Timer - extra large */}
			{timerComponent}

			{/* Visual cue - important at distance */}
			{step.visualCues && (
				<div className='rounded-2xl border-2 border-success/40 bg-success/5 p-6 text-center'>
					<Eye className='mx-auto mb-2 size-8 text-success' />
					<p className='text-xl text-success md:text-2xl'>
						{step.visualCues}
					</p>
				</div>
			)}

			{/* Warning - important at distance */}
			{step.commonMistake && (
				<div className='rounded-2xl border-2 border-warning/40 bg-warning/10 p-6 text-center'>
					<AlertTriangle className='mx-auto mb-2 size-8 text-warning' />
					<p className='text-xl text-warning-vivid md:text-2xl'>
						{step.commonMistake}
					</p>
				</div>
			)}
		</div>
	)
}

const StepV2RendererComponent = ({
	step,
	mode,
	totalSteps,
	timerComponent,
	ingredientChecklistComponent,
	className,
}: StepV2RendererProps) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={TRANSITION_SPRING}
			className={cn('w-full', className)}
		>
			{mode === 'full' && (
				<FullModeRenderer
					step={step}
					timerComponent={timerComponent}
					ingredientChecklistComponent={ingredientChecklistComponent}
				/>
			)}
			{mode === 'quick' && (
				<QuickModeRenderer step={step} timerComponent={timerComponent} />
			)}
			{mode === 'kitchen' && (
				<KitchenModeRenderer step={step} timerComponent={timerComponent} />
			)}
		</motion.div>
	)
}

export const StepV2Renderer = memo(StepV2RendererComponent)

// Utility to check if V2 rendering is beneficial
export function shouldUseV2Renderer(step: Step): boolean {
	return hasV2Fields(step)
}
