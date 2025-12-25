import { Difficulty } from './types/recipe'

export interface PaginationInput {
	limit?: number
	offset?: number
	page?: number
	size?: number
}

/**
 * Map frontend pagination params (limit/offset or page/limit) to backend pagination (page/size).
 * Rules:
 * - If `size` is provided, use it; otherwise use `limit`.
 * - If `page` is provided, use it as-is. If `offset`+`limit` are provided, compute page = offset/limit.
 * - This function prefers explicit `page` and `size` when present.
 */
export function toBackendPagination(params?: PaginationInput) {
	if (!params) return undefined

	const out: { page?: number; size?: number } = {}

	if (params.size !== undefined) {
		out.size = params.size
	} else if (params.limit !== undefined) {
		out.size = params.limit
	}

	if (params.page !== undefined) {
		out.page = params.page
	} else if (
		params.offset !== undefined &&
		out.size !== undefined &&
		out.size > 0
	) {
		out.page = Math.floor(params.offset / out.size)
	}

	// If nothing mapped, return undefined to avoid sending empty params
	return Object.keys(out).length > 0 ? out : undefined
}

// ============================================
// DIFFICULTY MAPPING UTILITIES
// ============================================

/**
 * Display value type for UI components (user-friendly)
 */
export type DifficultyDisplay = 'Easy' | 'Medium' | 'Hard' | 'Expert'

/**
 * Map API difficulty value to display value
 * API: 'Beginner' → Display: 'Easy'
 * BE sends PascalCase: "Beginner", "Intermediate", "Advanced", "Expert"
 */
export function difficultyToDisplay(
	apiValue: Difficulty | string,
): DifficultyDisplay {
	const map: Record<string, DifficultyDisplay> = {
		Beginner: 'Easy',
		Intermediate: 'Medium',
		Advanced: 'Hard',
		Expert: 'Expert',
		// Backwards compat for any legacy data
		BEGINNER: 'Easy',
		INTERMEDIATE: 'Medium',
		ADVANCED: 'Hard',
		EXPERT: 'Expert',
	}
	return map[apiValue] || 'Medium'
}

/**
 * Map display difficulty value to API value
 * Display: 'Easy' → API: 'Beginner'
 * BE expects PascalCase: "Beginner", "Intermediate", "Advanced", "Expert"
 */
export function difficultyToApi(
	displayValue: DifficultyDisplay | string,
): Difficulty {
	const map: Record<string, Difficulty> = {
		Easy: 'Beginner',
		easy: 'Beginner',
		Medium: 'Intermediate',
		medium: 'Intermediate',
		Hard: 'Advanced',
		hard: 'Advanced',
		Expert: 'Expert',
		expert: 'Expert',
	}
	return map[displayValue] || 'Intermediate'
}

// ============================================
// RECIPE QUERY PARAM MAPPING
// ============================================

/**
 * Map frontend recipe query params to backend param names.
 *
 * FE → BE mappings:
 * - search → query (text search)
 * - maxTime → maxTimeMinutes (time filter)
 * - limit → size (pagination)
 *
 * @see RecipeSearchQuery.java in recipe-service
 */
export function toBackendRecipeParams(params?: Record<string, unknown>) {
	if (!params) return undefined

	const mapped: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue

		switch (key) {
			// Text search: FE uses 'search', BE expects 'query'
			case 'search':
				mapped['query'] = value
				break
			// Time filter: FE may use 'maxTime', BE expects 'maxTimeMinutes'
			case 'maxTime':
				mapped['maxTimeMinutes'] = value
				break
			// Pagination: FE may use 'limit', BE expects 'size'
			case 'limit':
				mapped['size'] = value
				break
			// Pass through other params unchanged
			default:
				mapped[key] = value
		}
	}

	return Object.keys(mapped).length > 0 ? mapped : undefined
}
