import { api } from '@/lib/axios'
import {
	AcceptFriendResponse,
	ApiResponse,
	DeclineFriendResponse,
	ToggleFollowResponse,
	ToggleFriendRequestResponse,
	UnfriendResponse,
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
			API_ENDPOINTS.SOCIAL.DECLINE_FRIEND(userId),
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
