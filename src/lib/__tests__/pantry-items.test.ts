import type { PantryItem } from '@/lib/types/pantry'
import { reconcilePantryItems } from '@/lib/pantry-items'

const pantryItem = (
	id: string,
	quantity: number,
	category = 'produce',
): PantryItem => ({
	id,
	ingredientName: id,
	normalizedName: id,
	quantity,
	unit: 'item',
	category,
	expiryDate: null,
	addedDate: '2026-08-11',
	freshness: 'fresh',
})

describe('reconcilePantryItems', () => {
	it('replaces an existing item by ID without duplicating or moving its row', () => {
		const current = [pantryItem('tomato', 1), pantryItem('onion', 2)]
		const mergedTomato = pantryItem('tomato', 3)

		expect(reconcilePantryItems(current, mergedTomato)).toEqual([
			mergedTomato,
			current[1],
		])
	})

	it('prepends genuinely new items', () => {
		const current = [pantryItem('tomato', 1)]
		const newItem = pantryItem('onion', 2)

		expect(reconcilePantryItems(current, newItem)).toEqual([
			newItem,
			current[0],
		])
	})

	it('collapses duplicate IDs and keeps the final authoritative bulk response', () => {
		const stale = pantryItem('tomato', 1)
		const intermediate = pantryItem('tomato', 2)
		const final = pantryItem('tomato', 4)

		expect(reconcilePantryItems([stale, stale], [intermediate, final])).toEqual(
			[final],
		)
	})

	it('keeps a category-filtered slice consistent after a mutation', () => {
		const produce = pantryItem('tomato', 1)
		const dairy = pantryItem('milk', 1, 'dairy')

		expect(reconcilePantryItems([produce], dairy, 'produce')).toEqual([produce])
	})
})
