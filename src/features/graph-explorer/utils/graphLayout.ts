import type { GraphNode } from '../types'

export function createRadialLayout(
	nodes: GraphNode[],
	width: number,
	height: number,
) {
	const center = { x: width / 2, y: height / 2 }
	const radius = Math.min(width, height) * 0.36
	return new Map(
		nodes.map((node, index) => {
			const angle =
				(index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2
			return [
				node.id,
				{
					x: center.x + Math.cos(angle) * radius,
					y: center.y + Math.sin(angle) * radius,
				},
			]
		}),
	)
}
