import fs from 'fs'
import path from 'path'

import { toPostSearchResult, toRecipeSearchResult } from '@/lib/search-result'
import type { PostSearchDoc, RecipeSearchDoc } from '@/lib/types/search'

const read = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

const sparseRecipe: RecipeSearchDoc = {
	id: 'recipe-1',
	title: 'Weeknight noodles',
	description: '',
	cuisine: '',
	difficulty: '',
	totalTime: 0,
	cookCount: 0,
	avgRating: 0,
	ingredients: [],
	tags: [],
	authorId: 'user-1',
	authorName: '',
	authorAvatarUrl: '',
	coverImageUrl: '',
	createdAt: 0,
	xpReward: 0,
}

const sparsePost: PostSearchDoc = {
	id: 'post-1',
	content: '',
	authorId: 'user-1',
	authorName: '',
	authorAvatarUrl: '',
	recipeTitle: '',
	likeCount: 0,
	commentCount: 0,
	photoUrl: '',
}

describe('truthful search result mapping', () => {
	it('does not invent sparse recipe or post proof', () => {
		expect(toRecipeSearchResult(sparseRecipe)).toEqual(
			expect.objectContaining({
				description: undefined,
				author: undefined,
				rating: undefined,
				cookTimeMinutes: undefined,
				difficulty: undefined,
				cookCount: 0,
			}),
		)
		expect(toPostSearchResult(sparsePost)).toEqual(
			expect.objectContaining({
				author: undefined,
				imageUrl: undefined,
				likeCount: 0,
			}),
		)
	})

	it('preserves authoritative identity, media, duration, and proof', () => {
		expect(
			toRecipeSearchResult({
				...sparseRecipe,
				difficulty: 'Beginner',
				totalTime: 25,
				cookCount: 12,
				avgRating: 4.8,
				authorName: 'Minh Tran',
				authorAvatarUrl: '/avatars/minh.webp',
			}),
		).toEqual(
			expect.objectContaining({
				author: {
					id: 'user-1',
					name: 'Minh Tran',
					avatarUrl: '/avatars/minh.webp',
				},
				rating: 4.8,
				cookTimeMinutes: 25,
				cookCount: 12,
			}),
		)

		expect(
			toPostSearchResult({
				...sparsePost,
				content: 'Crispy edges',
				authorName: 'Lan Nguyen',
				authorAvatarUrl: '/avatars/lan.webp',
				photoUrl: '/posts/banh-xeo.webp',
				likeCount: 3,
			}),
		).toEqual({
			id: 'post-1',
			imageUrl: '/posts/banh-xeo.webp',
			caption: 'Crispy edges',
			recipeTitle: undefined,
			author: {
				id: 'user-1',
				name: 'Lan Nguyen',
				avatarUrl: '/avatars/lan.webp',
			},
			likeCount: 3,
		})
	})

	it('keeps Explore on the canonical sparse mapping contract', () => {
		const source = read('src/app/(main)/explore/ExploreClient.tsx')

		expect(source).toContain('toRecipeSearchResult(doc)')
		expect(source).not.toContain('mapRecipeDocToRecipe')
		expect(source).not.toContain('prepTimeMinutes: 0')
		expect(source).not.toContain("recipeStatus: 'PUBLISHED'")
		expect(source).not.toContain('isSaved: false')
		expect(source).toContain('isSaved={savedRecipes.has(recipe.id)}')
	})

	it('keeps fabricated fallbacks and hardcoded metric copy out of Search', () => {
		const source = read('src/app/(main)/search/page.tsx')

		expect(source).not.toContain("doc.authorName || 'chef'")
		expect(source).not.toContain("doc.authorName || 'user'")
		expect(source).not.toContain('${doc.totalTime || 0} min')
		expect(source).not.toContain('{post.likeCount} likes')
		expect(source).not.toContain('{formattedCookCount} cooks')
		expect(source).toContain("t('minutes'")
		expect(source).toContain("t('cookUnit'")
		expect(source).toContain("t('likeUnit'")
	})
})
