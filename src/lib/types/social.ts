import { Profile, RelationshipStatus, Statistics } from './profile'

/**
 * Response from toggleFollow API.
 * Returns the target user's full profile with updated isFollowing status.
 */
export type ToggleFollowResponse = Profile

// ============================================================
// DEPRECATED - Legacy Friend Request Types
// Kept for backwards compatibility with backend endpoints.
// New code should use toggleFollow + ToggleFollowResponse.
// ============================================================

/**
 * @deprecated Use ToggleFollowResponse instead.
 */
export type ToggleFriendRequestResponse = Profile

/**
 * @deprecated Use ToggleFollowResponse instead.
 */
export type AcceptFriendResponse = Profile

/**
 * @deprecated Legacy type for declined friend request response.
 */
export interface DeclineFriendResponse {
	profileId: string
	userId: string
	displayName: string
	statistics: Pick<
		Statistics,
		'followerCount' | 'friendCount' | 'friendRequestCount'
	>
	relationshipStatus: 'NOT_FRIENDS'
	isFollowing: boolean
}

/**
 * @deprecated Use ToggleFollowResponse instead.
 * In Instagram model, "unfriend" = unfollow via toggleFollow.
 */
export interface UnfriendResponse {
	profileId: string
	userId: string
	displayName: string
	statistics: Pick<
		Statistics,
		'followerCount' | 'friendCount' | 'friendRequestCount'
	>
	relationshipStatus: 'NOT_FRIENDS'
	isFollowing: boolean
}
