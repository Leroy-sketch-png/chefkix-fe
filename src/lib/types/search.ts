/**
 * Search & Knowledge Graph types.
 * Maps to backend SearchController + KnowledgeGraphController responses.
 */

// ── Typesense search hit types ──

export interface SearchHighlight {
	field: string
	snippet: string
	matchedTokens: string[]
}

export interface SearchHit<T = Record<string, unknown>> {
	document: T
	highlights?: SearchHighlight[]
	text_match?: number
}

export interface SearchResult<T = Record<string, unknown>> {
	found: number
	hits: SearchHit<T>[]
	facet_counts?: unknown[]
}

// ── Collection-specific document shapes ──

export interface RecipeSearchDoc {
	id: string
	title: string
	description: string
	cuisine: string
	difficulty: string
	totalTime: number
	cookCount: number
	avgRating: number
	ingredients: string[]
	tags: string[]
	authorId: string
	authorName?: string
	coverImageUrl: string
	createdAt: number
}

export interface UserSearchDoc {
	id: string
	username: string
	displayName: string
	firstName: string
	lastName: string
	bio: string
	avatarUrl: string
	followerCount: number
	recipeCount: number
}

export interface PostSearchDoc {
	id: string
	content: string
	authorId: string
	authorName: string
	recipeTitle: string
	likeCount: number
	commentCount: number
	photoUrl: string
}

export interface IngredientSearchDoc {
	id: string
	name: string
	aliases: string[]
	category: string
}

// ── Unified search response ──

export interface UnifiedSearchResponse {
	recipes?: SearchResult<RecipeSearchDoc>
	posts?: SearchResult<PostSearchDoc>
	users?: SearchResult<UserSearchDoc>
	ingredients?: SearchResult<IngredientSearchDoc>
}

// ── Knowledge Graph types ──

export interface IngredientSubstitution {
	alternative: string
	context: string
	ratio: number
}

export interface KnowledgeIngredient {
	id: string
	canonicalName: string
	name: string
	aliases: string[]
	category: string
	commonUnits: string[]
	allergenFlags: string[]
	substitutions: IngredientSubstitution[]
	isCommon: boolean
	createdAt: string
	updatedAt: string
}

export interface KnowledgeTechnique {
	id: string
	canonicalName: string
	name: string
	description: string
	difficulty: string
	category: string
	relatedEquipment: string[]
	commonMistake: string
	visualCues: string[]
	relatedCuisines: string[]
	createdAt: string
	updatedAt: string
}

// ── Search params ──

export type SearchType = 'all' | 'recipes' | 'posts' | 'users' | 'ingredients'

export interface SearchParams {
	q: string
	type?: SearchType
	limit?: number
	page?: number
}
