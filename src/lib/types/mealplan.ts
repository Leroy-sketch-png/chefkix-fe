// Meal plan types — spec: vision_and_spec/23-pantry-and-meal-planning.txt §6-§8

export interface PlannedMeal {
	recipeId: string | null
	title: string
	totalTimeMinutes: number
	servings: number
	aiGenerated: boolean
}

export interface PlannedDay {
	dayOfWeek: string
	breakfast: PlannedMeal | null
	lunch: PlannedMeal | null
	dinner: PlannedMeal | null
}

export interface ShoppingItem {
	ingredient: string
	quantity: string | null
	recipes: string[]
}

export interface MealPlan {
	id: string
	weekStartDate: string
	days: PlannedDay[]
	shoppingList: ShoppingItem[]
}

export interface GenerateMealPlanRequest {
	days?: number
	preferences?: {
		dietary?: string[]
		cuisinePreferences?: string[]
		maxTimePerMeal?: { breakfast: number; lunch: number; dinner: number }
		servings?: number
	}
	pantryItems?: string[]
	existingRecipeIds?: string[]
}

export interface SwapMealRequest {
	recipeId: string | null
	title: string
	totalTimeMinutes: number
	servings: number
	aiGenerated: boolean
}
