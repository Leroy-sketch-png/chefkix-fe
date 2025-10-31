import { api } from '@/lib/axios'
import { ApiResponse, Profile } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

export const getProfileByUserId = async (
	userId: string,
): Promise<ApiResponse<Profile>> => {
	try {
		const response = await api.get<ApiResponse<Profile>>(
			API_ENDPOINTS.PROFILE.GET_BY_USER_ID(userId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile>>
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

export const getProfileByUsername = async (
	username: string,
): Promise<ApiResponse<Profile>> => {
	try {
		const response = await api.get<ApiResponse<Profile>>(
			API_ENDPOINTS.PROFILE.GET_BY_USERNAME(username),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile>>
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

export const getMyProfile = async (): Promise<ApiResponse<Profile>> => {
	try {
		const response = await api.get<ApiResponse<Profile>>(
			API_ENDPOINTS.PROFILE.GET_ME,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile>>
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

export const getAllProfiles = async (): Promise<ApiResponse<Profile[]>> => {
	try {
		const response = await api.get<ApiResponse<Profile[]>>(
			API_ENDPOINTS.PROFILE.GET_ALL,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Profile[]>>
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
