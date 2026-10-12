import fs from 'fs'
import path from 'path'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('learning path cooking entry contract', () => {
	it('starts cooking through the recipe route contract', () => {
		const learningPath = readSource(
			'src/components/collections/LearningPathView.tsx',
		)
		const recipeDetail = readSource('src/app/(main)/recipes/[id]/page.tsx')

		expect(learningPath).toContain(
			'router.push(`/recipes/${recipeId}?cook=true`)',
		)
		expect(learningPath).not.toContain('router.push(`/recipes/${recipeId}`)')
		expect(recipeDetail).toContain("searchParams?.get('cook') === 'true'")
	})
})
