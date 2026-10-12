const LIST_QUERY_KEY = 'list'

export function shoppingListPath(listId?: string | null) {
	if (!listId) return '/shopping-lists'
	return `/shopping-lists?${LIST_QUERY_KEY}=${encodeURIComponent(listId)}`
}

export function shoppingListIdFromSearch(search: string) {
	const value = new URLSearchParams(search).get(LIST_QUERY_KEY)?.trim()
	return value || null
}
