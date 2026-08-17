import { useEffect, useRef, useState } from 'react'
import {
	forceCenter,
	forceCollide,
	forceLink,
	forceManyBody,
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

	useEffect(() => {
		const nodes: ForceNode[] = data.nodes.map((node, index) => ({
			id: node.id,
			x: width / 2 + Math.cos(index) * 80,
			y: height / 2 + Math.sin(index) * 80,
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
					.distance(105)
					.strength(0.8),
			)
			.force('charge', forceManyBody<ForceNode>().strength(-180))
			.force('center', forceCenter(width / 2, height / 2))
			.force('collision', forceCollide<ForceNode>().radius(22))

		simulationRef.current = simulation
		const publish = () =>
			setPositions(
				new Map(
					nodes.map(node => [
						node.id,
						{ x: node.x ?? width / 2, y: node.y ?? height / 2 },
					]),
				),
			)
		simulation.on('tick', publish)
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
		simulationRef.current?.alphaTarget(0.2).restart()
		setPositions(previous => new Map(previous).set(id, position))
	}

	function pinNode(id: string) {
		const node = simulationRef.current?.nodes().find(item => item.id === id)
		if (!node) return
		node.fx = node.x
		node.fy = node.y
		simulationRef.current?.alphaTarget(0)
	}

	return { positions, dragNode, pinNode }
}
