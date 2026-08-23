'use client'

import {
	Beaker,
	Check,
	CircleHelp,
	Scale,
	ShieldCheck,
	Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Substitution } from '@/services/ai'
import { AllergenSafetyIndicator } from './AllergenSafetyIndicator'
import { resolveAllergenSafety } from '@/lib/allergen-safety'
import {
	getCompoundExplanation,
	type NutritionProfile,
} from '@/lib/compound-explanation'

interface CompoundExplanationProps {
	originalIngredient: string
	substitution: Substitution
}

interface SourceBadgeProps {
	source: 'chemistry' | 'llm' | 'hybrid'
	isMock: boolean
}

const formatNutrition = (value: number) =>
	Number.isInteger(value) ? String(value) : value.toFixed(1)

const confidenceTone = (score: number) =>
	score >= 0.8
		? {
				bar: 'bg-success',
				text: 'text-success',
				label: 'strong match',
			}
		: score >= 0.5
			? {
					bar: 'bg-warning',
					text: 'text-warning',
					label: 'workable match',
				}
			: {
					bar: 'bg-destructive',
					text: 'text-destructive',
					label: 'use with care',
				}

const SourceBadge = ({ source, isMock }: SourceBadgeProps) => {
	const isChemistry = source === 'chemistry' || source === 'hybrid'
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold',
				isChemistry
					? 'border-brand/20 bg-brand/10 text-brand'
					: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
			)}
		>
			{isChemistry ? (
				<Beaker className='size-3' />
			) : (
				<Sparkles className='size-3' />
			)}
			{isChemistry ? 'Chemistry-grounded' : 'LLM-suggested'}
			{isMock && <span className='font-normal opacity-75'>· demo</span>}
		</span>
	)
}

const ConfidenceBar = ({ score }: { score: number }) => {
	const tone = confidenceTone(score)
	const percentage = Math.round(Math.max(0, Math.min(1, score)) * 100)
	return (
		<div className='space-y-1.5' data-testid='confidence-score'>
			<div className='flex items-center justify-between text-xs'>
				<span className='text-text-muted'>Confidence</span>
				<span className={cn('font-semibold', tone.text)}>
					{percentage}% · {tone.label}
				</span>
			</div>
			<div
				className='h-2 overflow-hidden rounded-full bg-bg-elevated'
				role='progressbar'
				aria-label={`Confidence ${percentage}%`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percentage}
			>
				<div
					className={cn('h-full rounded-full transition-all', tone.bar)}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	)
}

const OverlapBar = ({ overlapPercent }: { overlapPercent: number }) => {
	const shared = Math.round(Math.max(0, Math.min(100, overlapPercent)))
	return (
		<div className='space-y-2' data-testid='compound-overlap'>
			<div className='flex items-center justify-between text-xs'>
				<span className='font-medium text-text-secondary'>
					Compound overlap
				</span>
				<span className='font-bold text-brand'>{shared}% shared</span>
			</div>
			<div
				className='flex h-3 overflow-hidden rounded-full bg-violet-400/25'
				aria-label={`${shared}% shared compounds`}
			>
				<div className='bg-brand' style={{ width: `${shared}%` }} />
			</div>
			<div className='flex justify-between text-2xs text-text-muted'>
				<span className='inline-flex items-center gap-1'>
					<span className='size-2 rounded-full bg-brand' />
					Shared compounds
				</span>
				<span className='inline-flex items-center gap-1'>
					<span className='size-2 rounded-full bg-violet-400/50' />
					Unique profile
				</span>
			</div>
		</div>
	)
}

const NutritionComparison = ({
	original,
	substitute,
}: {
	original: NutritionProfile
	substitute: NutritionProfile
}) => {
	const rows: Array<[string, keyof NutritionProfile, string]> = [
		['Calories', 'calories', 'kcal'],
		['Fat', 'fat', 'g'],
		['Protein', 'protein', 'g'],
	]
	return (
		<div className='space-y-2' data-testid='nutrition-comparison'>
			<div className='flex items-center justify-between'>
				<span className='text-xs font-medium text-text-secondary'>
					Nutrition per 100g
				</span>
				<span className='text-2xs text-text-muted'>original → substitute</span>
			</div>
			<div className='grid grid-cols-3 gap-1.5'>
				{rows.map(([label, key, unit]) => (
					<div
						key={key}
						className='rounded-lg border border-border-subtle bg-bg-elevated/60 p-2'
					>
						<div className='text-2xs text-text-muted'>{label}</div>
						<div className='mt-1 text-xs font-semibold text-text-primary'>
							{formatNutrition(original[key])} →{' '}
							{formatNutrition(substitute[key])}
						</div>
						<div className='text-2xs text-text-muted'>{unit}</div>
					</div>
				))}
			</div>
		</div>
	)
}

const SafetyStatus = ({ safe }: { safe: boolean | null }) => {
	if (safe === null) {
		return (
			<span className='inline-flex items-center gap-1 text-2xs text-text-muted'>
				<CircleHelp className='size-3' />
				Safety pending
			</span>
		)
	}
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 text-2xs',
				safe ? 'text-success' : 'text-destructive',
			)}
		>
			{safe ? (
				<ShieldCheck className='size-3' />
			) : (
				<CircleHelp className='size-3' />
			)}
			{safe ? 'Allergen profile compatible' : 'Check allergen profile'}
		</span>
	)
}

