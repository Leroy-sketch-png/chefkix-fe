import { api } from '@/lib/axios'
import {
	AcceptFriendResponse,
	ApiResponse,
	DeclineFriendResponse,
	ToggleFollowResponse,
	ToggleFriendRequestResponse,
	UnfriendResponse,
	Profile,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

/**
 * Social API Service
 *
 * API Behavior Summary (from backend spec):
 *
 * 1. toggleFollow:
 *    - Returns the TARGET user's profile with updated followerCount and isFollowing
 *
 * 2. toggleFriendRequest:
 *    - Sends/cancels friend request
 *    - Returns the TARGET user's profile with updated friendRequestCount and relationshipStatus
 *
 * 3. acceptFriendRequest:
 *    - Accepts pending friend request
 *    - Returns the SENDER's profile with updated friendCount and relationshipStatus = 'FRIENDS'
 *    - Both users' friendCount increment, requester's friendRequestCount decrements
 *
 * 4. declineFriendRequest:
 *    - Declines pending friend request
 *    - Returns SENDER's profile (reduced) with relationshipStatus = 'NOT_FRIENDS'
 *    - Requester's friendRequestCount decrements
 *
 * 5. unfriendUser:
 *    - Removes friendship
 *    - Returns the ex-FRIEND's profile (reduced) with updated friendCount and relationshipStatus = 'NOT_FRIENDS'
 *    - Both users' friendCount decrement
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

export const toggleFriendRequest = async (
	userId: string,
): Promise<ApiResponse<ToggleFriendRequestResponse>> => {
	try {
		const response = await api.post<ApiResponse<ToggleFriendRequestResponse>>(
			API_ENDPOINTS.SOCIAL.TOGGLE_FRIEND_REQUEST(userId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<ToggleFriendRequestResponse>
		>
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

export const acceptFriendRequest = async (
	userId: string,
): Promise<ApiResponse<AcceptFriendResponse>> => {
	try {
		const response = await api.post<ApiResponse<AcceptFriendResponse>>(
			API_ENDPOINTS.SOCIAL.ACCEPT_FRIEND(userId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<AcceptFriendResponse>>
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

export const declineFriendRequest = async (
	userId: string,
): Promise<ApiResponse<DeclineFriendResponse>> => {
	try {
		const response = await api.post<ApiResponse<DeclineFriendResponse>>(
			API_ENDPOINTS.SOCIAL.REJECT_FRIEND(userId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<DeclineFriendResponse>>
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

export const unfriendUser = async (
	userId: string,
): Promise<ApiResponse<UnfriendResponse>> => {
	try {
		const response = await api.post<ApiResponse<UnfriendResponse>>(
			API_ENDPOINTS.SOCIAL.UNFRIEND(userId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<UnfriendResponse>>
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

/**
 * Get user's friends list
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
 * Get pending friend requests
 */
export const getFriendRequests = async (): Promise<ApiResponse<Profile[]>> => {
	try {
		const response = await api.get<ApiResponse<Profile[]>>(
			API_ENDPOINTS.SOCIAL.GET_FRIEND_REQUESTS,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch friend requests',
			statusCode: 500,
		}
	}
}
