import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('pantry recipe suggestion disclosure', () => {
	it('shows further API matches in bounded batches with a collapse path', () => {
		const page = readFileSync(
			join(process.cwd(), 'src/app/(main)/pantry/page.tsx'),
			'utf8',
		)
		const normalizedPage = page.replace(/\s+/g, ' ')
		const messages = JSON.parse(
			readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'),
		)

		expect(normalizedPage).toContain(
			'matchedRecipes .slice(0, visibleSuggestionCount)',
		)
		expect(normalizedPage).toContain(
			'matchedRecipes.length - visibleSuggestionCount',
		)
		expect(normalizedPage).toContain(
			'setVisibleSuggestionCount(PANTRY_SUGGESTION_PAGE_SIZE)',
		)
		expect(normalizedPage).toContain("aria-controls='pantry-recipe-match-list'")
		expect(messages.pantry.showMoreRecipes).toBe('Show {count} more recipes')
		expect(messages.pantry.showFewerRecipes).toBe('Show fewer recipes')
	})
})
