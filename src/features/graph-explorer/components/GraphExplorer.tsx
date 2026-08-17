'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	ChevronLeft,
	ChevronRight,
	Search,
	SlidersHorizontal,
} from 'lucide-react'
import { getGraphData } from '../services/graphExplorerService'
import { GraphCanvas } from './GraphCanvas'
import type { GraphData, GraphSignal } from '../types'

const signals: Array<{ value: GraphSignal | 'all'; label: string }> = [
	{ value: 'all', label: 'All signals' },
	{ value: 'substitution', label: 'Substitution' },
	{ value: 'chemical_similarity', label: 'Chemical similarity' },
	{ value: 'co_occurrence', label: 'Co-occurrence' },
]

export function GraphExplorer() {
	const [data, setData] = useState<GraphData | null>(null)
	const [query, setQuery] = useState('')
	const [searchIndex, setSearchIndex] = useState(0)
	const [visibleSignals, setVisibleSignals] = useState<GraphSignal[]>(
		signals.slice(1).map(item => item.value as GraphSignal),
	)
	useEffect(() => {
		getGraphData().then(setData)
	}, [])
	const shown = useMemo(
		() =>
			data?.nodes.filter(
				node => !query || node.name.toLowerCase().includes(query.toLowerCase()),
			) ?? [],
		[data, query],
	)
	useEffect(() => {
		setSearchIndex(0)
	}, [data, query])
	const activeSearchId = shown[searchIndex]?.id

	if (!data)
		return (
			<div className='rounded-2xl border border-border-subtle p-8 text-sm text-text-muted'>
				Loading ingredient graph…
			</div>
		)
	return (
		<div className='space-y-5'>
			<div className='flex flex-col gap-3 rounded-2xl border border-border-subtle bg-bg-elevated p-4 md:flex-row md:items-center'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
					<input
						value={query}
						onChange={event => setQuery(event.target.value)}
						placeholder='Search ingredients…'
						className='w-full rounded-xl border border-border-subtle bg-bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary'
					/>
				</div>
				{query && (
					<div className='flex items-center gap-1 rounded-xl border border-border-subtle bg-bg-card p-1 text-xs text-text-muted'>
						<button
							type='button'
							aria-label='Previous search result'
							title='Previous result'
							disabled={!shown.length}
							onClick={() =>
								setSearchIndex(index =>
									index === 0 ? shown.length - 1 : index - 1,
								)
							}
							className='rounded-lg p-1.5 hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-40'
						>
							<ChevronLeft className='size-4' />
						</button>
						<span className='min-w-10 text-center tabular-nums'>
							{shown.length ? `${searchIndex + 1}/${shown.length}` : '0/0'}
						</span>
						<button
							type='button'
							aria-label='Next search result'
							title='Next result'
							disabled={!shown.length}
							onClick={() =>
								setSearchIndex(index =>
									index === shown.length - 1 ? 0 : index + 1,
								)
							}
							className='rounded-lg p-1.5 hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-40'
						>
							<ChevronRight className='size-4' />
						</button>
					</div>
				)}
				<div className='flex flex-wrap items-center gap-2 text-sm text-text-muted'>
					<SlidersHorizontal className='size-4' />
					{signals.map(item => {
						const isAll = item.value === 'all'
						const isActive = isAll
							? visibleSignals.length === signals.length - 1
							: visibleSignals.includes(item.value as GraphSignal)
						return (
							<button
								key={item.value}
								type='button'
								onClick={() =>
									setVisibleSignals(
										isAll
											? signals
													.slice(1)
													.map(signalItem => signalItem.value as GraphSignal)
											: previous =>
													previous.includes(item.value as GraphSignal)
														? previous.filter(value => value !== item.value)
														: [...previous, item.value as GraphSignal],
									)
								}
								className={`rounded-xl border px-3 py-2 transition-colors ${isActive ? 'border-primary bg-primary/10 text-text-primary' : 'border-border-subtle bg-bg-card hover:border-primary/50'}`}
							>
								{item.label}
							</button>
						)
					})}
				</div>
			</div>
			<div className='flex flex-wrap gap-3 text-xs text-text-muted'>
				<span>{data.nodes.length} ingredients</span>
				<span>•</span>
				<span>{data.edges.length} graph relationships</span>
				{query && (
					<>
						<span>•</span>
						<span>{shown.length} search matches</span>
					</>
				)}
				<span>•</span>
				<span>
					Mock mode:{' '}
					{process.env.NEXT_PUBLIC_GRAPH_EXPLORER_MOCK !== 'false'
						? 'ON'
						: 'OFF'}
				</span>
			</div>
			<GraphCanvas
				data={data}
				query={query}
				signals={visibleSignals}
				searchTargetId={activeSearchId}
				searchPosition={shown.length ? searchIndex + 1 : 0}
				searchMatchCount={shown.length}
			/>
		</div>
	)
}
