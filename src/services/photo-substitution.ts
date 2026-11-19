import type { ApiResponse } from '@/lib/types/common'
import type {
	FoodImageAnalysis,
	ParsedSubstitutionIntent,
	PhotoSubstitutionRequest,
	PhotoSubstitutionResult,
} from '@/lib/types/photo-intelligence'
import { aiApi } from '@/lib/axios'
import { getUserFriendlyMessage } from '@/lib/error-utils'

const PHOTO_SUBSTITUTIONS_ENDPOINT =
	'/api/photo-intelligence/photo-substitutions'

/** Ask the public culinary API to validate and resolve KG edges for this photo. */
export async function findPhotoDishSubstitutions(
	analysis: FoodImageAnalysis,
	intent: ParsedSubstitutionIntent,
): Promise<PhotoSubstitutionResult> {
	if (!intent.ingredientToReplace) {
		throw new Error('Name one ingredient to replace.')
	}

	const request: PhotoSubstitutionRequest = {
		ingredientToReplace: intent.ingredientToReplace,
		dishName: analysis.dishName ?? '',
		dishIngredients: analysis.ingredients.map(ingredient => ingredient.name),
		allergenConstraints: intent.allergenConstraints,
		dietaryConstraints: intent.dietaryConstraints,
	}
	try {
		const response = await aiApi.post<ApiResponse<PhotoSubstitutionResult>>(
			PHOTO_SUBSTITUTIONS_ENDPOINT,
			request,
		)
		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.message || 'Knowledge graph lookup failed.')
		}
		return response.data.data
	} catch (error) {
		throw new Error(getUserFriendlyMessage(error))
	}
}
