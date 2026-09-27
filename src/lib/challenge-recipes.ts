import { PATHS } from '@/constants'
import { safeRecipeImageSrc } from '@/lib/imageSafety'
import type { ChallengeMatchingRecipe } from '@/services/challenge'

export interface ChallengeBannerRecipe {
	id: string
	title: string
	imageUrl: string
}

export const toChallengeBannerRecipes = (
	matches: ChallengeMatchingRecipe[] | null | undefined,
): ChallengeBannerRecipe[] => {
	const knownIds = new Set<string>()

	return (matches ?? []).flatMap(match => {
		const id = typeof match?.id === 'string' ? match.id.trim() : ''
		const title = typeof match?.title === 'string' ? match.title.trim() : ''
		if (!id || !title || knownIds.has(id)) return []

		knownIds.add(id)
		const imageCandidate = Array.isArray(match.coverImageUrl)
			? match.coverImageUrl.find(value => typeof value === 'string' && value)
			: undefined

		return [
			{
				id,
				title,
				imageUrl: safeRecipeImageSrc(imageCandidate),
			},
		]
	})
}

export const getChallengeRecipeDestination = (
	matches: Array<{ id?: string | null }> | null | undefined,
	fallbackQuery: string,
): string => {
	const firstValidId = matches?.find(
		match => typeof match.id === 'string' && match.id.trim().length > 0,
	)?.id

	return typeof firstValidId === 'string'
		? `/recipes/${encodeURIComponent(firstValidId.trim())}`
		: PATHS.EXPLORE_SEARCH(fallbackQuery)
}
