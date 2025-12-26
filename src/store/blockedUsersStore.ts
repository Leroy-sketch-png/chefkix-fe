import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getBlockedUsers, blockUser, unblockUser } from '@/services/social'

interface BlockedUsersState {
	blockedUserIds: Set<string>
	isLoaded: boolean
	lastFetched: number | null

	// Actions
	fetchBlockedUsers: () => Promise<void>
	addBlockedUser: (userId: string) => Promise<boolean>
	removeBlockedUser: (userId: string) => Promise<boolean>
	isBlocked: (userId: string) => boolean
	clearBlockedUsers: () => void
}

// Custom serializer for Set
const setSerializer = {
	serialize: (state: { blockedUserIds: Set<string> }) => ({
		...state,
		blockedUserIds: Array.from(state.blockedUserIds),
	}),
	deserialize: (state: { blockedUserIds: string[] }) => ({
		...state,
		blockedUserIds: new Set(state.blockedUserIds || []),
	}),
}

export const useBlockedUsersStore = create<BlockedUsersState>()(
	persist(
		(set, get) => ({
			blockedUserIds: new Set<string>(),
			isLoaded: false,
			lastFetched: null,

			fetchBlockedUsers: async () => {
				try {
					const response = await getBlockedUsers()
					if (response.success && response.data) {
						const ids = new Set(response.data.map(u => u.blockedUserId))
						set({
							blockedUserIds: ids,
							isLoaded: true,
							lastFetched: Date.now(),
						})
					}
				} catch {
					// Silently fail - don't break the app
					set({ isLoaded: true })
				}
			},

			addBlockedUser: async (userId: string) => {
				try {
					const response = await blockUser(userId)
					if (response.success) {
						set(state => ({
							blockedUserIds: new Set([...state.blockedUserIds, userId]),
						}))
						return true
					}
					return false
				} catch {
					return false
				}
			},

			removeBlockedUser: async (userId: string) => {
				try {
					const response = await unblockUser(userId)
					if (response.success) {
						set(state => {
							const newSet = new Set(state.blockedUserIds)
							newSet.delete(userId)
							return { blockedUserIds: newSet }
						})
						return true
					}
					return false
				} catch {
					return false
				}
			},

			isBlocked: (userId: string) => {
				return get().blockedUserIds.has(userId)
			},

			clearBlockedUsers: () => {
				set({ blockedUserIds: new Set(), isLoaded: false, lastFetched: null })
			},
		}),
		{
			name: 'chefkix-blocked-users',
			storage: createJSONStorage(() => localStorage),
			partialize: state => ({
				blockedUserIds: Array.from(state.blockedUserIds),
				lastFetched: state.lastFetched,
			}),
			onRehydrateStorage: () => state => {
				if (state) {
					// Convert array back to Set after rehydration
					state.blockedUserIds = new Set(
						state.blockedUserIds as unknown as string[],
					)
					state.isLoaded = true
				}
			},
		},
	),
)

/**
 * Filter an array of items by blocked users
 * Use this to filter posts, comments, search results, etc.
 */
export function filterBlockedContent<T extends { userId: string }>(
	items: T[],
): T[] {
	const { blockedUserIds } = useBlockedUsersStore.getState()
	return items.filter(item => !blockedUserIds.has(item.userId))
}

/**
 * Check if a user is blocked (outside of React components)
 */
export function isUserBlocked(userId: string): boolean {
	return useBlockedUsersStore.getState().isBlocked(userId)
}
