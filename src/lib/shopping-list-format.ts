import type { ShoppingListItem } from '@/lib/types/shoppingList'

export function formatShoppingListQuantity(
	quantity: string | null | undefined,
	unit: string | null | undefined,
) {
	return [quantity?.trim(), unit?.trim()].filter(Boolean).join(' ')
}

export function formatShoppingListCopyLine(
	item: Pick<
		ShoppingListItem,
		'checked' | 'ingredient' | 'quantity' | 'unit'
	>,
) {
	const amount = formatShoppingListQuantity(item.quantity, item.unit)
	const check = item.checked ? '✓' : '○'
	return `${check} ${item.ingredient}${amount ? ` (${amount})` : ''}`
}
