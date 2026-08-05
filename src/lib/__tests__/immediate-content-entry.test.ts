import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

const tasteSource = readSource('src/app/(main)/profile/taste/page.tsx')
const recipeSource = readSource('src/app/(main)/recipes/[id]/page.tsx')
const [loadedRecipeSource, recipeSkeletonSource] = recipeSource.split(
	'function RecipeDetailSkeleton()',
)
const socialProofSource = readSource('src/components/recipe/SocialProof.tsx')
const reviewsSource = readSource('src/components/recipe/RecipeReviews.tsx')
const leaderboardSource = readSource(
	'src/components/leaderboard/LeaderboardPodium.tsx',
)
const celebrationSource = readSource(
	'src/components/completion/FirstCookCelebration.tsx',
)

describe('immediate content entry authority', () => {
	it('does not delay loaded taste or recipe content', () => {
		expect(loadedRecipeSource).toBeDefined()
		expect(recipeSkeletonSource).toBeDefined()

		for (const source of [
			tasteSource,
			loadedRecipeSource,
			socialProofSource,
			reviewsSource,
		]) {
			expect(source).not.toMatch(/delay\s*:/)
		}
	})

	it('preserves motion duration and separate theatrical lifecycles', () => {
		expect(tasteSource).toContain('duration: DURATION_S.slow')
		expect(recipeSkeletonSource).toMatch(/delay\s*:/)
		expect(leaderboardSource).toContain('transition={{ delay: 0.8')
		expect(celebrationSource).toMatch(/delay\s*:/)
	})
})
