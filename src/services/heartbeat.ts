/**
 * Service functions for Stream 2: Social Heartbeat features.
 * Friends Cooking Now, Community Proof, Welcome Back.
 */
import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'
import type {
	FriendCookingActivityResponse,
	RecipeSocialProofResponse,
	NotificationSummaryResponse,
} from '@/lib/types/heartbeat'

// ============================================================
// FRIENDS COOKING NOW
// ============================================================

export const getFriendsActiveCooking = async (): Promise<
	ApiResponse<FriendCookingActivityResponse>
> => {
	try {
		const response = await api.get<
			ApiResponse<FriendCookingActivityResponse>
		>(API_ENDPOINTS.COOKING_SESSIONS.FRIENDS_ACTIVE)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<FriendCookingActivityResponse>
		>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch friends cooking activity',
			statusCode: 500,
		}
	}
}

// ============================================================
// COMMUNITY PROOF
// ============================================================

export const getRecipeSocialProof = async (
	recipeId: string
): Promise<ApiResponse<RecipeSocialProofResponse>> => {
	try {
		const response = await api.get<
			ApiResponse<RecipeSocialProofResponse>
		>(API_ENDPOINTS.RECIPES.SOCIAL_PROOF(recipeId))
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<RecipeSocialProofResponse>
		>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch recipe social proof',
			statusCode: 500,
		}
	}
}

// ============================================================
// WELCOME BACK / ACTIVITY SUMMARY
// ============================================================

export const getActivitySummary = async (
	since: string
): Promise<ApiResponse<NotificationSummaryResponse>> => {
	try {
		const response = await api.get<
			ApiResponse<NotificationSummaryResponse>
		>(API_ENDPOINTS.NOTIFICATIONS.SUMMARY_SINCE, {
			params: { since },
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<NotificationSummaryResponse>
		>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch activity summary',
			statusCode: 500,
		}
	}
}
