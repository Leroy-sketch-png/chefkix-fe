export type GraphSignal =
	| 'substitution'
	| 'chemical_similarity'
	| 'co_occurrence'

export interface GraphNode {
	id: string
	name: string
	category: string
	allergenFlags: string[]
	compoundData?: {
		primaryCompounds: string[]
		flavorProfile: string
	}
}

export interface GraphEdge {
	source: string
	target: string
	type: GraphSignal
	confidence: number
	context?: string
	compoundOverlap?: number
}

export interface GraphData {
	nodes: GraphNode[]
	edges: GraphEdge[]
}
