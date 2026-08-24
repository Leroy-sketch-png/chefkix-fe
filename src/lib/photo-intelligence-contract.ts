import type { PhotoRecipeMatch } from '@/lib/types/photo-intelligence'

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === 'object' ? (value as Record<string, unknown>) : null

const asString = (value: unknown, fallback = '') =>
	typeof value === 'string' ? value : fallback

const asStringArray = (value: unknown) =>
	Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: []

const asScore = (value: unknown) => {
	if (typeof value !== 'number' || !Number.isFinite(value)) return 0
	return Math.max(0, Math.min(1, value > 1 ? value / 100 : value))
}

/** Accepts the likely HGAT/CLIP naming variants and emits one FE contract. */
export function normalizePhotoRecipeMatches(
	payload: unknown,
): PhotoRecipeMatch[] | null {
	const root = asRecord(payload)
	const data = asRecord(root?.data) ?? root
	const rawMatches = data?.matches ?? data?.results ?? data?.recipes
	if (!Array.isArray(rawMatches)) return null

	return rawMatches.flatMap(rawMatch => {
		const match = asRecord(rawMatch)
		if (!match) return []
		const recipe = asRecord(match.recipe)
		const recipeId = asString(
			match.recipeId ?? match.recipe_id ?? recipe?.id ?? match.id,
		)
		const recipeTitle = asString(
			match.recipeTitle ?? match.recipe_title ?? recipe?.title ?? match.title,
		)
		if (!recipeId || !recipeTitle) return []

		return [
			{
				recipeId,
				recipeTitle,
				coverImageUrl:
					asString(
						match.coverImageUrl ??
							match.cover_image_url ??
							recipe?.coverImageUrl,
					) || null,
				totalTimeMinutes:
					typeof match.totalTimeMinutes === 'number'
						? match.totalTimeMinutes
						: typeof match.total_time_minutes === 'number'
							? match.total_time_minutes
							: undefined,
				difficulty: asString(match.difficulty) || undefined,
				matchScore: asScore(
					match.matchScore ?? match.match_score ?? match.score,
				),
				matchedIngredients: asStringArray(
					match.matchedIngredients ?? match.matched_ingredients,
				),
				missingIngredients: asStringArray(
					match.missingIngredients ?? match.missing_ingredients,
				),
			},
		]
	})
}
