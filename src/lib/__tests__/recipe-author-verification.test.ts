import fs from 'fs'
import path from 'path'

import { toRecipeSearchResult } from '@/lib/search-result'
import type { RecipeSearchDoc } from '@/lib/types/search'

const read = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

const verifiedRecipe: RecipeSearchDoc = {
	id: 'recipe-verified',
	title: 'Banh xeo',
	description: 'Crisp Vietnamese crepes',
	cuisine: 'Vietnamese',
	difficulty: 'Intermediate',
	totalTime: 40,
	cookCount: 14,
	avgRating: 4.8,
	ingredients: ['rice flour'],
	tags: [],
	authorId: 'creator-1',
	authorName: 'Minh Tran',
	authorAvatarUrl: '/avatars/minh.webp',
	authorVerified: true,
	coverImageUrl: '/recipes/banh-xeo.webp',
	createdAt: 1_700_000_000,
	xpReward: 180,
}

describe('recipe author verification truth', () => {
	it('preserves authoritative verification from a search document', () => {
		expect(toRecipeSearchResult(verifiedRecipe).author).toEqual({
			id: 'creator-1',
			name: 'Minh Tran',
			avatarUrl: '/avatars/minh.webp',
			isVerified: true,
		})
	})

	it('keeps missing verification unknown instead of manufacturing a badge', () => {
		const result = toRecipeSearchResult({
			...verifiedRecipe,
			authorVerified: undefined,
		})

		expect(result.author).not.toHaveProperty('isVerified')
	})

	it('uses recipe identity data across Explore and collection cards', () => {
		const explore = read('src/app/(main)/explore/ExploreClient.tsx')
		const collection = read(
			'src/app/(main)/collections/[collectionId]/page.tsx',
		)

		expect(explore).not.toContain('isVerified: false')
		expect(collection).not.toContain('isVerified: false')
		expect(explore).toContain('recipe.author.isVerified')
		expect(collection).toContain('recipe.author.isVerified')
	})

	it('consumes typed verification for people search without a cast', () => {
		const search = read('src/app/(main)/search/page.tsx')

		expect(search).toContain('isVerified: doc.isVerified')
		expect(search).not.toContain("UserSearchDoc & { isVerified?: boolean }")
	})
})
