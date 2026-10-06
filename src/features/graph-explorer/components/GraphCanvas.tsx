'use client'

import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from 'react'
import { LocateFixed, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useForceLayout, type ForcePosition } from '../hooks/useForceLayout'
import type { GraphData, GraphEdge, GraphSignal } from '../types'
import { GraphEdgeDetailPanel, GraphNodeDetailPanel } from './GraphDetailPanel'

const width = 760
const height = 540
const categoryColors: Record<string, string> = {
	baking: '#fbbf24',
	condiment: '#f97316',
	grain: '#a78bfa',
	oil: '#38bdf8',
	produce: '#4ade80',
	spice: '#fb7185',
	fat: '#f59e0b',
	dairy: '#60a5fa',
	protein: '#f87171',
	fruit: '#fb7185',
	vegetable: '#4ade80',
	flour: '#d6b27c',
	seasoning: '#c084fc',
	herb: '#84cc16',
	'plant-milk': '#22d3ee',
	'nut-butter': '#a78bfa',
	'seed-butter': '#818cf8',
}
const signalColors: Record<GraphSignal, string> = {
	substitution: '#38bdf8',
	chemical_similarity: '#c084fc',
	co_occurrence: '#f59e0b',
}
const signalLabels: Record<GraphSignal, string> = {
	substitution: 'Substitution',
	chemical_similarity: 'Chemical similarity',
	co_occurrence: 'Co-occurrence',
}
const initialView = { x: 0, y: 0, scale: 1 }
const edgeKey = (edge: GraphEdge) =>
	`${edge.source}:${edge.target}:${edge.type}`

