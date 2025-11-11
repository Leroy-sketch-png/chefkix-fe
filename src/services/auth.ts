import { api } from '@/lib/axios'
import {
	ApiResponse,
	LoginSuccessResponse,
	SendOtpDto,
	SignInDto,
	SignUpDto,
	VerifyOtpDto,
	GoogleSignInDto,
} from '@/lib/types'
import { AxiosError } from 'axios'
import { API_ENDPOINTS } from '@/constants'
import { AUTH_MESSAGES } from '@/constants/messages'

// Sign-in function
export const signIn = async (
	data: SignInDto,
): Promise<ApiResponse<LoginSuccessResponse>> => {
	try {
		const response = await api.post<ApiResponse<LoginSuccessResponse>>(
			API_ENDPOINTS.AUTH.LOGIN,
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
			message: AUTH_MESSAGES.UNKNOWN_ERROR,
			statusCode: 500,
		}
	}
}

// Sign-up function
export const signUp = async (data: SignUpDto): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			API_ENDPOINTS.AUTH.REGISTER,
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
			message: AUTH_MESSAGES.UNKNOWN_ERROR,
			statusCode: 500,
		}
	}
}

// Logout function - calls backend to invalidate session
export const logout = async (): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			API_ENDPOINTS.AUTH.LOGOUT,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<string>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: AUTH_MESSAGES.LOGOUT_ERROR,
			statusCode: 500,
		}
	}
}

// Send OTP function
export const sendOtp = async (
	data: SendOtpDto,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			API_ENDPOINTS.AUTH.SEND_OTP,
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
			message: AUTH_MESSAGES.UNKNOWN_ERROR,
			statusCode: 500,
		}
	}
}

// Verify OTP function
export const verifyOtp = async (
	data: VerifyOtpDto,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			API_ENDPOINTS.AUTH.VERIFY_OTP,
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
			message: AUTH_MESSAGES.UNKNOWN_ERROR,
			statusCode: 500,
		}
	}
}

// Google Sign-In function
export const googleSignIn = async (
	data: GoogleSignInDto,
): Promise<ApiResponse<LoginSuccessResponse>> => {
	try {
		const response = await api.post<ApiResponse<LoginSuccessResponse>>(
			API_ENDPOINTS.AUTH.GOOGLE,
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
			message: AUTH_MESSAGES.UNKNOWN_ERROR,
			statusCode: 500,
		}
	}
}
