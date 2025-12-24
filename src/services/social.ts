import { api } from '@/lib/axios'
import { ApiResponse, ToggleFollowResponse, Profile } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

/**
 * Social API Service - Instagram-Style Follow Model
 *
 * ChefKix uses an Instagram-style social model:
 * - Users can FOLLOW other users (one-way relationship)
 * - When both users follow each other = MUTUAL FOLLOW = "Friends"
 * - No friend requests, no pending states
 *
 * Key behaviors:
 * 1. toggleFollow(userId) - Follow/unfollow a user
 *    - If not following → start following
 *    - If already following → unfollow
 *    - Returns the target user's profile with updated isFollowing
 *
 * 2. getFollowers() - Get users who follow you
 *    - Users who follow you but you may not follow back
 *    - Used for "Follow Back Suggestions"
 *
 * 3. getFollowing() - Get users you follow
 *    - Users you've chosen to follow
 *
 * 4. getFriends() - Get mutual follows
 *    - Users where BOTH parties follow each other
 *    - This is the "friends" list
 *
 * 5. isMutualFollow(userId) - Check if mutual follow exists
 */

// ============================================================
// CORE ACTIONS - Instagram Follow Model
// ============================================================

/**
 * Toggle follow status for a user.
 * - If not following → start following
 * - If already following → unfollow
 */
export const toggleFollow = async (
	userId: string,
): Promise<ApiResponse<ToggleFollowResponse>> => {
	try {
		const response = await api.post<ApiResponse<ToggleFollowResponse>>(
			API_ENDPOINTS.SOCIAL.TOGGLE_FOLLOW(userId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ToggleFollowResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

// ============================================================
// RELATIONSHIP QUERIES
// ============================================================

/**
 * Get users who follow the current user.
 * Useful for "Follow Back Suggestions" - these users follow you
 * but you may not follow them back yet.
 */
export const getFollowers = async (): Promise<ApiResponse<Profile[]>> => {
	try {
		const response = await api.get<ApiResponse<Profile[]>>(
			API_ENDPOINTS.SOCIAL.GET_FOLLOWERS,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch followers',
			statusCode: 500,
		}
	}
}

/**
 * Get users the current user is following.
 */
export const getFollowing = async (): Promise<ApiResponse<Profile[]>> => {
	try {
		const response = await api.get<ApiResponse<Profile[]>>(
			API_ENDPOINTS.SOCIAL.GET_FOLLOWING,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch following list',
			statusCode: 500,
		}
	}
}

/**
 * Get mutual follows (friends).
 * In Instagram model: Friends = users where BOTH parties follow each other.
 */
export const getFriends = async (): Promise<ApiResponse<Profile[]>> => {
	try {
		const response = await api.get<ApiResponse<Profile[]>>(
			API_ENDPOINTS.SOCIAL.GET_FRIENDS,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch friends list',
			statusCode: 500,
		}
	}
}

/**
 * Check if a user is a mutual follow (friend).
 */
export const isMutualFollow = async (
	userId: string,
): Promise<ApiResponse<boolean>> => {
	try {
		const response = await api.get<ApiResponse<boolean>>(
			API_ENDPOINTS.SOCIAL.IS_MUTUAL(userId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<boolean>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to check mutual follow status',
			statusCode: 500,
		}
	}
}

// ============================================================
// BLOCK SYSTEM - Safety Features
// ============================================================

export interface BlockedUser {
	id: string
	blockedUserId: string
	blockedUsername: string
	blockedDisplayName: string
	blockedAvatarUrl: string | null
	blockedAt: string
}

/**
 * Block a user. This will:
 * - Remove any follow relationships (both directions)
 * - Hide content between both users (mutual invisibility)
 */
export const blockUser = async (
	userId: string,
): Promise<ApiResponse<BlockedUser>> => {
	try {
		const response = await api.post<ApiResponse<BlockedUser>>(
			`/api/v1/social/block/${userId}`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<BlockedUser>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to block user',
			statusCode: 500,
		}
	}
}

/**
 * Unblock a user.
 */
export const unblockUser = async (
	userId: string,
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.delete<ApiResponse<void>>(
			`/api/v1/social/block/${userId}`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to unblock user',
			statusCode: 500,
		}
	}
}

/**
 * Get list of users the current user has blocked.
 */
export const getBlockedUsers = async (): Promise<
	ApiResponse<BlockedUser[]>
> => {
	try {
		const response = await api.get<ApiResponse<BlockedUser[]>>(
			`/api/v1/social/blocked-users`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<BlockedUser[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get blocked users',
			statusCode: 500,
		}
	}
}

/**
 * Check if the current user has blocked a specific user.
 */
export const isUserBlocked = async (
	userId: string,
): Promise<ApiResponse<boolean>> => {
	try {
		const response = await api.get<ApiResponse<boolean>>(
			`/api/v1/social/is-blocked/${userId}`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<boolean>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to check block status',
			statusCode: 500,
		}
	}
}
