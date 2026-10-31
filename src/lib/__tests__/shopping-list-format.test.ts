import {
	formatShoppingListCopyLine,
	formatShoppingListQuantity,
} from '@/lib/shopping-list-format'

describe('shopping-list formatting', () => {
	it('keeps units with quantities and handles missing values', () => {
		expect(formatShoppingListQuantity('200', 'g')).toBe('200 g')
		expect(formatShoppingListQuantity('2 cups', null)).toBe('2 cups')
		expect(formatShoppingListQuantity(null, 'pieces')).toBe('pieces')
		expect(formatShoppingListQuantity(null, null)).toBe('')
	})

	it('includes units in copied checklist lines', () => {
		expect(
			formatShoppingListCopyLine({
				checked: false,
				ingredient: 'Panko breadcrumbs',
				quantity: '200',
				unit: 'g',
			}),
		).toBe('○ Panko breadcrumbs (200 g)')
	})
})
