'use client'

import {
	AlertTriangle,
	Ban,
	Check,
	FlaskConical,
	ShieldCheck,
	Sparkles,
} from 'lucide-react'
import { AllergenSafetyIndicator } from '@/components/recipe/AllergenSafetyIndicator'
import type { AllergenSafetyResult } from '@/lib/allergen-safety'

interface DemoCandidate {
	name: string
	detail: string
	safety: AllergenSafetyResult
}
const guardedExample: DemoCandidate[] = [
	{
		name: 'Sunflower seed butter',
		detail: 'Closest texture match without the peanut family.',
		safety: {
			status: 'check',
			flaggedAllergens: [],
			reason:
				'No direct peanut-family match in this illustration; safety is unverified.',
			source: 'demo',
		},
	},
	{
		name: 'Pumpkin seed butter',
		detail: 'Nut-free option with a savory, roasted profile.',
		safety: {
			status: 'check',
			flaggedAllergens: [],
			reason:
				'No direct peanut-family match in this illustration; safety is unverified.',
			source: 'demo',
		},
	},
	{
		name: 'Peanut flour',
		detail: 'Rejected before it can become a primary suggestion.',
		safety: {
			status: 'blocked',
			flaggedAllergens: ['peanuts'],
			reason: 'Contains peanuts — matches the saved allergy profile.',
			source: 'demo',
		},
	},
]

const unfilteredExample: DemoCandidate[] = [
	{
		name: 'Peanut flour',
		detail: 'Suggested as a thickener without checking the saved profile.',
		safety: {
			status: 'blocked',
			flaggedAllergens: ['peanuts'],
			reason:
				'Illustrative peanut-family match; no model response was collected.',
			source: 'demo',
		},
	},
	{
		name: 'Peanut oil',
		detail: 'Suggested for richness; still belongs to the peanut family.',
		safety: {
			status: 'blocked',
			flaggedAllergens: ['peanuts'],
			reason:
				'Illustrative peanut-family match; no model response was collected.',
			source: 'demo',
		},
	},
	{
		name: 'Almond butter',
		detail: 'Needs brand-level verification for shared-facility warnings.',
		safety: {
			status: 'check',
			flaggedAllergens: [],
			reason:
				'Different allergen family, but verify cross-contact and labeling.',
			source: 'demo',
		},
	},
]

function ResponseColumn({
	title,
	caption,
	items,
	guarded,
}: {
	title: string
	caption: string
	items: DemoCandidate[]
	guarded: boolean
}) {
	return (
		<section className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card sm:p-5'>
			<div className='flex items-start justify-between gap-3'>
				<div>
					<div className='flex items-center gap-2'>
						{guarded ? (
							<ShieldCheck className='size-5 text-success' />
						) : (
							<Sparkles className='size-5 text-violet-300' />
						)}
						<h2 className='text-lg font-bold text-text-primary'>{title}</h2>
					</div>
					<p className='mt-1 text-xs text-text-muted'>{caption}</p>
				</div>
				<span className='rounded-full bg-bg-elevated px-2 py-1 text-2xs font-semibold text-text-muted'>
					Demo data
				</span>
			</div>

			<div className='mt-4 space-y-3'>
				{items.map(item => (
					<article
						key={item.name}
						className='rounded-xl border border-border-subtle bg-bg-elevated/45 p-3'
					>
						<div className='flex items-center justify-between gap-3'>
							<h3 className='text-sm font-semibold text-text-primary'>
								{item.name}
							</h3>
							{item.safety.status === 'safe' ? (
								<Check className='size-4 text-success' />
							) : item.safety.status === 'blocked' ? (
								<Ban className='size-4 text-destructive' />
							) : (
								<AlertTriangle className='size-4 text-warning' />
							)}
						</div>
						<p className='mt-1 text-xs leading-relaxed text-text-muted'>
							{item.detail}
						</p>
						<div className='mt-2'>
							<AllergenSafetyIndicator safety={item.safety} />
						</div>
					</article>
				))}
			</div>

			<div className='mt-4 flex items-center gap-2 rounded-xl bg-bg-elevated p-3 text-xs'>
				{guarded ? (
					<ShieldCheck className='size-4 text-success' />
				) : (
					<AlertTriangle className='size-4 text-warning' />
				)}
				<span className='text-text-secondary'>
					{guarded
						? 'Illustration of a blocked candidate and two candidates needing verification.'
						: 'Scripted examples of flagged and uncertain candidates.'}
				</span>
			</div>
		</section>
	)
}

export default function AllergenSafetyDemoPage() {
	return (
		<main className='min-h-screen bg-bg-primary py-8 sm:py-12'>
			<div className='mx-auto max-w-6xl space-y-8 px-4 sm:px-6'>
				<header className='max-w-3xl'>
					<div className='mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand'>
						<FlaskConical className='size-3.5' /> Epic 6 · interface
						illustration
					</div>
					<h1 className='text-3xl font-black tracking-tight text-text-primary sm:text-4xl'>
						Allergen safety, made visible.
					</h1>
					<p className='mt-3 text-sm leading-relaxed text-text-secondary sm:text-base'>
						These scripted candidates demonstrate safety indicators. No provider
						was called, and no comparative safety result is available.
					</p>
				</header>

				<section className='rounded-2xl border border-border-subtle bg-bg-card p-5'>
					<h2 className='font-semibold'>Fixed illustration: peanut allergy</h2>
					<p className='mt-2 text-sm text-text-secondary'>
						Substitute for peanut butter. These examples explain the interface
						and do not respond to a custom prompt.
					</p>
				</section>

				<div className='grid gap-5 lg:grid-cols-2'>
					<ResponseColumn
						title='Guarded interface example'
						caption='Scripted examples of profile checks; safety remains unverified.'
						items={guardedExample}
						guarded
					/>
					<ResponseColumn
						title='Unfiltered interface example'
						caption='Scripted candidates, with no attribution to an AI provider.'
						items={unfilteredExample}
						guarded={false}
					/>
				</div>

				<div className='flex items-start gap-2 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs leading-relaxed text-text-muted'>
					<AlertTriangle className='mt-0.5 size-4 shrink-0 text-warning' />
					<p>
						Illustration only. Matched provider runs and independent
						adjudication are required before a benchmark comparison. Always
						verify ingredients, brands, and cross-contact warnings with the
						product label and a qualified professional.
					</p>
				</div>
			</div>
		</main>
	)
}
