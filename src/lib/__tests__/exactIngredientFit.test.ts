import { getExactIngredientFit } from '@/lib/exactIngredientFit'

describe('getExactIngredientFit', () => {
	it('matches exact names case-insensitively and keeps the recipe wording', () => {
		expect(
			getExactIngredientFit([' garlic ', 'EGGS'], ['Garlic', 'Eggs', 'Oil']),
		).toEqual({
			provided: ['garlic', 'EGGS'],
			matched: ['Garlic', 'Eggs'],
			missing: ['Oil'],
		})
	})

	it('does not turn similar ingredient names into a match', () => {
		expect(getExactIngredientFit(['rice'], ['Day-old rice', 'Oil'])).toEqual({
			provided: ['rice'],
			matched: [],
			missing: ['Day-old rice', 'Oil'],
		})
	})

	it('deduplicates names without changing the input order', () => {
		expect(
			getExactIngredientFit(['Rice', 'rice', 'Eggs'], ['Eggs', 'eggs', 'Oil']),
		).toEqual({
			provided: ['Rice', 'Eggs'],
			matched: ['eggs'],
			missing: ['Oil'],
		})
	})

	it('keeps every recipe ingredient in the missing list when nothing matches', () => {
		expect(getExactIngredientFit(['Tofu'], ['Rice', 'Oil'])).toEqual({
			provided: ['Tofu'],
			matched: [],
			missing: ['Rice', 'Oil'],
		})
	})
})
