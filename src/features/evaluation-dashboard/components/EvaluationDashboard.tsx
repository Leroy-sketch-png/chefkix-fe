'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	ChevronRight,
	Database,
	FlaskConical,
	RefreshCw,
	ShieldCheck,
	Trophy,
} from 'lucide-react'
import { getEvaluationDashboardData } from '../services/evaluationDashboardService'
import type { BenchmarkMetric, EvaluationDashboardData } from '../types'

const metricLabels: Record<BenchmarkMetric, string> = {
	hitAt1: 'Hit@1',
	hitAt5: 'Hit@5',
	hitAt10: 'Hit@10',
	mrr: 'MRR',
	ndcg: 'NDCG',
}

const metricOrder: BenchmarkMetric[] = [
	'hitAt1',
	'hitAt5',
	'hitAt10',
	'mrr',
	'ndcg',
]

function formatMetric(value: number | undefined) {
	return value === undefined ? 'Pending' : `${value.toFixed(2)}%`
}

function statusClass(status: string) {
	if (status === 'published' || status === 'complete') return 'text-emerald-600'
	if (status === 'placeholder') return 'text-amber-600'
	return 'text-text-muted'
}

function StatusPill({ status }: { status: string }) {
	return (
		<span
			className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status === 'published' || status === 'complete' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700' : status === 'placeholder' ? 'border-amber-500/25 bg-amber-500/10 text-amber-700' : 'border-border-subtle bg-bg-elevated text-text-muted'}`}
		>
			{status}
		</span>
	)
}

function Surface({
	children,
	className = '',
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<section
			className={`rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card ${className}`}
		>
			{children}
		</section>
	)
}

function SectionHeading({
	icon: Icon,
	eyebrow,
	title,
	description,
}: {
	icon: typeof BarChart3
	eyebrow: string
	title: string
	description: string
}) {
	return (
		<div className='mb-5 flex items-start gap-3'>
			<div className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
				<Icon className='size-5' />
			</div>
			<div>
				<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-primary'>
					{eyebrow}
				</p>
				<h2 className='mt-1 text-lg font-bold text-text-primary'>{title}</h2>
				<p className='mt-1 text-sm text-text-muted'>{description}</p>
			</div>
		</div>
	)
}

