import {
	EU14_ALLERGENS,
	FDA_TOP_9_ALLERGENS,
	normalizeAllergenFlags,
} from '@/lib/allergen-profile'

describe('allergen profile catalog', () => {
	it('contains the complete EU 14 and FDA Top 9 sets', () => {
		expect(EU14_ALLERGENS).toHaveLength(14)
		expect(FDA_TOP_9_ALLERGENS).toHaveLength(9)
	})

	it('migrates legacy settings values and removes duplicates', () => {
		expect(
			normalizeAllergenFlags(['nuts', 'tree_nuts', 'dairy', 'milk', '']),
		).toEqual(['tree_nuts', 'milk'])
	})
})
