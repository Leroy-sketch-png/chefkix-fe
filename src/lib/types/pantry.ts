// Pantry types — spec: vision_and_spec/23-pantry-and-meal-planning.txt

export interface PantryItem {
	id: string
	ingredientName: string
	normalizedName: string
	quantity: number | null
	unit: string | null
	category: string
	expiryDate: string | null // ISO date
	addedDate: string
	freshness: 'fresh' | 'expiring_soon' | 'expired'
}

export interface PantryItemRequest {
	ingredientName: string
	quantity?: number
	unit?: string
	category?: string
	expiryDate?: string
}

export interface BulkPantryItemRequest {
	items: PantryItemRequest[]
}

export interface PantryRecipeMatch {
	recipeId: string
	recipeTitle: string
	coverImageUrl: string | null
	totalTimeMinutes: number
	difficulty: string
	matchPercentage: number
	matchedIngredients: string[]
	missingIngredients: string[]
	expiringIngredientsUsed: string[]
}
