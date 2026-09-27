import fs from 'node:fs'
import path from 'node:path'
import {
	getChallengeRecipeDestination,
	toChallengeBannerRecipes,
} from '@/lib/challenge-recipes'
import type { ChallengeMatchingRecipe } from '@/services/challenge'

const match = (
	overrides: Partial<ChallengeMatchingRecipe> = {},
): ChallengeMatchingRecipe => ({
	id: 'recipe-1',
	title: 'Weeknight noodles',
	xpReward: 80,
	coverImageUrl: ['/noodles.jpg'],
	...overrides,
})

describe('curated challenge recipe conversion', () => {
	it('maps every unique valid match and uses the image safety fallback', () => {
		expect(
			toChallengeBannerRecipes([
				match(),
				match({ id: 'recipe-2', title: 'Quick dal', coverImageUrl: [] }),
				match({ id: 'recipe-2', title: 'Duplicate dal' }),
				match({ id: ' ', title: 'Missing identity' }),
			]),
		).toEqual([
			{
				id: 'recipe-1',
				title: 'Weeknight noodles',
				imageUrl: '/noodles.jpg',
			},
			{
				id: 'recipe-2',
				title: 'Quick dal',
				imageUrl: '/placeholder-recipe.svg',
			},
		])
	})

	it('opens the first valid curated recipe instead of searching challenge copy', () => {
		expect(
			getChallengeRecipeDestination(
				[{ id: '' }, { id: 'recipe/with space' }],
				'Cook under 30 minutes',
			),
		).toBe('/recipes/recipe%2Fwith%20space')
	})

	it('falls back to encoded Explore search when no curated recipe is usable', () => {
		expect(getChallengeRecipeDestination([], 'Cook under 30 minutes')).toBe(
			'/explore?q=Cook%20under%2030%20minutes',
		)
	})

	it('keeps page, sidebar, and banner on the shared curated-match authority', () => {
		const read = (relativePath: string) =>
			fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
		const page = read('src/app/(main)/challenges/page.tsx')
		const sidebar = read('src/components/layout/RightSidebar.tsx')
		const banner = read('src/components/challenges/DailyChallengeBanner.tsx')

		expect(page.match(/toChallengeBannerRecipes\(/g)).toHaveLength(1)
		expect(page.match(/getChallengeRecipeDestination\(/g)).toHaveLength(2)
		expect(sidebar.match(/toChallengeBannerRecipes\(/g)).toHaveLength(1)
		expect(sidebar.match(/getChallengeRecipeDestination\(/g)).toHaveLength(1)
		expect(banner).toContain('challenge.matchingRecipes.map(recipe =>')
		expect(banner).not.toContain('matchingRecipes.slice(0, 2)')
		expect(banner).not.toContain('PATHS.EXPLORE_SEARCH(challenge.title)')
	})
})
