export type CookPlanMode = 'COOK_ONCE_TODAY' | 'DINNER_WITH_LEFTOVERS'
export type MealRole =
	| 'MAIN'
	| 'SIDE'
	| 'SOUP'
	| 'DESSERT'
	| 'BREAKFAST'
	| 'BREAD'

export interface CreateCookPlanRequest {
	planDate: string
	mode: CookPlanMode
	householdSize: number
	maxActiveMinutes: number
	pantryFirst: boolean
}

export interface CookPlanDish {
	recipeId: string
	title: string
	coverImageUrl: string | null
	cuisineType: string | null
	mealRole: MealRole
	activeMinutes: number
	totalTimeMinutes: number
	sourceServings: number
	plannedServings: number
	pantryIngredientCount: number
	shoppingIngredientCount: number
}

export interface CookBatch {
	id: string
	title: string
	activeMinutes: number
	totalMinutes: number
	dishes: CookPlanDish[]
}

export interface EatingOccasion {
	name: string
	batchId: string
	servings: number
}

export interface CookPlanShoppingItem {
	ingredient: string
	quantity: string
	unit: string | null
	sourceRecipes: string[]
}

export interface CookPlan {
	id: string | null
	planDate: string
	mode: CookPlanMode
	householdSize: number
	maxActiveMinutes: number
	pantryFirst: boolean
	cookBatches: CookBatch[]
	eatingOccasions: EatingOccasion[]
	shoppingList: CookPlanShoppingItem[]
	unmetConstraints: string[]
}
