/**
 * Collection type for V2 Learning Paths
 * @see SHARED_BRAIN.md - Collection.java V2 ADDITIONS
 */
export type CollectionType = 'BOOKMARK' | 'LEARNING_PATH' | 'SEASONAL'

/**
 * Difficulty step within a learning path collection
 * Represents a stage/milestone in the learning progression
 */
export interface DifficultyStep {
	/** Display label for this stage (e.g., "Knife Basics", "Intermediate Sauces") */
	label: string
	/** Difficulty level for this stage */
	difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
	/** Ordered recipe IDs in this stage */
	recipeIds: string[]
	/** Zero-based display order */
	order: number
}

export interface Collection {
	id: string
	userId: string
	name: string
	description?: string
	coverImageUrl?: string
	isPublic: boolean
	itemCount: number
	postIds: string[]
	createdAt: string
	updatedAt: string
	// V2 Learning Path fields
	/** Ordered recipe IDs (distinct from postIds) */
	recipeIds?: string[]
	/** Collection type: BOOKMARK (default) or LEARNING_PATH */
	collectionType?: CollectionType
	/** Overall difficulty label for learning paths */
	difficulty?: string
	/** Total time to complete all recipes in minutes */
	estimatedTotalMinutes?: number
	/** Total earnable XP for learning paths */
	totalXp?: number
	/** Number of users enrolled in this learning path */
	enrolledCount?: number
	/** Completion rate (0.0 - 1.0) */
	completionRate?: number
	/** Average rating (1.0 - 5.0) */
	averageRating?: number
	/** Difficulty progression stages for learning paths */
	difficultyProgression?: DifficultyStep[]
	/** Whether this collection is admin-featured (Season's Best, curated) */
	isFeatured?: boolean
	/** Seasonal tag for time-based curation (e.g., "summer-2025") */
	seasonTag?: string
	/** Short tagline for featured display */
	tagline?: string
	/** Emoji icon for visual flair */
	emoji?: string
}

export interface CreateCollectionRequest {
	name: string
	description?: string
	isPublic: boolean
}

export interface UpdateCollectionRequest {
	name: string
	description?: string
	isPublic: boolean
}

/**
 * Collection progress tracking for learning paths
 * @see SHARED_BRAIN.md - CollectionProgressResponse.java
 */
export interface CollectionProgress {
	id: string
	userId: string
	collectionId: string
	/** Recipe IDs that have been completed */
	completedRecipeIds: string[]
	/** Zero-based index of current recipe in the learning path */
	currentRecipeIndex: number
	/** Total XP earned so far */
	totalXpEarned: number
	/** Total recipes in the learning path (for progress bar) */
	totalRecipes: number
	/** Progress percentage: (completedRecipeIds.length / totalRecipes) * 100 */
	progressPercent: number
	/** ISO timestamp when user enrolled */
	startedAt: string
	/** ISO timestamp of last activity */
	lastActivityAt: string
}