export function GraphCanvas({
	data,
	query,
	signals,
	searchTargetId,
	searchPosition,
	searchMatchCount,
	onNodeSelect,
	onEdgeSelect,
}: {
	data: GraphData
	query: string
	signals: GraphSignal[]
	searchTargetId?: string
	searchPosition: number
	searchMatchCount: number
	onNodeSelect?: (nodeId: string) => void
	onEdgeSelect?: (edge: GraphEdge) => void
}) {
	const [selected, setSelected] = useState<string | null>(null)
	const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null)
	const selectedEdge = data.edges.find(
		edge => edgeKey(edge) === selectedEdgeKey,
	)
	const [view, setView] = useState(initialView)
	const dragRef = useRef<string | null>(null)
	const panRef = useRef<{
		startX: number
		startY: number
		view: typeof initialView
	} | null>(null)
	const layoutRef = useRef<Map<string, ForcePosition>>(new Map())

	const layoutData = useMemo(() => {
		const edges = data.edges.filter(edge => signals.includes(edge.type))
		const connected = new Set(edges.flatMap(edge => [edge.source, edge.target]))
		return { nodes: data.nodes.filter(node => connected.has(node.id)), edges }
	}, [data.edges, data.nodes, signals])
	const { positions, dragNode, pinNode } = useForceLayout(
		layoutData,
		width,
		height,
	)
	layoutRef.current = positions
	const degree = useMemo(
		() =>
			data.edges.reduce(
				(counts, edge) =>
					counts
						.set(edge.source, (counts.get(edge.source) ?? 0) + 1)
						.set(edge.target, (counts.get(edge.target) ?? 0) + 1),
				new Map<string, number>(),
			),
		[data.edges],
	)
	const highlightedId = searchTargetId
	const nodeNames = useMemo(
		() => new Map(data.nodes.map(node => [node.id, node.name])),
		[data.nodes],
	)
	const indexedNodes = useMemo(
		() =>
			[...data.nodes]
				.filter(
					node =>
						!query ||
						node.name.toLowerCase().includes(query.toLowerCase()) ||
						node.id === searchTargetId,
				)
				.sort(
					(a, b) =>
						(degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) ||
						a.name.localeCompare(b.name),
				),
		[data.nodes, degree, query, searchTargetId],
	)

	useEffect(() => {
		if (!query.trim()) {
			setView(initialView)
			return
		}
		const node = highlightedId
			? layoutRef.current.get(highlightedId)
			: undefined
		if (highlightedId) setSelected(highlightedId)
		if (!node) return
		const scale = 1.45
		setView({
			x: node.x - width / scale / 2,
			y: node.y - height / scale / 2,
			scale,
		})
	}, [highlightedId, query])

	function getGraphPosition(
		event: ReactPointerEvent<SVGSVGElement>,
	): ForcePosition {
		const rect = event.currentTarget.getBoundingClientRect()
		return {
			x:
				view.x +
				((event.clientX - rect.left) / rect.width) * (width / view.scale),
			y:
				view.y +
				((event.clientY - rect.top) / rect.height) * (height / view.scale),
		}
	}

	function startPan(event: ReactPointerEvent<SVGRectElement>) {
		panRef.current = { startX: event.clientX, startY: event.clientY, view }
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	function resetView() {
		setView(initialView)
		setSelected(null)
		setSelectedEdgeKey(null)
	}

	function selectNode(nodeId: string) {
		setSelectedEdgeKey(null)
		setSelected(nodeId)
		onNodeSelect?.(nodeId)
	}

	function selectEdge(edge: GraphEdge) {
		setSelected(null)
		setSelectedEdgeKey(edgeKey(edge))
		onEdgeSelect?.(edge)
	}

	function changeZoom(delta: number) {
		setView(previous => {
			const scale = Math.max(0.35, Math.min(2.2, previous.scale + delta))
			const centerX = previous.x + width / previous.scale / 2
			const centerY = previous.y + height / previous.scale / 2
			return {
				x: centerX - width / scale / 2,
				y: centerY - height / scale / 2,
				scale,
			}
		})
	}

	return (
		<div className='grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]'>
			<section
				className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-sm'
				aria-label='Relationship map'
			>
				<div className='flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-4'>
					<div>
						<p className='text-[11px] font-bold uppercase tracking-[0.18em] text-primary'>
							01 / Discover connections
						</p>
						<h2 className='mt-1 text-lg font-bold text-text-primary'>
							Relationship map
						</h2>
						<p className='mt-1 text-xs text-text-muted'>
							Only ingredients with documented links appear here. Select a node
							or line to inspect it.
						</p>
					</div>
					<span className='rounded-full border border-border-medium bg-bg-elevated px-3 py-1 text-xs font-medium text-text-muted'>
						{layoutData.edges.length} visible links
					</span>
				</div>
				<div
					className='relative overflow-x-auto bg-bg-elevated/30'
					style={{
						backgroundImage:
							'radial-gradient(var(--border-medium) 0.8px, transparent 0.8px)',
						backgroundSize: '24px 24px',
					}}
				>
					<svg
						viewBox={`${view.x} ${view.y} ${width / view.scale} ${height / view.scale}`}
						className='min-h-[440px] min-w-[620px] w-full touch-none cursor-grab md:min-h-[540px]'
						role='img'
						aria-label='Ingredient force-directed knowledge graph'
						onPointerMove={event => {
							if (dragRef.current)
								dragNode(dragRef.current, getGraphPosition(event))
							const pan = panRef.current
							if (pan) {
								const rect = event.currentTarget.getBoundingClientRect()
								const dx =
									((event.clientX - pan.startX) / rect.width) *
									(width / pan.view.scale)
								const dy =
									((event.clientY - pan.startY) / rect.height) *
									(height / pan.view.scale)
								setView({ ...pan.view, x: pan.view.x - dx, y: pan.view.y - dy })
							}
						}}
						onPointerUp={() => {
							if (dragRef.current) pinNode(dragRef.current)
							dragRef.current = null
							panRef.current = null
						}}
						onPointerCancel={() => {
							dragRef.current = null
							panRef.current = null
						}}
					>
						<rect
							x='-10000'
							y='-10000'
							width='20000'
							height='20000'
							fill='transparent'
							onPointerDown={startPan}
						/>
						{layoutData.edges.map(edge => {
							const source = positions.get(edge.source)
							const target = positions.get(edge.target)
							if (!source || !target) return null
							return (
								<g
									key={edgeKey(edge)}
									role='button'
									tabIndex={0}
									aria-label={`View ${nodeNames.get(edge.source) ?? edge.source} to ${nodeNames.get(edge.target) ?? edge.target} relationship`}
									onClick={() => selectEdge(edge)}
									onKeyDown={event => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault()
											selectEdge(edge)
										}
									}}
									className='cursor-pointer'
								>
									<line
										x1={source.x}
										y1={source.y}
										x2={target.x}
										y2={target.y}
										stroke='transparent'
										strokeWidth='16'
									/>
									<line
										x1={source.x}
										y1={source.y}
										x2={target.x}
										y2={target.y}
										stroke={
											selectedEdgeKey === edgeKey(edge)
												? '#fff'
												: signalColors[edge.type]
										}
										strokeOpacity={
											selectedEdgeKey === edgeKey(edge)
												? 1
												: edge.confidence === undefined
													? 0.65
													: 0.35 + edge.confidence * 0.6
										}
										strokeWidth={
											selectedEdgeKey === edgeKey(edge)
												? 4
												: edge.confidence === undefined
													? 2
													: 1 + edge.confidence * 3
										}
									/>
								</g>
							)
						})}
						{layoutData.nodes.map(node => {
							const point = positions.get(node.id)
							if (!point) return null
							const radius = 11 + Math.min((degree.get(node.id) ?? 0) * 2, 6)
							const isDimmed = Boolean(query) && node.id !== highlightedId
							return (
								<g
									key={node.id}
									role='button'
									tabIndex={0}
									aria-label={`Explore ${node.name}`}
									onPointerDown={event => {
										dragRef.current = node.id
										event.currentTarget.setPointerCapture(event.pointerId)
										setSelectedEdgeKey(null)
									}}
									onClick={() => selectNode(node.id)}
									onKeyDown={event => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault()
											selectNode(node.id)
										}
									}}
									className={
										isDimmed
											? 'opacity-20 cursor-grab'
											: 'cursor-grab active:cursor-grabbing'
									}
								>
									{node.id === highlightedId && (
										<circle
											cx={point.x}
											cy={point.y}
											r={radius + 8}
											fill='none'
											stroke='#fff'
											strokeDasharray='3 3'
											strokeOpacity='0.8'
										/>
									)}
									<circle
										cx={point.x}
										cy={point.y}
										r={radius + 8}
										fill={categoryColors[node.category] ?? '#94a3b8'}
										fillOpacity='0.12'
									/>
									<circle
										cx={point.x}
										cy={point.y}
										r={selected === node.id ? radius + 4 : radius}
										fill={categoryColors[node.category] ?? '#94a3b8'}
										stroke={selected === node.id ? '#fff' : 'transparent'}
										strokeWidth='3'
									/>
									<rect
										x={point.x - node.name.length * 3.5 - 12}
										y={point.y + radius + 5}
										width={node.name.length * 7 + 24}
										height='24'
										rx='12'
										className='fill-bg-card stroke-border-medium'
									/>
									<text
										x={point.x}
										y={point.y + radius + 21}
										textAnchor='middle'
										className='fill-text-primary text-[11px] font-semibold'
									>
										{node.name}
									</text>
								</g>
							)
						})}
					</svg>
					{!layoutData.nodes.length && (
						<div className='pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center'>
							<div className='max-w-xs rounded-2xl border border-border-medium bg-bg-card/95 p-5 shadow-sm'>
								<div className='text-base font-semibold text-text-primary'>
									No links in this view
								</div>
								<p className='mt-2 text-sm text-text-muted'>
									Try another relationship filter, or browse ingredients in the
									index.
								</p>
							</div>
						</div>
					)}
					<div className='absolute right-3 top-3 flex gap-1 rounded-xl border border-border-subtle bg-bg-card/90 p-1 shadow-sm'>
						<button
							type='button'
							aria-label='Zoom in'
							onClick={() => changeZoom(0.15)}
							className='rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary'
						>
							<ZoomIn className='size-4' />
						</button>
						<button
							type='button'
							aria-label='Zoom out'
							onClick={() => changeZoom(-0.15)}
							className='rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary'
						>
							<ZoomOut className='size-4' />
						</button>
						<button
							type='button'
							aria-label='Reset graph view'
							onClick={resetView}
							className='rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary'
						>
							<RotateCcw className='size-4' />
						</button>
					</div>
					{query && (
						<div className='absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card/90 px-3 py-2 text-xs text-text-muted'>
							<LocateFixed className='size-3.5' />
							{searchMatchCount
								? `${searchPosition}/${searchMatchCount} matching ingredient${searchMatchCount === 1 ? '' : 's'}`
								: 'No matching ingredient'}
						</div>
					)}
				</div>
				<div className='flex flex-wrap gap-x-5 gap-y-2 border-t border-border-subtle px-5 py-3 text-xs text-text-muted'>
					<span className='font-semibold text-text-primary'>Line colors</span>
					{Object.entries(signalColors).map(([key, color]) => (
						<span key={key} className='inline-flex items-center gap-1.5'>
							<i
								className='h-2.5 w-2.5 rounded-full'
								style={{ backgroundColor: color }}
							/>
							{signalLabels[key as GraphSignal]}
						</span>
					))}
				</div>
				<div className='flex flex-wrap gap-x-4 gap-y-2 border-t border-border-subtle px-5 py-3 text-xs text-text-muted'>
					<span className='font-semibold text-text-primary'>
						Ingredient colors
					</span>
					{[...new Set(data.nodes.map(node => node.category))]
						.sort()
						.map(key => (
							<span key={key} className='inline-flex items-center gap-1.5'>
								<i
									className='h-2.5 w-2.5 rounded-full'
									style={{ backgroundColor: categoryColors[key] ?? '#94a3b8' }}
								/>
								{key.replace('-', ' ')}
							</span>
						))}
				</div>
			</section>
			<aside className='space-y-4' aria-label='Ingredient explorer'>
				<div className='rounded-2xl border border-border-subtle bg-bg-card shadow-sm'>
					<div className='border-b border-border-subtle px-5 py-4'>
						<p className='text-[11px] font-bold uppercase tracking-[0.18em] text-primary'>
							02 / Inspect the details
						</p>
						<h2 className='mt-1 text-lg font-bold text-text-primary'>
							{selectedEdge
								? 'Relationship details'
								: selected
									? 'Ingredient details'
									: 'Choose a starting point'}
						</h2>
					</div>
					{!selected && !selectedEdge && (
						<div className='p-5 text-sm leading-6 text-text-muted'>
							Select a node or line on the map, or choose an ingredient from the
							index below. The recorded context will appear here.
						</div>
					)}
					{selected &&
						(() => {
							const node = data.nodes.find(item => item.id === selected)
							return node ? (
								<GraphNodeDetailPanel
									node={node}
									connectionCount={degree.get(node.id) ?? 0}
								/>
							) : null
						})()}
					{selectedEdge && (
						<GraphEdgeDetailPanel
							edge={selectedEdge}
							sourceName={nodeNames.get(selectedEdge.source)}
							targetName={nodeNames.get(selectedEdge.target)}
						/>
					)}
				</div>
				<div className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-sm'>
					<div className='border-b border-border-subtle px-5 py-4'>
						<p className='text-[11px] font-bold uppercase tracking-[0.18em] text-primary'>
							03 / Browse the index
						</p>
						<h2 className='mt-1 text-base font-bold text-text-primary'>
							All ingredients{' '}
							<span className='font-normal text-text-muted'>
								({indexedNodes.length})
							</span>
						</h2>
						<p className='mt-1 text-xs text-text-muted'>
							Ingredients without a documented link stay available here.
						</p>
					</div>
					<div className='max-h-[370px] space-y-1 overflow-y-auto p-2'>
						{indexedNodes.map(node => (
							<button
								key={node.id}
								type='button'
								onClick={() => selectNode(node.id)}
								aria-pressed={selected === node.id}
								className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${selected === node.id ? 'bg-primary/10 text-text-primary' : 'text-text-primary hover:bg-bg-elevated'}`}
							>
								<span
									className='size-2.5 shrink-0 rounded-full'
									style={{
										backgroundColor: categoryColors[node.category] ?? '#94a3b8',
									}}
								/>
								<span className='min-w-0 flex-1 truncate text-sm font-medium'>
									{node.name}
								</span>
								<span className='text-[11px] text-text-muted'>
									{degree.get(node.id)
										? `${degree.get(node.id)} link${degree.get(node.id) === 1 ? '' : 's'}`
										: 'No link yet'}
								</span>
							</button>
						))}
						{!indexedNodes.length && (
							<p className='p-3 text-sm text-text-muted'>
								No ingredients match this search.
							</p>
						)}
					</div>
				</div>
			</aside>
		</div>
	)
}
