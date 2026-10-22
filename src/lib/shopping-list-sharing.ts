import type { ShoppingListResponse } from '@/lib/types/shoppingList'

type ProvisionShareToken = (listId: string) => Promise<ShoppingListResponse>

export async function resolveStableShoppingListShare(
	list: ShoppingListResponse,
	provisionShareToken: ProvisionShareToken,
): Promise<ShoppingListResponse> {
	if (list.shareToken) return list
	return provisionShareToken(list.id)
}

export function shoppingListShareUrl(
	origin: string,
	shareToken: string,
): string {
	return `${origin}/shopping-lists/shared/${shareToken}`
}
