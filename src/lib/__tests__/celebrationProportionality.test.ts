import fs from 'node:fs'
import path from 'node:path'

const read = (file: string) =>
	fs.readFileSync(path.join(process.cwd(), file), 'utf8')

describe('celebration proportionality contract', () => {
	it('does not celebrate routine or reversible actions with confetti', () => {
		const routineSurfaces = [
			'src/components/social/PostCard.tsx',
			'src/app/(main)/explore/ExploreClient.tsx',
			'src/app/(main)/search/page.tsx',
			'src/app/(main)/recipes/[id]/page.tsx',
			'src/components/cooking/CookingPlayer.tsx',
		]
			.map(read)
			.join('\n')

		expect(routineSurfaces).not.toMatch(
			/trigger(?:Like|Save|ProgressMilestone)Confetti/,
		)
	})

	it('keeps meaningful achievement and completion celebrations', () => {
		const confetti = read('src/lib/confetti.ts')

		expect(confetti).not.toMatch(
			/export const trigger(?:Like|Save|ProgressMilestone)Confetti/,
		)
		for (const trigger of [
			'triggerMutualFollowConfetti',
			'triggerAchievementConfetti',
			'triggerRecipeCompleteConfetti',
			'triggerSuccessConfetti',
		]) {
			expect(confetti).toContain(`export const ${trigger}`)
		}
	})

	it('names the mutual-connection effect explicitly', () => {
		const followSuggestion = read(
			'src/components/social/FollowSuggestionCard.tsx',
		)

		expect(followSuggestion).toContain('triggerMutualFollowConfetti()')
		expect(followSuggestion).not.toContain('triggerLikeConfetti')
	})
})
