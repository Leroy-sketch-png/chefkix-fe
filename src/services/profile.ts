import { api } from '@/lib/axios'
import { ApiResponse, PaginationMeta, Profile } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

/**
 * Profile API Service
 *
 * IMPORTANT: Profile endpoints should NEVER depend on the social module.
 * We use /profile-only/{userId} which returns ProfileResponse directly
 * without cross-module post fetching. This prevents cascading failures.
 * Posts are fetched separately via getPostsByUser() which handles errors gracefully.
 */

export const getProfileByUserId = async (
	userId: string,
): Promise<ApiResponse<Profile>> => {
	try {
		// Use profile-only endpoint - NO dependency on social module
		const response = await api.get<ApiResponse<Profile>>(
			API_ENDPOINTS.PROFILE.GET_PROFILE_ONLY(userId),
		)

		if (response.data?.data) {
			return {
				success: true,
				statusCode: response.data.statusCode,
				message: response.data.message,
				data: response.data.data,
			}
		}

		return {
			success: false,
			statusCode: 404,
			message: 'Profile not found',
		}
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Profile>>
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
		// BE now returns ProfileResponse directly (no nested structure)
		// This endpoint has NO dependency on social module - prevents cascading failures
		const response = await api.get<ApiResponse<Profile>>(API_ENDPOINTS.AUTH.ME)

		if (response.data?.data) {
			return {
				success: true,
				statusCode: response.data.statusCode,
				message: response.data.message,
				data: response.data.data,
			}
		}

		// Profile not found in response - return error
		return {
			success: false,
			statusCode: 404,
			message: 'Profile not found in response',
		}
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Profile>>
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

export interface PaginatedProfilesParams {
	page?: number
	size?: number
	search?: string
}

export interface PaginatedProfilesResponse {
	data: Profile[]
	pagination: PaginationMeta
}

export const getProfilesPaginated = async (
	params: PaginatedProfilesParams = {},
): Promise<
	ApiResponse<Profile[]> & {
		pagination?: PaginatedProfilesResponse['pagination']
	}
> => {
	try {
		const response = await api.get<
			ApiResponse<{
				content: Profile[]
				totalElements: number
				totalPages: number
				number: number
				size: number
				first: boolean
				last: boolean
			}>
		>(API_ENDPOINTS.PROFILE.GET_ALL_PAGINATED, {
			params: {
				page: params.page ?? 0,
				size: params.size ?? 20,
				search: params.search,
			},
		})

		if (response.data.success && response.data.data) {
			const pageData = response.data.data
			return {
				success: true,
				statusCode: 200,
				data: pageData.content,
				pagination: {
					page: pageData.number,
					size: pageData.size,
					totalElements: pageData.totalElements,
					totalPages: pageData.totalPages,
					first: pageData.first,
					last: pageData.last,
				},
			}
		}

		// Fallback for unexpected response structure
		return {
			success: false,
			message: 'Unexpected response format',
			statusCode: 500,
		}
	} catch (error) {
		logDevError('unknown failed:', error)
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
	coverImageUrl?: string
	preferences?: string[]
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
		logDevError('response failed:', error)
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

export const deleteAccount = async (): Promise<ApiResponse<void>> => {
	try {
		const response = await api.delete<ApiResponse<void>>(
			API_ENDPOINTS.PROFILE.DELETE_ACCOUNT,
		)
		return response.data
	} catch (error) {
		logDevError('Delete account failed:', error)
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to delete account. Please try again.',
			statusCode: 500,
		}
	}
}

export const exportUserData = async (): Promise<ApiResponse<Record<string, unknown>>> => {
	try {
		const response = await api.get<ApiResponse<Record<string, unknown>>>(
			API_ENDPOINTS.PROFILE.EXPORT_DATA,
		)
		return response.data
	} catch (error) {
		logDevError('Export data failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Record<string, unknown>>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to export data. Please try again.',
			statusCode: 500,
		}
	}
}
