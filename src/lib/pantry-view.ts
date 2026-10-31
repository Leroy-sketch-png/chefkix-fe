import type { PantryItem } from '@/lib/types/pantry'

export interface PantryCounts {
	total: number
	expired: number
	expiringSoon: number
}

export interface PantryCategory {
	key: string
}

export type PantryCategoryGroup<T extends PantryCategory> = T & {
	items: PantryItem[]
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

export function getPantryGroups<T extends PantryCategory>(
	items: PantryItem[],
	categories: readonly T[],
	sortByExpiry: boolean,
): PantryCategoryGroup<T>[] {
	const groups = categories
		.map(category => ({
			...category,
			items: items.filter(
				item => item.category.toLocaleLowerCase() === category.key,
			),
		}))
		.filter(group => group.items.length > 0)

	if (!sortByExpiry) return groups

	const compareExpiry = (left: PantryItem, right: PantryItem) => {
		if (left.expiryDate === null) return right.expiryDate === null ? 0 : 1
		if (right.expiryDate === null) return -1
		return left.expiryDate.localeCompare(right.expiryDate)
	}

	const sortedGroups = groups.map(group => ({
		...group,
		items: [...group.items].sort(
			(left, right) =>
				compareExpiry(left, right) ||
				left.ingredientName.localeCompare(right.ingredientName),
		),
	}))

	return sortedGroups.sort((left, right) => {
		const leftExpiry = left.items[0]?.expiryDate ?? null
		const rightExpiry = right.items[0]?.expiryDate ?? null
		if (leftExpiry === null) return rightExpiry === null ? 0 : 1
		if (rightExpiry === null) return -1
		return leftExpiry.localeCompare(rightExpiry)
	})
}
