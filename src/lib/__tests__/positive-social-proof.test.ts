import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	formatPositiveSocialCount,
	isPositiveSocialMetric,
} from '@/lib/positive-social-proof'

describe('positive recipe social proof', () => {
	it.each([undefined, null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
		'suppresses non-positive or invalid metric %s',
		value => {
			expect(isPositiveSocialMetric(value)).toBe(false)
			expect(formatPositiveSocialCount(value)).toBeNull()
		},
	)

	it.each([
		[1, '1'],
		[999, '999'],
		[1000, '1.0k'],
		[1540, '1.5k'],
	])('formats positive count %s as %s', (value, expected) => {
		expect(isPositiveSocialMetric(value)).toBe(true)
		expect(formatPositiveSocialCount(value)).toBe(expected)
	})

	it('applies the shared rule across promotional discovery and feed owners', () => {
		const owners = [
			'src/app/(main)/explore/ExploreClient.tsx',
			'src/app/(main)/search/page.tsx',
			'src/components/challenges/ChallengeRecipeGrid.tsx',
			'src/components/recipe/RecipeReviews.tsx',
			'src/components/recipe/RecipeCardEnhanced.tsx',
			'src/components/social/PostCard.tsx',
		]

		for (const owner of owners) {
			const source = readFileSync(join(process.cwd(), owner), 'utf8')
			expect(source).toContain("from '@/lib/positive-social-proof'")
		}

		const recipeCard = readFileSync(
			join(process.cwd(), 'src/components/recipe/RecipeCardEnhanced.tsx'),
			'utf8',
		)
		expect(recipeCard).not.toContain('cookCount / 1000')
		expect(recipeCard.match(/formattedCookCount &&/g)).toHaveLength(3)
	})
})
