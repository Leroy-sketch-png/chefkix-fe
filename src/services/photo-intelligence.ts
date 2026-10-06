import type {
	IngredientRecipeMatchResponse,
	DishPhotoRetrievalResponse,
} from '@/lib/types/photo-intelligence'
import { aiApi } from '@/lib/axios'
import { getUserFriendlyMessage } from '@/lib/error-utils'

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
	signal?: AbortSignal,
): Promise<IngredientRecipeMatchResponse> {
	const normalizedIngredients = Array.from(
		new Set(ingredients.map(ingredient => ingredient.trim()).filter(Boolean)),
	)
	if (normalizedIngredients.length === 0) {
		return { matches: [], queryIngredients: [], source: 'backend' }
	}

	let payload: ApiPayload<IngredientRecipeMatchResponse>
	try {
		const response = await aiApi.post<
			ApiPayload<IngredientRecipeMatchResponse>
		>(
			INGREDIENT_MATCH_ENDPOINT,
			{ ingredients: normalizedIngredients },
			{ signal },
		)
		payload = response.data
	} catch (error) {
		throw new Error(getUserFriendlyMessage(error))
	}
	if (!payload.success || !payload.data) {
		throw new Error(
			payload.message || 'Ingredient recipe matching is unavailable.',
		)
	}
	return payload.data
}

/** Send a dish photo through the Lead-owned CLIP/cross-modal retrieval adapter. */
export async function retrieveRecipesFromDishPhoto(
	image: Blob,
	signal?: AbortSignal,
): Promise<DishPhotoRetrievalResponse> {
	const body = new FormData()
	body.append('image', image, 'dish-photo.jpg')
	let payload: ApiPayload<DishPhotoRetrievalResponse>
	try {
		const response = await aiApi.post<ApiPayload<DishPhotoRetrievalResponse>>(
			DISH_RETRIEVAL_ENDPOINT,
			body,
			{
				signal,
				headers: { 'Content-Type': 'multipart/form-data' },
			},
		)
		payload = response.data
	} catch (error) {
		throw new Error(getUserFriendlyMessage(error))
	}
	if (!payload.success || !payload.data) {
		throw new Error(payload.message || 'Dish photo retrieval is unavailable.')
	}
	return payload.data
}
