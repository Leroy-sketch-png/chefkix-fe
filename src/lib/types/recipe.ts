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

export interface Recipe {
	id: string
	userId: string
	title: string
	description: string
	imageUrl: string
	videoUrl?: string
	difficulty: 'EASY' | 'MEDIUM' | 'HARD'
	prepTime: number // in minutes
	cookTime: number // in minutes
	servings: number
	cuisine?: string
	dietaryTags: string[] // e.g., ['vegan', 'gluten-free']
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
	badges?: string[]
	skillTags?: string[]
	difficultyMultiplier?: number
	cookCount?: number // How many users have cooked this
}

export interface RecipeCreateDto {
	title: string
	description: string
	imageUrl: string
	videoUrl?: string
	difficulty: 'EASY' | 'MEDIUM' | 'HARD'
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
	difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
	cuisine?: string
	dietaryTags?: string[]
	userId?: string
	sortBy?: 'recent' | 'popular' | 'trending'
}
