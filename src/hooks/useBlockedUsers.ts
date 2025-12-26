import { useMemo } from 'react'
import { useBlockedUsersStore } from '@/store/blockedUsersStore'

/**
 * Hook to filter content by blocked users.
 * Returns a memoized filtered array that excludes content from blocked users.
 *
 * @param items - Array of items with a userId property
 * @param userIdKey - The key to use for user ID (default: 'userId')
 * @returns Filtered array excluding blocked users' content
 *
 * @example
 * const filteredPosts = useFilterBlockedContent(posts)
 * const filteredComments = useFilterBlockedContent(comments, 'authorId')
 */
export function useFilterBlockedContent<T extends { userId: string }>(
	items: T[],
): T[] {
	const { blockedUserIds } = useBlockedUsersStore()

	return useMemo(() => {
		if (blockedUserIds.size === 0) return items
		return items.filter(item => !blockedUserIds.has(item.userId))
	}, [items, blockedUserIds])
}

/**
 * Hook to check if a specific user is blocked
 */
export function useIsUserBlocked(userId: string | undefined): boolean {
	const { blockedUserIds } = useBlockedUsersStore()
	if (!userId) return false
	return blockedUserIds.has(userId)
}
