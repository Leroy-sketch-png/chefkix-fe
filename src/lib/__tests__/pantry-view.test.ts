import type { PantryItem } from '@/lib/types/pantry'
import {
	getPantryCounts,
	getPantryGroups,
	getVisiblePantryItems,
} from '@/lib/pantry-view'

const pantryItem = (
	id: string,
	category: string,
	freshness: PantryItem['freshness'],
	expiryDate: string | null = null,
): PantryItem => ({
	id,
	ingredientName: id,
	normalizedName: id.toLocaleLowerCase(),
	quantity: 1,
	unit: 'item',
	category,
	expiryDate,
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
		expect(getVisiblePantryItems(items, 'PRODUCE', ' TOM ')).toEqual([items[0]])
		expect(getVisiblePantryItems(items, 'dairy', 'tom')).toEqual([])
	})

	it('returns the full pantry when no view filter is active', () => {
		expect(getVisiblePantryItems(items, null, '   ')).toEqual(items)
	})

	it('keeps category order by default', () => {
		const categories = [
			{ key: 'produce', label: 'Produce' },
			{ key: 'dairy', label: 'Dairy' },
			{ key: 'spices', label: 'Spices' },
		]

		expect(getPantryGroups(items, categories, false)).toEqual([
			{ ...categories[0], items: [items[0]] },
			{ ...categories[1], items: [items[1]] },
			{ ...categories[2], items: [items[2]] },
		])
	})

	it('brings the soonest category forward and puts undated items last', () => {
		const nearMilk = pantryItem('Milk', 'dairy', 'expiring_soon', '2026-10-24')
		const laterMilk = pantryItem('Yogurt', 'dairy', 'fresh', '2026-10-28')
		const spinach = pantryItem(
			'Spinach',
			'produce',
			'expiring_soon',
			'2026-10-22',
		)
		const carrots = pantryItem('Carrots', 'produce', 'fresh', '2026-10-25')
		const undated = pantryItem('Onions', 'produce', 'fresh')
		const categories = [
			{ key: 'dairy', label: 'Dairy' },
			{ key: 'produce', label: 'Produce' },
		]

		const groups = getPantryGroups(
			[nearMilk, laterMilk, carrots, undated, spinach],
			categories,
			true,
		)

		expect(groups.map(group => group.key)).toEqual(['produce', 'dairy'])
		expect(groups[0].items).toEqual([spinach, carrots, undated])
		expect(groups[1].items).toEqual([nearMilk, laterMilk])
	})
})
