import { useEffect, useRef, useState } from 'react'
import {
	forceCollide,
	forceLink,
	forceManyBody,
	forceX,
	forceY,
	forceSimulation,
	type SimulationNodeDatum,
} from 'd3-force'
import type { GraphData } from '../types'

export interface ForcePosition {
	x: number
	y: number
}

interface ForceNode extends SimulationNodeDatum {
	id: string
}

export function useForceLayout(data: GraphData, width: number, height: number) {
	const [positions, setPositions] = useState<Map<string, ForcePosition>>(
		new Map(),
	)
	const simulationRef = useRef<ReturnType<
		typeof forceSimulation<ForceNode>
	> | null>(null)
	const positionCacheRef = useRef(new Map<string, ForcePosition>())
	const layoutSizeRef = useRef({ width: 0, height: 0 })

	useEffect(() => {
		const previousPositions =
			layoutSizeRef.current.width === width &&
			layoutSizeRef.current.height === height
				? positionCacheRef.current
				: new Map<string, ForcePosition>()
		layoutSizeRef.current = { width, height }
		const nodes: ForceNode[] = data.nodes.map((node, index) => ({
			id: node.id,
			x: previousPositions.get(node.id)?.x ?? width / 2 + Math.cos(index) * 140,
			y:
				previousPositions.get(node.id)?.y ?? height / 2 + Math.sin(index) * 140,
		}))
		const links = data.edges.map(edge => ({
			source: edge.source,
			target: edge.target,
		}))
		const simulation = forceSimulation(nodes)
			.force(
				'link',
				forceLink<ForceNode, { source: string; target: string }>(links)
					.id(node => node.id)
					.distance(195),
			)
			.force('charge', forceManyBody<ForceNode>().strength(-950))
			.force('x', forceX<ForceNode>(width / 2).strength(0.012))
			.force('y', forceY<ForceNode>(height / 2).strength(0.012))
			.force('collision', forceCollide<ForceNode>().radius(66))
			.alphaDecay(0.045)

		simulationRef.current = simulation
		let ticks = 0
		const publish = () => {
			const nextPositions = new Map(
				nodes.map(node => [
					node.id,
					{ x: node.x ?? width / 2, y: node.y ?? height / 2 },
				]),
			)
			positionCacheRef.current = nextPositions
			setPositions(nextPositions)
		}
		simulation
			.on('tick', () => {
				// Updating every third tick keeps the SVG responsive on dense previews.
				if (++ticks % 3 === 0) publish()
			})
			.on('end', publish)
		publish()

		return () => {
			simulation.stop()
			simulationRef.current = null
		}
	}, [data, height, width])

	function dragNode(id: string, position: ForcePosition) {
		const node = simulationRef.current?.nodes().find(item => item.id === id)
		if (!node) return
		node.fx = position.x
		node.fy = position.y
		node.x = position.x
		node.y = position.y
		positionCacheRef.current = new Map(positionCacheRef.current).set(
			id,
			position,
		)
		simulationRef.current?.alphaTarget(0.2).restart()
	}

	function pinNode(id: string) {
		const node = simulationRef.current?.nodes().find(item => item.id === id)
		if (!node) return
		node.fx = node.x
		node.fy = node.y
		positionCacheRef.current = new Map(positionCacheRef.current).set(id, {
			x: node.x ?? 0,
			y: node.y ?? 0,
		})
		simulationRef.current?.alphaTarget(0)
	}

	return { positions, dragNode, pinNode }
}
