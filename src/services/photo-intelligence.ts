import type {
	IngredientRecipeMatchResponse,
	DishPhotoRetrievalResponse,
} from '@/lib/types/photo-intelligence'

const INGREDIENT_MATCH_ENDPOINT = '/api/photo-intelligence/ingredient-recipes'
const DISH_RETRIEVAL_ENDPOINT = '/api/photo-intelligence/dish-retrieval'

interface ApiPayload<T> {
	success: boolean
	message?: string
	data?: T
}

/** Query the Lead-owned HGAT adapter with normalized detected ingredient names. */
export async function findRecipesFromIngredients(
	ingredients: string[],
): Promise<IngredientRecipeMatchResponse> {
	const normalizedIngredients = Array.from(
		new Set(ingredients.map(ingredient => ingredient.trim()).filter(Boolean)),
	)
	if (normalizedIngredients.length === 0) {
		return { matches: [], queryIngredients: [], source: 'backend' }
	}

	const response = await fetch(INGREDIENT_MATCH_ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ingredients: normalizedIngredients }),
	})
	const payload =
		(await response.json()) as ApiPayload<IngredientRecipeMatchResponse>
	if (!response.ok || !payload.success || !payload.data) {
		throw new Error(
			payload.message || 'Ingredient recipe matching is unavailable.',
		)
	}
	return payload.data
}

/** Send a dish photo through the Lead-owned CLIP/cross-modal retrieval adapter. */
export async function retrieveRecipesFromDishPhoto(
	image: Blob,
): Promise<DishPhotoRetrievalResponse> {
	const body = new FormData()
	body.append('image', image, 'dish-photo.jpg')
	const response = await fetch(DISH_RETRIEVAL_ENDPOINT, {
		method: 'POST',
		body,
	})
	const payload =
		(await response.json()) as ApiPayload<DishPhotoRetrievalResponse>
	if (!response.ok || !payload.success || !payload.data) {
		throw new Error(payload.message || 'Dish photo retrieval is unavailable.')
	}
	return payload.data
}
