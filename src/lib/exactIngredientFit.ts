export interface ExactIngredientFit {
	provided: string[]
	matched: string[]
	missing: string[]
}

/** Mirrors the stored-recipe fallback: trimmed, case-folded exact names only. */
export function getExactIngredientFit(
	providedIngredients: string[],
	recipeIngredients: string[],
): ExactIngredientFit {
	const provided = uniqueInputNames(providedIngredients)
	const providedKeys = new Set(provided.map(normalizeName))
	const recipeNames = uniqueRecipeNames(recipeIngredients)
	const matched = recipeNames.filter(name =>
		providedKeys.has(normalizeName(name)),
	)
	const matchedKeys = new Set(matched.map(normalizeName))

	return {
		provided,
		matched,
		missing: recipeNames.filter(name => !matchedKeys.has(normalizeName(name))),
	}
}

function uniqueInputNames(names: string[]) {
	const seen = new Set<string>()
	return names.flatMap(name => {
		if (typeof name !== 'string') return []
		const cleaned = name.trim()
		if (!cleaned) return []
		const key = normalizeName(cleaned)
		if (seen.has(key)) return []
		seen.add(key)
		return [cleaned]
	})
}

function uniqueRecipeNames(names: string[]) {
	const unique = new Map<string, string>()
	for (const name of names) {
		if (typeof name !== 'string') continue
		const cleaned = name.trim()
		if (!cleaned) continue
		const key = normalizeName(cleaned)
		unique.set(key, cleaned)
	}
	return [...unique.values()]
}

function normalizeName(name: string) {
	return name.trim().toLocaleLowerCase('en-US')
}
