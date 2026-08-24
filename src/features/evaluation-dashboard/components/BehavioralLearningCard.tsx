'use client'

import { Activity, AlertTriangle } from 'lucide-react'
import type { BehavioralLearningResults } from '../types'
import { MetricBarChart } from './MetricBarChart'
import { StatusPill } from './StatusPill'

interface BehavioralLearningCardProps {
	data: BehavioralLearningResults
}

/** Shows the static-vs-feedback MRR delta expected from the Lead's Epic 7 export. */
export function BehavioralLearningCard({ data }: BehavioralLearningCardProps) {
	const chartData = [
		{
			id: 'static',
			label: 'Static HGAT',
			value: data.staticMrr,
			status: data.status,
		},
		{
			id: 'feedback',
			label: 'Feedback HGAT',
			value: data.feedbackMrr,
			status: data.status,
		},
	]

	return (
		<section className='rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card'>
			<div className='mb-5 flex items-start gap-3'>
				<div className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
					<Activity className='size-5' />
				</div>
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center justify-between gap-2'>
						<div>
							<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-primary'>
								Behavioral learning
							</p>
							<h2 className='mt-1 text-lg font-bold text-text-primary'>
								Feedback impact on MRR
							</h2>
						</div>
						<StatusPill status={data.status} />
					</div>
					<p className='mt-1 text-sm text-text-muted'>
						Static HGAT versus feedback-updated HGAT on the Lead&apos;s held-out
						corpus.
					</p>
				</div>
			</div>
			<div className='grid gap-3 sm:grid-cols-3'>
				{[
					['Static MRR', data.staticMrr],
					['Feedback MRR', data.feedbackMrr],
					['MRR delta', data.mrrDelta],
				].map(([label, value]) => (
					<div
						key={label as string}
						className='rounded-xl bg-bg-elevated/60 p-3'
					>
						<p className='text-xs text-text-muted'>{label as string}</p>
						<p className='mt-1 text-xl font-bold text-text-primary'>
							{typeof value === 'number' ? `${value.toFixed(2)}%` : 'Pending'}
						</p>
					</div>
				))}
			</div>
			<MetricBarChart
				data={chartData}
				ariaLabel='Static versus feedback-updated mean reciprocal rank'
				fileName='chefkix-behavioral-mrr'
				valueLabel='MRR'
			/>
			<div className='mt-4 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-text-muted'>
				<AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-600' />
				{data.note ??
					'Behavioral simulation results will appear after the Lead export.'}
			</div>
		</section>
	)
}
