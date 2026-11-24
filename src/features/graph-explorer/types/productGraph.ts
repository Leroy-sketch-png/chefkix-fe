export interface ProductGraphProvenance {
	manifestSha256: string
	nodesSha256: string
	edgesSha256: string
	source: 'FooDB 1.0'
	releaseDate: '2020-04-07'
	license: 'CC BY-NC 4.0'
	scope: string
	interpretation: string
}

export interface ProductFoodCandidate {
	foodId: string
	name: string
}

export interface ProductFoodSearchResponse {
	provenance: ProductGraphProvenance
	foods: ProductFoodCandidate[]
}

export interface ProductFoodNode {
	id: string
	name: string
	type: 'Food'
}

export interface ProductCompoundRelation {
	id: string
	name: string
	predicate: 'has_compound'
	presence: 'PRESENT'
	contentRowSupport: number
	exportEligibleSupport: number
}

export interface ProductFoodCompositionResponse {
	status: 'AVAILABLE' | 'NO_ELIGIBLE_RELATION_UNKNOWN' | 'UNKNOWN_OR_OUT_OF_SCOPE'
	provenance: ProductGraphProvenance
	food: ProductFoodNode | null
	compounds: ProductCompoundRelation[]
	filteredKnownRelationCount: number
}
