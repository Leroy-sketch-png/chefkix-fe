import type { Substitution } from '@/services/ai'

/** A recipe candidate returned by the ingredient graph or cross-modal index. */
export interface PhotoRecipeMatch {
	recipeId: string
	recipeTitle: string
	coverImageUrl?: string | null
	totalTimeMinutes?: number
	difficulty?: string
	matchScore: number
	matchedIngredients: string[]
	missingIngredients: string[]
	substitutions?: Record<string, Substitution[]>
}

export type PhotoIntelligenceSource = 'backend'

export interface IngredientRecipeMatchResponse {
	matches: PhotoRecipeMatch[]
	queryIngredients: string[]
	source: PhotoIntelligenceSource
	model?: string
}

export interface DishPhotoRetrievalResponse {
	matches: PhotoRecipeMatch[]
	source: PhotoIntelligenceSource
	model?: string
}
