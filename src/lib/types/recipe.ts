/**
 * Recipe Types - Aligned with vision_and_spec/07-recipes.txt
 * Last synced: 2025-12-20
 *
 * CANONICAL SOURCE: BE RecipeDetailResponse.java + vision spec
 * DO NOT add legacy aliases - fix components to use correct field names
 */

import type { Difficulty } from './gamification'

// Re-export Difficulty for convenience
export type { Difficulty }

// ============================================
// ENUMS - Match BE enums with @JsonValue serialization
// ============================================

/**
 * Recipe status - BE sends SCREAMING_SNAKE_CASE
 */
export type RecipeStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED'

/**
 * Recipe visibility
 */
export type RecipeVisibility = 'PUBLIC' | 'PRIVATE' | 'PENDING' | 'FRIENDS_ONLY'

// ============================================
// SUB-TYPES - Match BE inner DTOs exactly
// ============================================

/**
 * Ingredient - matches BE IngredientResponse
 * Note: BE does NOT have 'id' or 'order' fields
 */
export interface Ingredient {
	name: string
	quantity: string
	unit: string
}

/**
 * Step - matches BE StepResponse
 * Note: BE uses 'description', not 'instruction'
 */
export interface Step {
	stepNumber: number
	title: string
	description: string // BE field name (not 'instruction')
	action?: string
	ingredients?: Ingredient[] // Steps can have their own ingredients
	timerSeconds?: number
	imageUrl?: string
	tips?: string
}

/**
 * Author - matches BE AuthorResponse
 */
export interface Author {
	userId: string
	username: string
	displayName: string
	avatarUrl?: string
}

/**
 * XP Breakdown - from AI calculate_metas
 */
export interface XpBreakdown {
	base: number
	baseReason: string
	steps: number
	stepsReason: string
	time: number
	timeReason: string
	techniques?: number
	techniquesReason?: string
	total: number
}

/**
 * Validation metadata from AI
 */
export interface ValidationMetadata {
	xpValidated: boolean
	validationConfidence: number
	validationIssues: string[]
	xpAdjusted: boolean
}

/**
 * Cultural context enrichment
 */
export interface CulturalContext {
	region: string
	background: string
	significance: string
}

/**
 * Enrichment metadata from AI
 */
export interface EnrichmentMetadata {
	equipmentNeeded?: string[]
	techniqueGuides?: string[]
	seasonalTags?: string[]
	ingredientSubstitutions?: Record<string, string[]>
	culturalContext?: CulturalContext
	recipeStory?: string
	chefNotes?: string
	aiEnriched: boolean
}

/**
 * User interaction with recipe (for currentUserInteraction field)
 */
export interface UserInteraction {
	cookCount: number
	rating?: number
	lastCookedAt?: string
	masteryLevel?: string
	xpEarnedTotal: number
}

// ============================================
// MAIN RECIPE TYPE - Matches RecipeDetailResponse exactly
// ============================================

/**
 * Recipe - matches BE RecipeDetailResponse.java
 * Source: vision_and_spec/07-recipes.txt
 */
export interface Recipe {
	// === Core Fields ===
	id: string
	createdAt: string // ISO8601
	updatedAt: string // ISO8601
	recipeStatus: RecipeStatus // BE field name (not 'status')

	// === Content ===
	title: string
	description: string
	coverImageUrl: string[] // Array, use [0] for thumbnail
	videoUrl: string[] // Array
	difficulty: Difficulty
	prepTimeMinutes: number
	cookTimeMinutes: number
	totalTimeMinutes: number
	servings: number
	cuisineType: string // BE field name (not 'cuisine')
	dietaryTags: string[]
	caloriesPerServing?: number

	// === Recipe Structure ===
	fullIngredientList: Ingredient[] // BE field name (not 'ingredients')
	steps: Step[]

	// === Gamification (from AI calculate_metas) ===
	xpReward: number
	difficultyMultiplier: number
	rewardBadges: string[] // BE field name (not 'badges')
	skillTags: string[]

	// === Engagement Metrics ===
	likeCount: number
	saveCount: number
	viewCount: number
	cookCount: number
	masteredByCount?: number
	trendingScore?: number
	averageRating?: number
	creatorXpEarned?: number

	// === Author Info ===
	author: Author

	// === User-Specific State ===
	isLiked: boolean
	isSaved: boolean
	currentUserInteraction?: UserInteraction

	// === AI Metadata (optional, from enriched responses) ===
	xpBreakdown?: XpBreakdown
	validation?: ValidationMetadata
	enrichment?: EnrichmentMetadata
}

