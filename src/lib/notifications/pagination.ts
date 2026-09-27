export const appendUniqueById = <T extends { id: string }>(
	current: T[],
	incoming: T[],
): T[] => {
	const knownIds = new Set(current.map(item => item.id))
	return [
		...current,
		...incoming.filter(item => {
			if (knownIds.has(item.id)) return false
			knownIds.add(item.id)
			return true
		}),
	]
}
