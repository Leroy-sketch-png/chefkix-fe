import { api } from '@/lib/axios'
import { ApiResponse, Profile } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

export const addXP = async (xp: number): Promise<ApiResponse<Profile>> => {
	try {
		const response = await api.post<ApiResponse<Profile>>(
			`${API_ENDPOINTS.STATISTICS.ADD_XP}?xp=${xp}`,
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
