import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

const creatorSources = [
	'src/components/recipe/RecipeFormDetailed.tsx',
	'src/components/recipe/RecipeCreateAiFlow.tsx',
	'src/app/(main)/recipes/[id]/page.tsx',
].map(readSource)

const messages = JSON.parse(readSource('messages/en.json')) as {
	create: Record<string, string>
	recipe: Record<string, string>
	recipeDetail: Record<string, string>
	cooking: Record<string, string>
}

describe('creator cooking preview command', () => {
	it('uses one professional command and familiar icon across creator surfaces', () => {
		for (const source of creatorSources) {
			expect(source).toContain("t('previewCooking')")
			expect(source).toContain('startPreviewCooking')
			expect(source).toContain('expandCookingPanel')
			expect(source).toContain('<Play')
			expect(source).not.toContain('<Rocket')
		}

		expect(messages.recipe.previewCooking).toBe('Preview cooking')
		expect(messages.recipeDetail.previewCooking).toBe('Preview cooking')
	})

	it('removes superseded QA labels while preserving preview truth', () => {
		for (const key of [
			'formTestPlay',
			'aiFlowTestPlay',
			'testCook',
			'testCookPreview',
		]) {
			expect(messages.recipe[key]).toBeUndefined()
			expect(messages.recipeDetail[key]).toBeUndefined()
		}

		expect(messages.create.previewRecipe).toBe('Preview')
		expect(messages.cooking.previewMode).toBe('Preview Mode')
		expect(messages.cooking.previewModeDesc).toBe(
			'No XP or progress will be saved',
		)
	})
})
