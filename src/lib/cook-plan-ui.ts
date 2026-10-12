import type { CookPlanShoppingItem } from '@/lib/types/cookplan'

export const MIN_ACTIVE_MINUTES = 15
export const MAX_ACTIVE_MINUTES = 180

export function cookPlanCookingPath(recipeId: string) {
	return `/recipes/${encodeURIComponent(recipeId)}?cook=true`
}

export function clampActiveMinutes(value: number) {
	return Math.min(MAX_ACTIVE_MINUTES, Math.max(MIN_ACTIVE_MINUTES, value))
}

export function cookPlanShoppingItemKey(item: CookPlanShoppingItem) {
	return JSON.stringify([item.ingredient, item.unit ?? '', item.quantity])
}

export function reconcileCheckedShoppingItems(
	checkedItems: ReadonlySet<string>,
	nextItems: CookPlanShoppingItem[],
) {
	const available = new Set(nextItems.map(cookPlanShoppingItemKey))
	return new Set([...checkedItems].filter(itemKey => available.has(itemKey)))
}
