export type GraphSignal =
	| 'substitution'
	| 'chemical_similarity'
	| 'co_occurrence'

export type GraphDataSource = 'leader-api' | 'leader-sample' | 'local-sample'

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
	confidence?: number
	substitutionRatio?: number
	context?: string
	compoundOverlap?: number
	compoundOverlapSemantics?: string
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

export interface GraphEvidenceResponse {
	contractVersion: 'graph-evidence.v1'
	status: 'AVAILABLE' | 'UNAVAILABLE' | 'REFUSED'
	unavailableReason?: string
	artifactIntegrity?: {
		status: 'VERIFIED' | 'MISSING' | 'INVALID' | 'UNVERIFIED'
		expectedSha256?: string
		observedSha256?: string
	}
	evidence?: {
		identityResolution?: {
			status: 'RESOLVED' | 'UNKNOWN' | 'AMBIGUOUS'
			requestedSourceIngredientId?: string
			sourceIngredientId?: string
			requestedCandidateIngredientId?: string
			candidateIngredientId?: string
		}
		trainPairEvidence?: {
			seenInTrain?: boolean | null
			trainCount?: number | null
			unit?: 'TRAIN_PAIRS'
		}
		calibration?: { status?: string }
		decision?: { decision?: 'ABSTAIN' }
	}
}

export type GraphEvidenceLoadState =
	| { edgeKey: string; state: 'loading' | 'error' }
	| { edgeKey: string; state: 'loaded'; response: GraphEvidenceResponse }
