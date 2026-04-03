const RECENT_SEARCHES_KEY = 'chefkix_recent_searches'
const MAX_RECENT_SEARCHES = 8

export function getRecentSearches(): string[] {
	if (typeof window === 'undefined') return []
	try {
		const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
		return raw ? JSON.parse(raw) : []
	} catch {
		return []
	}
}

export function addRecentSearch(term: string) {
	const trimmed = term.trim()
	if (!trimmed) return
	const existing = getRecentSearches().filter(s => s !== trimmed)
	const updated = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES)
	localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

export function removeRecentSearch(term: string) {
	const updated = getRecentSearches().filter(s => s !== term)
	localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}
