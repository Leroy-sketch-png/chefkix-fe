import { api } from '@/lib/axios'
import {
	ApiResponse,
	LoginSuccessResponse,
	SignInDto,
	SignUpDto,
} from '@/lib/types'
import { AxiosError } from 'axios'

// Sign-in function
export const signIn = async (
	data: SignInDto,
): Promise<ApiResponse<LoginSuccessResponse>> => {
	try {
		const response = await api.post<ApiResponse<LoginSuccessResponse>>(
			'/api/auth/login',
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<LoginSuccessResponse>>
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

// Sign-up function
export const signUp = async (data: SignUpDto): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			'/api/auth/register',
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<string>>
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
