import {
	shoppingListIdFromSearch,
	shoppingListPath,
} from '@/lib/shopping-list-route'

describe('shopping list route contract', () => {
	it('builds an encoded exact-list destination', () => {
		expect(shoppingListPath('list / family')).toBe(
			'/shopping-lists?list=list%20%2F%20family',
		)
	})

	it('keeps the index as the default destination', () => {
		expect(shoppingListPath()).toBe('/shopping-lists')
		expect(shoppingListPath('')).toBe('/shopping-lists')
	})

	it('parses only a non-empty list selector', () => {
		expect(shoppingListIdFromSearch('?list=list-1')).toBe('list-1')
		expect(shoppingListIdFromSearch('?list=%20%20')).toBeNull()
		expect(shoppingListIdFromSearch('?other=value')).toBeNull()
	})
})
