import fs from 'node:fs'
import path from 'node:path'

describe('learning-path XP truth', () => {
	const view = fs.readFileSync(
		path.join(process.cwd(), 'src/components/collections/LearningPathView.tsx'),
		'utf8',
	)
	const builder = fs.readFileSync(
		path.join(
			process.cwd(),
			'src/components/collections/CollectionBuilder.tsx',
		),
		'utf8',
	)
	const messages = fs.readFileSync(
		path.join(process.cwd(), 'messages/en.json'),
		'utf8',
	)

	it('frames the flat per-recipe heuristic as an estimate everywhere', () => {
		expect(builder).toContain('const totalXp = totalRecipes * 50')
		expect(builder).toContain("t('builderTotalXp')")
		expect(messages).toContain('"builderTotalXp": "Estimated XP"')
		expect(view).toContain("t('learningPathEstimatedXp', {")
		expect(messages).toContain('"learningPathEstimatedXp": "About {xp} XP"')
		expect(view).not.toContain('{collection.totalXp.toLocaleString()} XP')
	})
})
