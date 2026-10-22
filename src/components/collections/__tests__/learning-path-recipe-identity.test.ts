import fs from 'fs'
import path from 'path'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('learning path recipe identity contract', () => {
	it('keeps real recipe names and never presents internal ID fragments', () => {
		const builder = readSource(
			'src/components/collections/CollectionBuilder.tsx',
		)
		const messages = readSource('messages/en.json')

		expect(builder).toContain('getRecipeById')
		expect(builder).toContain('setRecipeNames')
		expect(builder).toContain('[recipeId]: option.label')
		expect(builder).toContain('recipeNames={recipeNames}')
		expect(builder).toContain('recipeNames[recipeId] ||')
		expect(builder).toContain("t('builderRecipeFallback', { index: idx + 1 })")
		expect(builder).not.toContain('recipeId.slice(0, 8)')
		expect(messages).toContain('"builderRecipeFallback": "Recipe {index}"')
	})
})
