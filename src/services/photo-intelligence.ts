import type {
	IngredientRecipeMatchResponse,
	DishPhotoRetrievalResponse,
	FoodImageAnalysis,
	ParsedSubstitutionIntent,
} from '@/lib/types/photo-intelligence'
import type { Recipe } from '@/lib/types/recipe'
import { isAxiosError } from 'axios'
import { aiApi } from '@/lib/axios'
import { getUserFriendlyMessage } from '@/lib/error-utils'
import { getAllRecipes } from '@/services/recipe'

const INGREDIENT_MATCH_ENDPOINT = '/api/photo-intelligence/ingredient-recipes'
const DISH_RETRIEVAL_ENDPOINT = '/api/photo-intelligence/dish-retrieval'
const FOOD_IMAGE_ANALYSIS_ENDPOINT = '/api/v1/food-vision/analyze'
const SUBSTITUTION_INTENT_ENDPOINT =
	'/api/v1/food-vision/parse-substitution-intent'
const STORED_RECIPE_MATCH_LIMIT = 100

interface ApiPayload<T> {
	success: boolean
	message?: string
	data?: T
}

/** Query the Lead-owned HGAT adapter with normalized confirmed/manual ingredients. */
export async function findRecipesFromIngredients(
	ingredients: string[],
	signal?: AbortSignal,
): Promise<IngredientRecipeMatchResponse> {
	const uniqueByNormalizedName = new Map<string, string>()
	for (const ingredient of ingredients) {
		if (typeof ingredient !== 'string') continue
		const trimmed = ingredient.trim()
		if (!trimmed) continue
		const key = normalizeIngredientName(trimmed)
		if (!uniqueByNormalizedName.has(key))
			uniqueByNormalizedName.set(key, trimmed)
	}
	const normalizedIngredients = [...uniqueByNormalizedName.values()]
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
		if (
			isAxiosError(error) &&
			error.response?.status === 503 &&
			(error.response.data as { code?: unknown } | undefined)?.code ===
				'INTEGRATION_PENDING'
		) {
			return matchVisibleStoredRecipes(normalizedIngredients)
		}
		throw new Error(getUserFriendlyMessage(error))
	}
	if (!payload.success || !payload.data) {
		throw new Error(
			payload.message || 'Ingredient recipe matching is unavailable.',
		)
	}
	return payload.data
}

/**
 * Use the existing authenticated recipe API when HGAT has no configured endpoint.
 * This is a bounded exact-name overlap baseline, not graph/model matching.
 */
async function matchVisibleStoredRecipes(ingredients: string[]) {
	const response = await getAllRecipes({
		page: 0,
		size: STORED_RECIPE_MATCH_LIMIT,
	})
	if (!response.success || !Array.isArray(response.data)) {
		throw new Error(
			'Stored recipes could not be loaded for ingredient matching.',
		)
	}

	const suppliedNames = new Set(ingredients.map(normalizeIngredientName))
	let withheldRecipeCount = 0
	const matches = (response.data as unknown[]).flatMap(rawRecipe => {
		if (!rawRecipe || typeof rawRecipe !== 'object') {
			withheldRecipeCount += 1
			return []
		}
		const recipe = rawRecipe as Partial<Recipe>
		if (!Array.isArray(recipe.fullIngredientList)) {
			withheldRecipeCount += 1
			return []
		}
		const ingredientNames = recipe.fullIngredientList.map(item =>
			typeof item?.name === 'string' ? item.name.trim() : '',
		)
		if (ingredientNames.length === 0 || ingredientNames.some(name => !name)) {
			withheldRecipeCount += 1
			return []
		}
		const recipeIngredients = [
			...new Map(
				ingredientNames.map(
					name => [normalizeIngredientName(name), name] as const,
				),
			).values(),
		]
		if (
			typeof recipe.id !== 'string' ||
			!recipe.id.trim() ||
			typeof recipe.title !== 'string' ||
			!recipe.title.trim() ||
			recipeIngredients.length === 0
		) {
			withheldRecipeCount += 1
			return []
		}

		const matchedIngredients = recipeIngredients.filter(name =>
			suppliedNames.has(normalizeIngredientName(name)),
		)
		if (matchedIngredients.length === 0) return []

		return [
			{
				recipeId: recipe.id.trim(),
				recipeTitle: recipe.title.trim(),
				coverImageUrl: Array.isArray(recipe.coverImageUrl)
					? (recipe.coverImageUrl.find(image => typeof image === 'string') ??
						null)
					: null,
				totalTimeMinutes:
					typeof recipe.totalTimeMinutes === 'number' &&
					Number.isFinite(recipe.totalTimeMinutes)
						? recipe.totalTimeMinutes
						: undefined,
				difficulty:
					typeof recipe.difficulty === 'string' ? recipe.difficulty : undefined,
				matchMethod: 'exact-ingredient-overlap' as const,
				inputIngredientCount: ingredients.length,
				matchedIngredients,
				missingIngredients: recipeIngredients.filter(
					name => !suppliedNames.has(normalizeIngredientName(name)),
				),
			},
		]
	})
	matches.sort(
		(a, b) =>
			b.matchedIngredients.length - a.matchedIngredients.length ||
			a.recipeTitle.localeCompare(b.recipeTitle) ||
			a.recipeId.localeCompare(b.recipeId),
	)

	return {
		matches,
		queryIngredients: ingredients,
		source: 'stored-overlap' as const,
		withheldRecipeCount,
	}
}

function normalizeIngredientName(name: string) {
	return name.trim().toLocaleLowerCase('en-US')
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

/** Analyze one dish image and return a likely dish plus visible/inferred ingredients. */
export async function analyzeDishPhoto(
	image: File,
	signal?: AbortSignal,
): Promise<FoodImageAnalysis> {
	const body = new FormData()
	body.append('image', image, image.name || 'dish-photo.jpg')
	let payload: ApiPayload<FoodImageAnalysis>
	try {
		const response = await aiApi.post<ApiPayload<FoodImageAnalysis>>(
			FOOD_IMAGE_ANALYSIS_ENDPOINT,
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
		throw new Error(payload.message || 'Food image analysis is unavailable.')
	}
	return payload.data
}

/** Extract the requested ingredient and constraints; candidates come from the KG. */
export async function parseSubstitutionIntent(
	prompt: string,
	signal?: AbortSignal,
): Promise<ParsedSubstitutionIntent> {
	let payload: ApiPayload<ParsedSubstitutionIntent>
	try {
		const response = await aiApi.post<ApiPayload<ParsedSubstitutionIntent>>(
			SUBSTITUTION_INTENT_ENDPOINT,
			{ prompt },
			{ signal },
		)
		payload = response.data
	} catch (error) {
		throw new Error(getUserFriendlyMessage(error))
	}
	if (!payload.success || !payload.data) {
		throw new Error(
			payload.message || 'Could not understand the substitution request.',
		)
	}
	return payload.data
}
