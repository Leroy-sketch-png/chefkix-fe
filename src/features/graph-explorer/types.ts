export type GraphSignal =
	| 'substitution'
	| 'chemical_similarity'
	| 'co_occurrence'

export type GraphDataSource = 'leader-api' | 'local-sample'

export interface CompoundMolecule {
	name: string
	concentration?: number
	unit?: string
}

export interface NutritionSnapshot {
	servingSize?: string
	calories?: number
	proteinGrams?: number
	carbohydratesGrams?: number
	fatGrams?: number
}

export interface TechniqueContext {
	worksFor?: string[]
	notRecommendedFor?: string[]
	note?: string
}

export interface GraphNode {
	id: string
	name: string
	category: string
	allergenFlags: string[]
	compoundData?: {
		primaryCompounds: Array<string | CompoundMolecule>
		flavorProfile: string
		source?: string
	}
	nutrition?: NutritionSnapshot
	detailStatus?: 'complete' | 'pending'
}

export interface GraphEdge {
	source: string
	target: string
	type: GraphSignal
	confidence: number
	context?: string
	compoundOverlap?: number
	nutritionalComparison?: {
		summary?: string
		caloriesDelta?: number
		proteinGramsDelta?: number
		carbohydratesGramsDelta?: number
		fatGramsDelta?: number
	}
	cookValidationCount?: number
	techniqueContext?: TechniqueContext
}

export interface GraphData {
	nodes: GraphNode[]
	edges: GraphEdge[]
	source?: GraphDataSource
	totalNodeCount?: number
	hasMore?: boolean
	loadedRootId?: string
}
