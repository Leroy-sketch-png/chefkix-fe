'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	ChevronLeft,
	ChevronRight,
	Search,
	SlidersHorizontal,
} from 'lucide-react'
import {
	getGraphData,
	getGraphCompoundOverlap,
	getGraphNodeDetail,
	getGraphNeighborhood,
	mergeGraphData,
} from '../services/graphExplorerService'
import { GraphCanvas } from './GraphCanvas'
import type { GraphData, GraphEdge, GraphSignal } from '../types'

const signals: Array<{ value: GraphSignal | 'all'; label: string }> = [
	{ value: 'all', label: 'All signals' },
	{ value: 'substitution', label: 'Substitution' },
	{ value: 'chemical_similarity', label: 'Chemical similarity' },
	{ value: 'co_occurrence', label: 'Co-occurrence' },
]

export function GraphExplorer() {
	const [data, setData] = useState<GraphData | null>(null)
	const [searchData, setSearchData] = useState<GraphData | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loadingNeighborhood, setLoadingNeighborhood] = useState(false)
	const loadedRoots = useRef(new Set<string>())
	const pendingRoots = useRef(new Set<string>())
	const requestedEdges = useRef(new Set<string>())
	const [query, setQuery] = useState('')
	const [searchIndex, setSearchIndex] = useState(0)
	const [visibleSignals, setVisibleSignals] = useState<GraphSignal[]>(
		signals.slice(1).map(item => item.value as GraphSignal),
	)
	const loadGraph = useCallback(() => {
		setError(null)
		getGraphData()
			.then(setData)
			.catch(() => setError('The ingredient graph could not be loaded.'))
	}, [])
	useEffect(() => {
		void loadGraph()
	}, [loadGraph])
	useEffect(() => {
		const term = query.trim()
		setSearchData(null)
		if (!term) return
		let active = true
		const timer = window.setTimeout(() => {
			getGraphData({ query: term, depth: 0, limit: 20 })
				.then(result => {
					if (active) setSearchData(result)
				})
				.catch(() => {
					if (active) setError('Ingredient search could not be loaded.')
				})
		}, 250)
		return () => {
			active = false
			window.clearTimeout(timer)
		}
	}, [query])
	const loadNeighborhood = useCallback(async (nodeId: string) => {
		if (loadedRoots.current.has(nodeId) || pendingRoots.current.has(nodeId))
			return
		pendingRoots.current.add(nodeId)
		setLoadingNeighborhood(true)
		setError(null)
		try {
			const [neighborhood, detail] = await Promise.all([
				getGraphNeighborhood(nodeId),
				getGraphNodeDetail(nodeId).catch(() => undefined),
			])
			setData(previous =>
				previous
					? mergeGraphData(
							mergeGraphData(previous, neighborhood),
							detail
								? {
										nodes: [detail],
										edges: [],
										source: neighborhood.source,
									}
								: { nodes: [], edges: [] },
						)
					: neighborhood,
			)
			loadedRoots.current.add(nodeId)
		} catch {
			pendingRoots.current.delete(nodeId)
			setError('This ingredient neighborhood could not be loaded.')
		} finally {
			pendingRoots.current.delete(nodeId)
			setLoadingNeighborhood(pendingRoots.current.size > 0)
		}
	}, [])
	const visibleData = useMemo(
		() => (data && searchData ? mergeGraphData(data, searchData) : data),
		[data, searchData],
	)
	useEffect(() => {
		const visibleIds = new Set(data?.nodes.map(node => node.id))
		for (const root of loadedRoots.current) {
			if (!visibleIds.has(root)) loadedRoots.current.delete(root)
		}
	}, [data])
	const loadEdgeDetail = useCallback(
		async (edge: GraphEdge) => {
			const key = `${edge.source}:${edge.target}:${edge.type}`
			if (edge.compoundOverlap !== undefined || requestedEdges.current.has(key))
				return
			const source = visibleData?.nodes.find(
				node => node.id === edge.source,
			)?.name
			const target = visibleData?.nodes.find(
				node => node.id === edge.target,
			)?.name
			if (!source || !target) return
			requestedEdges.current.add(key)
			try {
				const detail = await getGraphCompoundOverlap(source, target)
				if (!detail) return
				const update = (graph: GraphData | null) =>
					graph && {
						...graph,
						edges: graph.edges.map(item =>
							`${item.source}:${item.target}:${item.type}` === key
								? { ...item, ...detail }
								: item,
						),
					}
				setData(update)
				setSearchData(update)
			} catch {
				requestedEdges.current.delete(key)
				setError('Official compound comparison is unavailable.')
			}
		},
		[visibleData],
	)
	const shown = useMemo(() => {
		const remoteMatches = new Set(searchData?.nodes.map(node => node.id))
		return (
			visibleData?.nodes.filter(
				node =>
					!query ||
					node.name.toLowerCase().includes(query.toLowerCase()) ||
					remoteMatches.has(node.id),
			) ?? []
		)
	}, [visibleData, searchData, query])
	useEffect(() => {
		setSearchIndex(0)
	}, [data, query])
	const activeSearchId = shown[searchIndex]?.id
	const mappedIngredientCount = new Set(
		(visibleData?.edges ?? [])
			.filter(edge => visibleSignals.includes(edge.type))
			.flatMap(edge => [edge.source, edge.target]),
	).size

	if (error && !data)
		return (
			<div
				className='rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive'
				role='alert'
			>
				{error}{' '}
				<button type='button' onClick={loadGraph} className='underline'>
					Retry
				</button>
			</div>
		)
	if (!data)
		return (
			<div className='rounded-2xl border border-border-subtle p-8 text-sm text-text-muted'>
				Loading ingredient graph…
			</div>
		)
	return (
		<div className='space-y-5'>
			<div className='grid gap-3 sm:grid-cols-3'>
				{[
					{
						value: visibleData?.totalNodeCount ?? data.nodes.length,
						label: 'Ingredients in the index',
						note: 'Browse every ingredient below',
					},
					{
						value: mappedIngredientCount,
						label: 'Ingredients with links',
						note: 'Shown on the map',
					},
					{
						value: visibleData?.edges.length ?? 0,
						label: 'Documented relationships',
						note: 'Select a line for context',
					},
				].map(item => (
					<div
						key={item.label}
						className='rounded-2xl border border-border-subtle bg-bg-card p-3 shadow-sm md:px-4'
					>
						<div className='text-2xl font-bold tabular-nums text-text-primary'>
							{item.value}
						</div>
						<div className='mt-1 text-sm font-semibold text-text-primary'>
							{item.label}
						</div>
						<div className='mt-1 text-xs text-text-muted'>{item.note}</div>
					</div>
				))}
			</div>
			<div className='grid gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-sm lg:grid-cols-[230px_minmax(0,1fr)] lg:items-center'>
				<div>
					<h2 className='text-base font-semibold text-text-primary'>
						Find your starting point
					</h2>
					<p className='mt-1 text-xs text-text-muted'>
						Search an ingredient, then choose which relationship types to
						display.
					</p>
				</div>
				<div className='space-y-3'>
					<div className='flex flex-col gap-3 md:flex-row md:items-center'>
						<div className='relative flex-1'>
							<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
							<input
								aria-label='Search ingredients'
								value={query}
								onChange={event => setQuery(event.target.value)}
								placeholder='Search ingredients…'
								className='w-full rounded-xl border border-border-medium bg-bg-input py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
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
					</div>
					<div className='flex flex-wrap items-center gap-2 text-sm text-text-muted'>
						<SlidersHorizontal className='mr-1 size-4' aria-hidden='true' />
						<span className='mr-1 text-xs font-semibold uppercase tracking-wide'>
							Show links
						</span>
						{signals.map(item => {
							const isAll = item.value === 'all'
							const isActive = isAll
								? visibleSignals.length === signals.length - 1
								: visibleSignals.includes(item.value as GraphSignal)
							return (
								<button
									key={item.value}
									type='button'
									aria-pressed={isActive}
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
									className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? 'border-primary bg-primary/10 text-text-primary' : 'border-border-medium bg-bg-input hover:border-primary/50'}`}
								>
									{item.label}
								</button>
							)
						})}
					</div>
				</div>
			</div>
			<div className='flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-text-muted'>
				<span>
					Showing {visibleData?.nodes.length ?? 0} of{' '}
					{visibleData?.totalNodeCount ?? data.nodes.length} ingredients
				</span>
				{query && (
					<>
						<span>•</span>
						<span>{shown.length} search matches</span>
					</>
				)}
				<span>
					<span className='mr-1 inline-block size-1.5 rounded-full bg-emerald-500 align-middle' />
					Source:{' '}
					{visibleData?.source === 'leader-api'
						? 'Knowledge API'
						: visibleData?.source === 'leader-sample'
							? 'Verified Lead sample'
							: 'Local demo sample'}
				</span>
				{visibleData?.hasMore && (
					<>
						<span>•</span>
						<span>Neighborhoods load as you explore</span>
					</>
				)}
				{loadingNeighborhood && (
					<>
						<span>•</span>
						<span role='status'>Loading neighborhood…</span>
					</>
				)}
			</div>
			{error && (
				<div
					className='rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-text-muted'
					role='status'
				>
					{error} The current graph remains available.
				</div>
			)}
			<GraphCanvas
				data={visibleData ?? data}
				query={query}
				signals={visibleSignals}
				searchTargetId={activeSearchId}
				searchPosition={shown.length ? searchIndex + 1 : 0}
				searchMatchCount={shown.length}
				onNodeSelect={loadNeighborhood}
				onEdgeSelect={loadEdgeDetail}
			/>
		</div>
	)
}
