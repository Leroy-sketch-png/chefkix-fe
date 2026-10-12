export function mergeUniqueSearchResults<T extends { id: string }>(
	current: T[],
	incoming: T[],
): T[] {
	const seen = new Set(current.map(item => item.id))
	return [
		...current,
		...incoming.filter(item => {
			if (seen.has(item.id)) return false
			seen.add(item.id)
			return true
		}),
	]
}

export function hasMoreSearchResults(loaded: number, total: number): boolean {
	return loaded < total
}
