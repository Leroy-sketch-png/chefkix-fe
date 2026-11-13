import type { Substitution } from '@/services/ai'

/** A recipe candidate returned by the ingredient graph or cross-modal index. */
export interface PhotoRecipeMatch {
	recipeId: string
	recipeTitle: string
	coverImageUrl?: string | null
	totalTimeMinutes?: number
	difficulty?: string
	matchScore?: number
	matchMethod?: 'backend' | 'exact-ingredient-overlap'
	inputIngredientCount?: number
	matchedIngredients: string[]
	missingIngredients: string[]
	substitutions?: Record<string, Substitution[]>
}

export type PhotoIntelligenceSource = 'backend'

export interface IngredientRecipeMatchResponse {
	matches: PhotoRecipeMatch[]
	queryIngredients: string[]
	source: 'backend' | 'stored-overlap'
	withheldRecipeCount?: number
	model?: string
}

export interface DishPhotoRetrievalResponse {
	matches: PhotoRecipeMatch[]
	source: PhotoIntelligenceSource
	model?: string
}

export type FoodImageAnalysisStatus = 'identified' | 'uncertain' | 'not_food'

export interface FoodImageIngredientGuess {
	name: string
	basis: 'visible' | 'inferred'
}

export interface FoodImageAnalysis {
	status: FoodImageAnalysisStatus
	dishName: string | null
	possibleDishes: string[]
	ingredients: FoodImageIngredientGuess[]
	source: PhotoIntelligenceSource
	model?: string
}

/** Parsed user constraints; this contract contains no generated substitute names. */
export interface ParsedSubstitutionIntent {
	ingredientToReplace: string | null
	allergenConstraints: string[]
	dietaryConstraints: string[]
	needsClarification: boolean
}

export interface PhotoGraphSubstitution {
	alternative: string
	context: string
	ratio: number | null
	targetResolved: boolean
}

export interface PhotoSubstitutionRequest {
	ingredientToReplace: string
	dishName: string
	dishIngredients: string[]
	allergenConstraints: string[]
	dietaryConstraints: string[]
}

export type PhotoSubstitutionStatus =
	| 'ingredient_not_in_dish'
	| 'ambiguous_source'
	| 'source_not_in_graph'
	| 'no_graph_edges'
	| 'constraint_evidence_incomplete'
	| 'no_candidates_after_filter'
	| 'recommendations'

export interface PhotoSubstitutionResult {
	status: PhotoSubstitutionStatus
	dishName: string
	sourceIngredient: string
	allergenConstraints: string[]
	candidates: PhotoGraphSubstitution[]
	withheldCount: number
	blockedCount: number
	graphScope: 'ingredient_level'
}
