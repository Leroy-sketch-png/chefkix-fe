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

	const layoutData = useMemo(
		() => ({
			nodes: data.nodes,
			edges: data.edges.filter(edge => signals.includes(edge.type)),
		}),
		[data.edges, data.nodes, signals],
	)
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

	useEffect(() => {
		if (!query.trim()) {
			setView(initialView)
			return
		}
		const node = highlightedId
			? layoutRef.current.get(highlightedId)
			: undefined
		if (!node) return
		const scale = 1.45
		setView({
			x: node.x - width / scale / 2,
			y: node.y - height / scale / 2,
			scale,
		})
		setSelected(highlightedId)
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
		<div className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card'>
			<div className='relative'>
				<svg
					viewBox={`${view.x} ${view.y} ${width / view.scale} ${height / view.scale}`}
					className='min-h-[520px] min-w-[720px] w-full touch-none cursor-grab'
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
					{data.nodes.map(node => {
						const point = positions.get(node.id)
						if (!point) return null
						const radius = 7 + Math.min((degree.get(node.id) ?? 0) * 1.5, 7)
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
									r={selected === node.id ? radius + 4 : radius}
									fill={categoryColors[node.category] ?? '#94a3b8'}
									stroke={selected === node.id ? '#fff' : 'transparent'}
									strokeWidth='3'
								/>
								<text
									x={point.x}
									y={point.y + radius + 16}
									textAnchor='middle'
									className='fill-text-primary text-[11px]'
								>
									{node.name}
								</text>
							</g>
						)
					})}
				</svg>
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
			<div className='flex flex-wrap gap-x-5 gap-y-2 border-t border-border-subtle px-4 py-3 text-xs text-text-muted'>
				<span className='font-medium text-text-primary'>Legend</span>
				{Object.entries(signalColors).map(([key, color]) => (
					<span key={key} className='inline-flex items-center gap-1.5'>
						<i
							className='h-2.5 w-2.5 rounded-full'
							style={{ backgroundColor: color }}
						/>
						{signalLabels[key as GraphSignal]}
					</span>
				))}
				<span>Node size = connections</span>
				<span>Line thickness reflects reported confidence when available</span>
			</div>
			<div className='flex flex-wrap gap-x-4 gap-y-2 border-t border-border-subtle px-4 py-3 text-xs text-text-muted'>
				<span className='font-medium text-text-primary'>Categories</span>
				{Object.entries(categoryColors).map(([key, color]) => (
					<span key={key} className='inline-flex items-center gap-1.5'>
						<i
							className='h-2.5 w-2.5 rounded-full'
							style={{ backgroundColor: color }}
						/>
						{key.replace('-', ' ')}
					</span>
				))}
			</div>
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
	)
}
