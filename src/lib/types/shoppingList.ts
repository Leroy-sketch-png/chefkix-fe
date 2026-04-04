// Shopping List types — standalone persistent shopping lists
// Source: ShoppingListController.java, ShoppingListService.java

export interface ShoppingListItem {
	itemId: string
	ingredient: string
	quantity: string | null
	unit: string | null
	category: string // Produce, Dairy, Protein, Grains, Spices, Condiments, Canned, Baking, Other
	recipes: string[]
	checked: boolean
	addedManually: boolean
}

export type ShoppingListSource = 'Meal Plan' | 'Recipe' | 'Custom'

export interface ShoppingListResponse {
	id: string
	name: string
	items: ShoppingListItem[]
	source: ShoppingListSource
	sourceMealPlanId: string | null
	sourceRecipeId: string | null
	shareToken: string | null
	totalItems: number
	checkedItems: number
	createdAt: string
	updatedAt: string
}

export interface ShoppingListSummary {
	id: string
	name: string
	source: ShoppingListSource
	totalItems: number
	checkedItems: number
	createdAt: string
}

// Request types

export interface CreateFromMealPlanRequest {
	mealPlanId: string
}

export interface CreateFromRecipeRequest {
	recipeId: string
	servings?: number
}

export interface CreateCustomListRequest {
	name: string
}

export interface AddCustomItemRequest {
	ingredient: string
	quantity?: string
	unit?: string
	category?: string
}

// Category constants for FE grouping
export const SHOPPING_CATEGORIES = [
	'Produce',
	'Dairy',
	'Protein',
	'Grains',
	'Spices',
	'Condiments',
	'Canned',
	'Baking',
	'Other',
] as const

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number]

// Category icons/colors for UI display
export const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> =
	{
		Produce: { icon: '🥬', color: 'text-success' },
		Dairy: { icon: '🥛', color: 'text-info' },
		Protein: { icon: '🥩', color: 'text-error' },
		Grains: { icon: '🌾', color: 'text-warning' },
		Spices: { icon: '🧂', color: 'text-streak' },
		Condiments: { icon: '🫙', color: 'text-warning-vivid' },
		Canned: { icon: '🥫', color: 'text-text-muted' },
		Baking: { icon: '🧁', color: 'text-brand' },
		Other: { icon: '📦', color: 'text-text-muted' },
	}