export function EvaluationDashboard() {
	const [data, setData] = useState<EvaluationDashboardData | null>(null)
	const [error, setError] = useState<string | null>(null)

	const load = () => {
		setError(null)
		getEvaluationDashboardData()
			.then(setData)
			.catch(() => setError('Evaluation data could not be loaded.'))
	}

	useEffect(load, [])

	const bestPublishedHitAt1 = useMemo(() => {
		if (!data) return undefined
		return Math.max(
			...data.benchmarks.models.map(model => model.metrics.hitAt1 ?? -Infinity),
		)
	}, [data])
	const readiness = useMemo(() => {
		if (!data) return { ready: 0, total: 3 }
		const benchmarkReady = data.benchmarks.models.some(
			model => model.id === 'iron-chef' && model.status !== 'pending',
		)
		const ablationReady = data.ablation.results.some(
			result => result.status === 'complete',
		)
		const allergenReady = data.allergen.models.some(
			model => model.status === 'complete',
		)
		return {
			ready: [benchmarkReady, ablationReady, allergenReady].filter(Boolean)
				.length,
			total: 3,
		}
	}, [data])

	if (error)
		return (
			<div
				className='rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive'
				role='alert'
			>
				{error}{' '}
				<button type='button' onClick={load} className='ml-2 underline'>
					Retry
				</button>
			</div>
		)
	if (!data)
		return (
			<div
				className='rounded-2xl border border-border-subtle bg-bg-card p-8 text-sm text-text-muted'
				role='status'
			>
				Loading evaluation dashboard…
			</div>
		)

	return (
		<div className='space-y-5'>
			<div className='flex flex-col justify-between gap-4 rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-primary/5 p-6 md:flex-row md:items-end'>
				<div>
					<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
						<Trophy className='size-4' /> IRON CHEF v3 · Thesis evidence
					</div>
					<h1 className='mt-2 text-3xl font-bold tracking-tight text-text-primary'>
						Evaluation command center
					</h1>
					<p className='mt-2 max-w-2xl text-sm leading-6 text-text-muted'>
						A single, honest view of model quality, signal contribution, and
						allergen safety. Published baselines are separated from results
						still awaiting the Lead’s export.
					</p>
				</div>
				<div className='flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-xs text-text-muted'>
					<Database className='size-4' /> Dataset status:{' '}
					<span className='font-semibold text-amber-600'>
						Awaiting Epic 3–5 exports
					</span>
				</div>
			</div>

			<nav
				aria-label='Evaluation sections'
				className='sticky top-2 z-10 flex gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-bg-card/95 p-1 shadow-sm backdrop-blur'
			>
				{[
					['overview', 'Overview'],
					['benchmarks', 'Benchmarks'],
					['ablation', 'Ablation'],
					['safety', 'Safety'],
				].map(([id, label]) => (
					<a
						key={id}
						href={`#${id}`}
						className='inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary'
					>
						{label}
						<ChevronRight className='size-3' />
					</a>
				))}
			</nav>

			<div id='overview' className='scroll-mt-20 grid gap-4 sm:grid-cols-3'>
				<div className='rounded-2xl border border-border-subtle bg-bg-card p-4'>
					<p className='text-xs text-text-muted'>Models tracked</p>
					<p className='mt-2 text-2xl font-bold text-text-primary'>
						{data.benchmarks.models.length}
					</p>
					<p className='mt-1 text-xs text-text-muted'>
						Ours + published comparators
					</p>
				</div>
				<div className='rounded-2xl border border-border-subtle bg-bg-card p-4'>
					<p className='text-xs text-text-muted'>Best published Hit@1</p>
					<p className='mt-2 text-2xl font-bold text-text-primary'>
						{Number.isFinite(bestPublishedHitAt1)
							? `${bestPublishedHitAt1.toFixed(2)}%`
							: 'Pending'}
					</p>
					<p className='mt-1 text-xs text-text-muted'>
						Target to beat: GISMo / Mistral
					</p>
				</div>
				<div className='rounded-2xl border border-border-subtle bg-bg-card p-4'>
					<p className='text-xs text-text-muted'>Safety benchmark</p>
					<p className='mt-2 text-2xl font-bold text-amber-600'>Pending</p>
					<p className='mt-1 text-xs text-text-muted'>
						Controlled violation study
					</p>
				</div>
			</div>

			<div className='rounded-2xl border border-border-subtle bg-bg-card p-4'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<p className='text-xs font-semibold uppercase tracking-[0.16em] text-primary'>
							Leader handoff
						</p>
						<h2 className='mt-1 font-semibold text-text-primary'>
							Evidence readiness: {readiness.ready}/{readiness.total} datasets
							live
						</h2>
					</div>
					<p className='text-xs text-text-muted'>
						The shell is ready; exports unlock the final evidence.
					</p>
				</div>
				<div
					className='mt-3 h-2 overflow-hidden rounded-full bg-bg-elevated'
					role='progressbar'
					aria-valuemin={0}
					aria-valuemax={readiness.total}
					aria-valuenow={readiness.ready}
					aria-label='Evidence readiness'
				>
					<div
						className='h-full rounded-full bg-primary transition-all'
						style={{ width: `${(readiness.ready / readiness.total) * 100}%` }}
					/>
				</div>
				<div className='mt-3 grid gap-2 text-xs sm:grid-cols-3'>
					{[
						[
							'Benchmark results',
							data.benchmarks.models.some(
								model => model.id === 'iron-chef' && model.status !== 'pending',
							),
						],
						[
							'Ablation results',
							data.ablation.results.some(
								result => result.status === 'complete',
							),
						],
						[
							'Allergen results',
							data.allergen.models.some(model => model.status === 'complete'),
						],
					].map(([label, complete]) => (
						<div
							key={label as string}
							className='flex items-center justify-between rounded-lg bg-bg-elevated/60 px-3 py-2'
						>
							<span className='text-text-muted'>{label as string}</span>
							{complete ? (
								<CheckCircle2 className='size-4 text-emerald-600' />
							) : (
								<StatusPill status='pending' />
							)}
						</div>
					))}
				</div>
			</div>

			<div id='benchmarks' className='scroll-mt-20'>
				<Surface>
					<SectionHeading
						icon={BarChart3}
						eyebrow='Benchmark scoreboard'
						title='Model comparison'
						description='The final Leader export will populate every metric without changing this surface.'
					/>
					<div className='overflow-x-auto'>
						<table className='w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm'>
							<thead>
								<tr className='text-xs uppercase tracking-wide text-text-muted'>
									<th className='border-b border-border-subtle px-3 py-3 font-semibold'>
										Metric
									</th>
									{data.benchmarks.models.map(model => (
										<th
											key={model.id}
											className='border-b border-border-subtle px-3 py-3 font-semibold'
										>
											{model.shortName}
											<span className='mt-1 block'>
												<StatusPill status={model.status} />
											</span>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{metricOrder.map(metric => (
									<tr key={metric} className='hover:bg-bg-elevated/60'>
										<th
											className='border-b border-border-subtle px-3 py-3 font-medium text-text-primary'
											title={data.benchmarks.metricDefinitions[metric]}
										>
											{metricLabels[metric]}
										</th>
										{data.benchmarks.models.map(model => {
											const value = model.metrics[metric]
											const isBest =
												value !== undefined &&
												value === bestPublishedHitAt1 &&
												metric === 'hitAt1'
											return (
												<td
													key={model.id}
													className={`border-b border-border-subtle px-3 py-3 font-semibold ${isBest ? 'text-primary' : value === undefined ? 'font-normal text-text-muted' : 'text-text-primary'}`}
												>
													{formatMetric(value)}
													{isBest && (
														<span className='ml-2 text-[10px] font-normal uppercase text-primary'>
															best
														</span>
													)}
												</td>
											)
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p className='mt-4 text-xs text-text-muted'>
						Baseline values currently shown: GISMo Hit@1 20.56% and fine-tuned
						Mistral Hit@1 21.75%, as recorded in the backlog. All other missing
						values remain explicitly pending.
					</p>
				</Surface>
			</div>

			<div className='grid gap-5 lg:grid-cols-2'>
				<div id='ablation' className='scroll-mt-20'>
					<Surface>
						<SectionHeading
							icon={FlaskConical}
							eyebrow='Ablation study'
							title='Which signal matters most?'
							description='Compare chemical, nutritional, semantic, and combined features once the Leader exports ablation results.'
						/>
						<div className='space-y-4'>
							{data.ablation.results.map(result => (
								<div key={result.id}>
									<div className='mb-1 flex justify-between text-sm'>
										<span className='font-medium text-text-primary'>
											{result.label}
										</span>
										<span
											className={
												result.hitAt1 === undefined
													? 'text-text-muted'
													: 'font-semibold text-text-primary'
											}
										>
											{formatMetric(result.hitAt1)}
										</span>
									</div>
									<div className='h-3 overflow-hidden rounded-full bg-bg-elevated'>
										<div
											className='h-full rounded-full bg-primary transition-all'
											style={{ width: `${result.hitAt1 ?? 0}%` }}
										/>
									</div>
									<p className='mt-1 text-[11px] text-text-muted'>
										{result.note ?? 'Ready for comparison'}
									</p>
								</div>
							))}
						</div>
					</Surface>
				</div>
				<div id='safety' className='scroll-mt-20'>
					<Surface>
						<SectionHeading
							icon={ShieldCheck}
							eyebrow='Safety evidence'
							title='Allergen violation comparison'
							description={data.allergen.benchmarkDescription}
						/>
						<div className='space-y-3'>
							{data.allergen.models.map(model => (
								<div
									key={model.id}
									className='flex items-center justify-between rounded-xl border border-border-subtle bg-bg-elevated/50 p-3'
								>
									<div>
										<p className='font-medium text-text-primary'>
											{model.name}
										</p>
										<p className='mt-1 text-xs text-text-muted'>
											{model.note ??
												`${model.caughtViolations ?? 0} caught of ${model.totalCases ?? 0} cases`}
										</p>
									</div>
									<div className='text-right'>
										<p
											className={`font-bold ${model.violationRate === undefined ? 'text-text-muted' : model.violationRate === 0 ? 'text-emerald-600' : 'text-destructive'}`}
										>
											{model.violationRate === undefined
												? 'Pending'
												: `${model.violationRate.toFixed(2)}%`}
										</p>
										<p
											className={`text-[10px] uppercase ${statusClass(model.status)}`}
										>
											{model.status}
										</p>
									</div>
								</div>
							))}
						</div>
						<div className='mt-4 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-text-muted'>
							<AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-600' />
							A zero-violation claim must only appear after the controlled
							benchmark file is supplied.
						</div>
					</Surface>
				</div>
			</div>

			<div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-elevated/50 px-4 py-3 text-xs text-text-muted'>
				<span className='inline-flex items-center gap-2'>
					<CheckCircle2 className='size-4 text-emerald-600' /> Data contract
					ready for Leader exports
				</span>
				<span>
					Schema versions: {data.benchmarks.version} · updated{' '}
					{data.benchmarks.updatedAt}
				</span>
				<button
					type='button'
					onClick={load}
					className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2 font-medium text-text-primary hover:border-primary'
				>
					<RefreshCw className='size-3.5' /> Refresh data
				</button>
			</div>
		</div>
	)
}
