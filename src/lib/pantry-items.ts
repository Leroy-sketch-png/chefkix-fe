import type { PantryItem } from '@/lib/types/pantry'

function matchesCategory(item: PantryItem, category: string | null): boolean {
	return !category || item.category.toLowerCase() === category.toLowerCase()
}

/**
 * Reconciles authoritative mutation responses into the currently loaded pantry
 * slice while preserving existing row positions and one row per persisted ID.
 */
export function reconcilePantryItems(
	currentItems: PantryItem[],
	incomingItems: PantryItem | PantryItem[],
	categoryFilter: string | null = null,
): PantryItem[] {
	const incoming = Array.isArray(incomingItems)
		? incomingItems
		: [incomingItems]
	const incomingById = new Map(incoming.map(item => [item.id, item]))
	const currentIds = new Set(currentItems.map(item => item.id))
	const emittedIds = new Set<string>()

	const reconciledCurrent = currentItems.flatMap(item => {
		if (emittedIds.has(item.id)) return []

		emittedIds.add(item.id)
		const authoritativeItem = incomingById.get(item.id) ?? item
		return matchesCategory(authoritativeItem, categoryFilter)
			? [authoritativeItem]
			: []
	})

	const newItems = [...incomingById.values()].filter(
		item => !currentIds.has(item.id) && matchesCategory(item, categoryFilter),
	)

	return [...newItems, ...reconciledCurrent]
}
