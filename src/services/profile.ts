import { api } from '@/lib/axios'
import { ApiResponse, Profile } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

/**
 * Backend profile endpoints return: { profile: Profile, posts: Page<Post> }
 * We extract just the profile for most use cases.
 */
interface ProfileWithPostsResponse {
	profile: Profile
	posts?: unknown
}

export const getProfileByUserId = async (
	userId: string,
): Promise<ApiResponse<Profile>> => {
	try {
		const response = await api.get<ApiResponse<ProfileWithPostsResponse>>(
			API_ENDPOINTS.PROFILE.GET_BY_USER_ID(userId),
		)

		// Extract the profile from the nested structure
		const profile = response.data?.data?.profile

		if (profile) {
			return {
				success: true,
				statusCode: response.data.statusCode,
				message: response.data.message,
				data: profile,
			}
		}

		return {
			success: false,
			statusCode: 404,
			message: 'Profile not found',
		}
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<ProfileWithPostsResponse>
		>
		if (axiosError.response) {
			return {
				success: false,
				statusCode:
					axiosError.response.data?.statusCode || axiosError.response.status,
				message: axiosError.response.data?.message || 'Failed to fetch profile',
			}
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

// Note: getProfileByUsername removed - backend only supports userId (UUID) lookups.
// All profile fetches should use getProfileByUserId() instead.

export const getMyProfile = async (): Promise<ApiResponse<Profile>> => {
	try {
		const response = await api.get<ApiResponse<ProfileWithPostsResponse>>(
			API_ENDPOINTS.AUTH.ME,
		)

		// Extract the profile from the nested structure
		const profile = response.data?.data?.profile

		if (profile) {
			return {
				success: true,
				statusCode: response.data.statusCode,
				message: response.data.message,
				data: profile,
			}
		}

		// Profile not found in response - return error
		return {
			success: false,
			statusCode: 404,
			message: 'Profile not found in response',
		}
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<ProfileWithPostsResponse>
		>
		if (axiosError.response) {
			return {
				success: false,
				statusCode:
					axiosError.response.data?.statusCode || axiosError.response.status,
				message: axiosError.response.data?.message || 'Failed to fetch profile',
			}
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

export interface UpdateProfileDto {
	displayName?: string
	bio?: string
	avatarUrl?: string
}

export const updateProfile = async (
	data: UpdateProfileDto,
): Promise<ApiResponse<Profile>> => {
	try {
		const response = await api.put<ApiResponse<Profile>>(
			API_ENDPOINTS.PROFILE.UPDATE,
			data,
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