export const CompoundExplanation = ({
	originalIngredient,
	substitution,
}: CompoundExplanationProps) => {
	const insight = getCompoundExplanation(originalIngredient, substitution)
	return (
		<div
			className='mt-3 space-y-3 rounded-xl border border-brand/15 bg-brand/[0.035] p-3'
			data-testid='compound-explanation'
		>
			<div className='flex items-start justify-between gap-2'>
				<div className='flex items-center gap-2'>
					<div className='grid size-7 place-items-center rounded-lg bg-brand/10 text-brand'>
						<Beaker className='size-3.5' />
					</div>
					<div>
						<p className='text-xs font-semibold text-text-primary'>
							Why this works
						</p>
						<p className='text-2xs text-text-muted'>
							Evidence behind this suggestion
						</p>
					</div>
				</div>
				<SourceBadge
					source={insight?.source ?? substitution.source ?? 'llm'}
					isMock={insight?.isMock ?? false}
				/>
			</div>

			<ConfidenceBar score={substitution.confidenceScore} />

			{insight ? (
				<>
					<p className='text-xs leading-relaxed text-text-secondary'>
						{insight.explanation}
					</p>
					<OverlapBar overlapPercent={insight.overlapPercent} />
					<div className='space-y-2'>
						<p className='text-xs font-medium text-text-secondary'>
							Shared compounds
						</p>
						<div className='flex flex-wrap gap-1.5'>
							{insight.sharedCompounds.length > 0 ? (
								insight.sharedCompounds.map(compound => (
									<span
										key={compound.name}
										className='inline-flex items-center gap-1 rounded-full bg-bg-elevated px-2 py-1 text-2xs text-text-secondary'
									>
										<Check className='size-3 text-brand' />
										{compound.name}
									</span>
								))
							) : (
								<span className='text-2xs text-text-muted'>
									Named compounds will appear with the Lead export.
								</span>
							)}
						</div>
					</div>
					<NutritionComparison
						original={insight.originalNutrition}
						substitute={insight.substituteNutrition}
					/>
					<SafetyStatus
						safe={insight.allergenSafe ?? substitution.allergenSafe ?? null}
					/>
				</>
			) : (
				<div className='rounded-lg border border-dashed border-border-subtle bg-bg-elevated/40 p-2.5 text-2xs leading-relaxed text-text-muted'>
					Compound overlap and nutrition evidence will appear when the chemistry
					service publishes data. The substitution remains available as an LLM
					suggestion.
				</div>
			)}
		</div>
	)
}

interface CompoundComparisonProps {
	originalIngredient: string
	substitutions: Substitution[]
	allergenFlags?: string[]
}

const ComparisonMetric = ({
	label,
	value,
	unit = '%',
}: {
	label: string
	value: string
	unit?: string
}) => (
	<div className='rounded-lg bg-bg-elevated/60 p-2'>
		<div className='text-2xs text-text-muted'>{label}</div>
		<div className='mt-1 text-xs font-bold text-text-primary'>
			{value}
			{unit}
		</div>
	</div>
)

export const CompoundComparison = ({
	originalIngredient,
	substitutions,
	allergenFlags,
}: CompoundComparisonProps) => {
	const rows = substitutions.map(substitution => ({
		substitution,
		insight: getCompoundExplanation(originalIngredient, substitution),
	}))
	if (rows.length < 2) return null

	return (
		<div
			className='space-y-2 rounded-xl border border-border-subtle bg-bg-elevated/35 p-3'
			data-testid='compound-comparison'
		>
			<div className='flex items-center justify-between gap-3'>
				<div>
					<p className='text-xs font-semibold text-text-primary'>
						Compare substitutions
					</p>
					<p className='text-2xs text-text-muted'>
						A quick evidence view across the available options
					</p>
				</div>
				<ScaleIcon />
			</div>
			<div className='grid gap-2 sm:grid-cols-2'>
				{rows.map(({ substitution, insight }) => (
					<div
						key={substitution.name}
						className='space-y-2 rounded-lg border border-border-subtle bg-bg-card p-2.5'
					>
						<div className='flex items-center justify-between gap-2'>
							<span className='truncate text-xs font-semibold text-text-primary'>
								{substitution.name}
							</span>
							<span
								className={cn(
									'text-xs font-bold',
									confidenceTone(substitution.confidenceScore).text,
								)}
							>
								{Math.round(substitution.confidenceScore * 100)}%
							</span>
						</div>
						<div className='grid grid-cols-3 gap-1'>
							<ComparisonMetric
								label='Overlap'
								value={
									insight ? String(Math.round(insight.overlapPercent)) : '—'
								}
							/>
							<ComparisonMetric
								label='Calories'
								value={
									insight
										? String(Math.round(insight.substituteNutrition.calories))
										: '—'
								}
								unit=''
							/>
							<ComparisonMetric
								label='Protein'
								value={
									insight
										? formatNutrition(insight.substituteNutrition.protein)
										: '—'
								}
								unit='g'
							/>
						</div>
						<AllergenSafetyIndicator
							safety={resolveAllergenSafety(substitution, allergenFlags)}
							compact
						/>
					</div>
				))}
			</div>
		</div>
	)
}

const ScaleIcon = () => (
	<span className='grid size-7 place-items-center rounded-lg bg-brand/10 text-brand'>
		<Scale className='size-3.5' />
	</span>
)
