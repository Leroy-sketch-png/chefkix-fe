export interface RecipeIngredient {
	id: string
	name: string
	quantity: string
	unit: string
	order: number
}

export interface RecipeStep {
	id: string
	stepNumber: number
	title: string
	instruction: string
	duration?: number // in minutes
	imageUrl?: string
	order: number
	// AI-enriched fields (from backend)
	action?: string // AI-detected action type (e.g., 'boil', 'chop', 'sauté')
	timerSeconds?: number // Timer duration for this step
	tips?: string // AI-generated tips for this step
}

// Difficulty levels per spec 07-recipes.txt
export type RecipeDifficulty =
	| 'BEGINNER'
	| 'INTERMEDIATE'
	| 'ADVANCED'
	| 'EXPERT'

// XP Breakdown for transparency (from calculate_metas AI service)
export interface XpBreakdown {
	base: number
	baseReason: string // "Intermediate difficulty"
	steps: number
	stepsReason: string // "5 steps × 10 XP (capped at 100)"
	time: number
	timeReason: string // "45 minutes × 2 XP (capped at 150)"
	techniques?: number
	techniquesReason?: string // "flambe detected (+25 XP)"
	total: number
}

// Cultural context enrichment
export interface CulturalContext {
	region: string
	background: string
	significance: string
}

export interface Recipe {
	id: string
	userId: string
	title: string
	description: string
	imageUrl: string
	videoUrl?: string
	difficulty: RecipeDifficulty
	prepTime: number // in minutes
	cookTime: number // in minutes
	servings: number
	cuisine?: string
	dietaryTags: string[] // e.g., ['vegan', 'gluten-free']
	caloriesPerServing?: number
	ingredients: RecipeIngredient[]
	steps: RecipeStep[]
	isPublished: boolean
	likeCount: number
	saveCount: number
	viewCount: number
	createdAt: string
	updatedAt: string
	// Dynamic fields
	isLiked?: boolean
	isSaved?: boolean
	author?: {
		userId: string
		username: string
		displayName: string
		avatarUrl: string
	}
	// Gamification fields (from AI service calculate_metas)
	xpReward?: number
	xpBreakdown?: XpBreakdown // Transparency for users
	badges?: string[]
	skillTags?: string[]
	difficultyMultiplier?: number
	// Backend-tracked metrics
	cookCount?: number // How many users have cooked this
	masteredByCount?: number // Users who mastered (25+ cooks)
	averageRating?: number // 1-5 stars from completions
	creatorXpEarned?: number // Total XP earned from others cooking (author only)
	// AI Enrichment fields (from calculate_metas)
	equipmentNeeded?: string[]
	techniqueGuides?: string[]
	seasonalTags?: string[]
	ingredientSubstitutions?: Record<string, string[]>
	culturalContext?: CulturalContext
	recipeStory?: string // AI-generated narrative
	chefNotes?: string // AI tips for success
	aiEnriched?: boolean
	// Anti-cheat validation
	xpValidated?: boolean
	validationConfidence?: number // 0.0-1.0
	validationIssues?: string[]
	xpAdjusted?: boolean
}

export interface RecipeCreateDto {
	title: string
	description: string
	imageUrl: string
	videoUrl?: string
	difficulty: RecipeDifficulty
	prepTime: number
	cookTime: number
	servings: number
	cuisine?: string
	dietaryTags: string[]
	ingredients: Omit<RecipeIngredient, 'id'>[]
	steps: Omit<RecipeStep, 'id'>[]
}

export interface RecipeUpdateDto extends Partial<RecipeCreateDto> {
	isPublished?: boolean
}

export interface RecipeQueryParams {
	page?: number
	limit?: number
	search?: string
	difficulty?: RecipeDifficulty
	cuisine?: string
	dietaryTags?: string[]
	userId?: string
	sortBy?: 'recent' | 'popular' | 'trending'
}
