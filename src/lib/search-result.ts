import { difficultyToDisplay, type DifficultyDisplay } from '@/lib/apiUtils'
import type { PostSearchDoc, RecipeSearchDoc } from '@/lib/types/search'

interface SearchAuthor {
	name: string
	avatarUrl?: string
}

export interface RecipeSearchResult {
	id: string
	title: string
	imageUrl: string
	rating?: number
	cookTimeMinutes?: number
	difficulty?: DifficultyDisplay
	author?: SearchAuthor
	cookCount: number
	isSaved?: boolean
}

export interface PostSearchResult {
	id: string
	imageUrl?: string
	caption: string
	recipeTitle?: string
	author?: SearchAuthor
	likeCount: number
}

function optionalText(value: string | null | undefined): string | undefined {
	const normalized = value?.trim()
	return normalized ? normalized : undefined
}

function toAuthor(
	name: string | null | undefined,
	avatarUrl: string | null | undefined,
): SearchAuthor | undefined {
	const normalizedName = optionalText(name)
	if (!normalizedName) return undefined

	return {
		name: normalizedName,
		avatarUrl: optionalText(avatarUrl),
	}
}

export function toRecipeSearchResult(doc: RecipeSearchDoc): RecipeSearchResult {
	const difficulty = optionalText(doc.difficulty)

	return {
		id: doc.id,
		title: doc.title,
		imageUrl: optionalText(doc.coverImageUrl) ?? '/placeholder-recipe.svg',
		rating: doc.avgRating > 0 ? doc.avgRating : undefined,
		cookTimeMinutes: doc.totalTime > 0 ? doc.totalTime : undefined,
		difficulty: difficulty
			? difficultyToDisplay(
					difficulty as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
				)
			: undefined,
		author: toAuthor(doc.authorName, doc.authorAvatarUrl),
		cookCount: Math.max(0, doc.cookCount || 0),
	}
}

export function toPostSearchResult(doc: PostSearchDoc): PostSearchResult {
	return {
		id: doc.id,
		imageUrl: optionalText(doc.photoUrl),
		caption: optionalText(doc.content) ?? '',
		recipeTitle: optionalText(doc.recipeTitle),
		author: toAuthor(doc.authorName, doc.authorAvatarUrl),
		likeCount: Math.max(0, doc.likeCount || 0),
	}
}
