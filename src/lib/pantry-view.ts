import type { PantryItem } from '@/lib/types/pantry'

export interface PantryCounts {
	total: number
	expired: number
	expiringSoon: number
}

export function getPantryCounts(items: PantryItem[]): PantryCounts {
	return items.reduce<PantryCounts>(
		(counts, item) => {
			counts.total += 1
			if (item.freshness === 'expired') counts.expired += 1
			if (item.freshness === 'expiring_soon') counts.expiringSoon += 1
			return counts
		},
		{ total: 0, expired: 0, expiringSoon: 0 },
	)
}

export function getVisiblePantryItems(
	items: PantryItem[],
	category: string | null,
	searchQuery: string,
): PantryItem[] {
	const normalizedCategory = category?.trim().toLocaleLowerCase() ?? null
	const normalizedQuery = searchQuery.trim().toLocaleLowerCase()

	return items.filter(item => {
		const matchesCategory =
			!normalizedCategory ||
			item.category.toLocaleLowerCase() === normalizedCategory
		const matchesSearch =
			!normalizedQuery ||
			item.ingredientName.toLocaleLowerCase().includes(normalizedQuery)

		return matchesCategory && matchesSearch
	})
}
