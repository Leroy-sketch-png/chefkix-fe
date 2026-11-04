import { logDevWarn } from '@/lib/dev-log'

interface CelebrationStorage {
	getItem: (key: string) => string | null
	setItem: (key: string, value: string) => void
}

export function createFirstCookCelebrationGate(
	getStorage: () => CelebrationStorage = () => window.localStorage,
) {
	const claimedOwners = new Set<string>()

	return (ownerId: string, recipesCooked: number): boolean => {
		if (!ownerId || recipesCooked !== 0 || claimedOwners.has(ownerId)) {
			return false
		}

		const key = `chefkix:first-cook-celebrated:${ownerId}`
		try {
			const storage = getStorage()
			if (storage.getItem(key) === '1') {
				claimedOwners.add(ownerId)
				return false
			}
			storage.setItem(key, '1')
		} catch (error) {
			logDevWarn(
				'[first-cook] Persistent celebration marker unavailable; using session fallback:',
				error,
			)
		}

		claimedOwners.add(ownerId)
		return true
	}
}

export const claimFirstCookCelebration = createFirstCookCelebrationGate()
