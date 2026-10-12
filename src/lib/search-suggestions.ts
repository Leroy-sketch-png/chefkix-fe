import type { UnifiedSearchResponse } from '@/lib/types/search'

export function getSearchSuggestionLabels(
	data: UnifiedSearchResponse | undefined,
	query: string,
	limit = 6,
): string[] {
	if (!data || limit <= 0) return []

	const normalizedQuery = query.trim().toLocaleLowerCase()
	const candidates = [
		...(data.recipes?.hits.map(hit => hit.document.title) ?? []),
		...(data.users?.hits.flatMap(hit => [
			hit.document.displayName,
			hit.document.username,
		]) ?? []),
		...(data.posts?.hits.map(hit => hit.document.recipeTitle) ?? []),
	]
	const seen = new Set<string>()

	return candidates
		.map(candidate => candidate?.trim())
		.filter((candidate): candidate is string => Boolean(candidate))
		.filter(candidate => {
			const normalized = candidate.toLocaleLowerCase()
			if (normalized === normalizedQuery || seen.has(normalized)) return false
			seen.add(normalized)
			return true
		})
		.slice(0, limit)
}
