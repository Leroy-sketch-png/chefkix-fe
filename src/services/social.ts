import { api } from '@/lib/axios'
import {
	ApiResponse,
	ToggleFollowResponse,
	ToggleFriendRequestResponse,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

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
