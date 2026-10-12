import type { PantryItem } from '@/lib/types/pantry'
import { getPantryCounts, getVisiblePantryItems } from '@/lib/pantry-view'

const pantryItem = (
	id: string,
	category: string,
	freshness: PantryItem['freshness'],
): PantryItem => ({
	id,
	ingredientName: id,
	normalizedName: id.toLocaleLowerCase(),
	quantity: 1,
	unit: 'item',
	category,
	expiryDate: null,
	addedDate: '2026-09-22',
	freshness,
})

const items = [
	pantryItem('Tomato', 'produce', 'expiring_soon'),
	pantryItem('Milk', 'dairy', 'expired'),
	pantryItem('Paprika', 'spices', 'fresh'),
]

describe('pantry view derivation', () => {
	it('keeps whole-pantry counts independent of the visible category', () => {
		expect(getPantryCounts(items)).toEqual({
			total: 3,
			expired: 1,
			expiringSoon: 1,
		})
		expect(getVisiblePantryItems(items, 'spices', '')).toEqual([items[2]])
	})

	it('combines category and trimmed, case-insensitive search filters', () => {
		expect(getVisiblePantryItems(items, 'PRODUCE', ' TOM ')).toEqual([
			items[0],
		])
		expect(getVisiblePantryItems(items, 'dairy', 'tom')).toEqual([])
	})

	it('returns the full pantry when no view filter is active', () => {
		expect(getVisiblePantryItems(items, null, '   ')).toEqual(items)
	})
})
