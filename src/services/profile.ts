import { api } from '@/lib/axios'
import { ApiResponse, Page, PaginationMeta, Profile } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import app from '@/configs/app'
import axios, { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'
import { getUserFriendlyMessage } from '@/lib/error-utils'

const normalizePaginatedProfiles = (
	data: Profile[] | Page<Profile> | undefined,
	pagination?: PaginationMeta,
): PaginatedProfilesResponse | null => {
	if (Array.isArray(data)) {
		return {
			data,
			pagination: pagination ?? {
				page: 0,
				size: data.length,
				totalElements: data.length,
				totalPages: data.length > 0 ? 1 : 0,
				first: true,
				last: true,
			},
		}
	}

	if (data && Array.isArray(data.content)) {
		return {
			data: data.content,
			pagination: pagination ?? {
				page: data.number,
				size: data.size,
				totalElements: data.totalElements,
				totalPages: data.totalPages,
				first: data.first,
				last: data.last,
			},
		}
	}

	return null
}

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
			message: getUserFriendlyMessage(error),
			statusCode: 500,
		}
	}
}

// Note: getProfileByUsername removed - backend only supports userId (UUID) lookups.
// All profile fetches should use getProfileByUserId() instead.

const normalizeMyProfileResponse = (
	response: ApiResponse<Profile> | Profile,
	statusCode = 200,
): ApiResponse<Profile> => {
	const wrappedResponse =
		response &&
		typeof response === 'object' &&
		('success' in response ||
			'statusCode' in response ||
			'code' in response ||
			'message' in response ||
			'data' in response)

	const data = wrappedResponse
		? (response as ApiResponse<Profile>).data
		: (response as Profile)

	if (data) {
		return {
			success: true,
			statusCode:
				(wrappedResponse && (response as ApiResponse<Profile>).statusCode) ||
				statusCode,
			message:
				(wrappedResponse && (response as ApiResponse<Profile>).message) ||
				'Profile fetched successfully',
			data,
		}
	}

	return {
		success: false,
		statusCode: 404,
		message: 'Profile not found in response',
	}
}

const normalizeMyProfileError = (error: unknown): ApiResponse<Profile> => {
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
		message: getUserFriendlyMessage(error),
		statusCode: 500,
	}
}

export const getMyProfile = async (): Promise<ApiResponse<Profile>> => {
	try {
		// BE now returns ProfileResponse directly (no nested structure)
		// This endpoint has NO dependency on social module - prevents cascading failures
		const response = await api.get<ApiResponse<Profile>>(API_ENDPOINTS.AUTH.ME)

		return normalizeMyProfileResponse(response.data, response.status)
	} catch (error) {
		return normalizeMyProfileError(error)
	}
}

export const getMyProfileWithAccessToken = async (
	accessToken: string,
): Promise<ApiResponse<Profile>> => {
	const token = accessToken.trim()
	if (!token) {
		return {
			success: false,
			statusCode: 401,
			message: 'Missing access token',
		}
	}

	try {
		const response = await axios.get<ApiResponse<Profile> | Profile>(
			API_ENDPOINTS.AUTH.ME,
			{
				baseURL: app.API_BASE_URL,
				timeout: app.AXIOS_TIMEOUT,
				withCredentials: true,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		)

		return normalizeMyProfileResponse(response.data, response.status)
	} catch (error) {
		return normalizeMyProfileError(error)
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
		const response = await api.get<ApiResponse<Profile[] | Page<Profile>>>(
			API_ENDPOINTS.PROFILE.GET_ALL_PAGINATED,
			{
				params: {
					page: params.page ?? 0,
					size: params.size ?? 20,
					search: params.search,
				},
			},
		)

		const normalized = normalizePaginatedProfiles(
			response.data.data,
			response.data.pagination,
		)

		if (response.data.success && normalized) {
			return {
				success: true,
				statusCode: 200,
				data: normalized.data,
				pagination: normalized.pagination,
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
		const axiosError = error as AxiosError<
			ApiResponse<Profile[] | Page<Profile>>
		>
		if (axiosError.response) {
			const normalized = normalizePaginatedProfiles(
				axiosError.response.data?.data,
				axiosError.response.data?.pagination,
			)

			return {
				...axiosError.response.data,
				data: normalized?.data,
				pagination: normalized?.pagination,
			}
		}
		return {
			success: false,
			message: getUserFriendlyMessage(error),
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
			message: getUserFriendlyMessage(error),
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

export const exportUserData = async (): Promise<
	ApiResponse<Record<string, unknown>>
> => {
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