// ============================================
// SUMMARY RESPONSE - Lighter version for lists
// ============================================

/**
 * RecipeSummary - matches BE RecipeSummaryResponse.java
 * Used in lists, feeds, search results
 */
export interface RecipeSummary {
	id: string
	createdAt: string
	title: string
	description: string
	coverImageUrl: string[]
	difficulty: Difficulty
	totalTimeMinutes: number
	servings: number
	cuisineType?: string
	xpReward: number
	badges?: string[]
	likeCount: number
	saveCount: number
	viewCount: number
	author: Author
	isLiked?: boolean
	isSaved?: boolean
}

// ============================================
// REQUEST DTOs - For create/update operations
// ============================================

/**
 * Create recipe request - matches BE RecipeRequest
 */
export interface RecipeCreateRequest {
	title: string
	description: string
	coverImageUrl?: string[]
	videoUrl?: string[]
	difficulty: Difficulty
	prepTimeMinutes: number
	cookTimeMinutes: number
	totalTimeMinutes?: number
	servings: number
	cuisineType?: string
	dietaryTags?: string[]
	caloriesPerServing?: number
	fullIngredientList: Ingredient[]
	steps: Omit<Step, 'stepNumber'>[] // stepNumber auto-assigned
	xpReward?: number
	difficultyMultiplier?: number
	rewardBadges?: string[]
	skillTags?: string[]
}

/**
 * Update recipe request
 */
export interface RecipeUpdateRequest extends Partial<RecipeCreateRequest> {}

/**
 * Recipe completion request - matches BE RecipeCompletionRequest
 */
export interface RecipeCompleteRequest {
	proofImageUrls?: string[]
	timerLogs?: Array<{
		stepNumber: number
		elapsedSeconds: number
	}>
	rating?: number
	notes?: string
}

/**
 * Recipe completion response
 */
export interface RecipeCompleteResponse {
	completionId: string
	recipeId: string
	xpEarned: number
	newBadges: string[]
	userProfile: {
		userId: string
		currentXP: number
		currentXPGoal: number
		currentLevel: number
		completionCount: number
	}
}

// ============================================
// QUERY PARAMS
// ============================================

export interface RecipeSearchParams {
	query?: string
	difficulty?: Difficulty
	cuisineType?: string
	dietaryTags?: string[]
	maxTimeMinutes?: number
	sortBy?: 'newest' | 'trending' | 'xpReward'
	page?: number
	size?: number
}

// ============================================
// TOGGLE RESPONSES
// ============================================

export interface RecipeLikeResponse {
	id: string
	likeCount: number
	isLiked: boolean
}

export interface RecipeSaveResponse {
	id: string
	saveCount: number
	isSaved: boolean
}

// ============================================
// CREATOR INSIGHTS
// ============================================

export interface CreatorInsights {
	recipeCount: number
	totalCookCount: number
	averageXpReward: number
}

// RecipeMastery is defined in gamification.ts - import from there
// Re-export for convenience from recipe context
export type { RecipeMastery } from './gamification'

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get primary image URL from recipe.
 * coverImageUrl is an array - returns first element or placeholder.
 */
export function getRecipeImage(
	recipe: { coverImageUrl?: string[] } | null | undefined,
): string {
	if (!recipe?.coverImageUrl?.length) return '/placeholder-recipe.jpg'
	return recipe.coverImageUrl[0]
}

/**
 * Get total time, preferring computed totalTimeMinutes
 */
export function getTotalTime(recipe: {
	totalTimeMinutes?: number
	prepTimeMinutes?: number
	cookTimeMinutes?: number
}): number {
	return (
		recipe.totalTimeMinutes ??
		(recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
	)
}

/**
 * Check if recipe is published
 */
export function isPublished(recipe: { recipeStatus: RecipeStatus }): boolean {
	return recipe.recipeStatus === 'PUBLISHED'
}

/**
 * Query params for recipe filtering/pagination
 * NOTE: Maps to BE RecipeSearchQuery.java
 * - `query` = text search (title/description) - BE field name
 * - `search` = alias for `query` (will be mapped in toBackendParams)
 */
export interface RecipeQueryParams {
	page?: number
	size?: number
	limit?: number
	difficulty?: Difficulty
	cuisineType?: string
	dietaryTags?: string[]
	minTime?: number
	maxTime?: number
	maxTimeMinutes?: number // BE field name for time filter
	query?: string // BE field name for text search
	search?: string // FE alias (mapped to query)
	sortBy?: string // newest, trending, popular
}
