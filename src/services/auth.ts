import { api } from '@/lib/axios'
import {
	ApiResponse,
	LoginSuccessResponse,
	SendOtpDto,
	SignInDto,
	SignUpDto,
	VerifyOtpDto,
	GoogleSignInDto,
	ForgotPasswordDto,
	VerifyOtpPasswordDto,
	ChangePasswordDto,
} from '@/lib/types'
import { AxiosError } from 'axios'
import { API_ENDPOINTS } from '@/constants'
import { logDevError } from '@/lib/dev-log'
import { getUserFriendlyMessage } from '@/lib/error-utils'

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
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<LoginSuccessResponse>>
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

// Sign-up function
export const signUp = async (data: SignUpDto): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			API_ENDPOINTS.AUTH.REGISTER,
			data,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string>>
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

/**
 * Check if a username is available for registration.
 * Debounce this on the client side for live validation.
 */
export const checkUsernameAvailability = async (
	username: string,
): Promise<ApiResponse<{ available: boolean }>> => {
	try {
		const response = await api.get<ApiResponse<{ available: boolean }>>(
			`${API_ENDPOINTS.AUTH.CHECK_USERNAME}?username=${encodeURIComponent(username)}`,
		)
		return response.data
	} catch (error) {
		logDevError('Username check failed:', error)
		const axiosError = error as AxiosError<ApiResponse<{ available: boolean }>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Could not check username availability',
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
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Logout failed, but your session has been cleared locally.',
			statusCode: 500,
		}
	}
}

/**
 * Resend OTP for email verification during signup.
 * Backend expects email as query parameter, not request body.
 */
export const resendOtp = async (
	data: SendOtpDto,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			`${API_ENDPOINTS.AUTH.RESEND_OTP}?email=${encodeURIComponent(data.email)}`,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string>>
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

/**
 * @deprecated Use resendOtp instead. This alias exists for backward compatibility.
 */
export const sendOtp = resendOtp

// Verify OTP function — returns auth tokens for auto-login after registration
export const verifyOtp = async (
	data: VerifyOtpDto,
): Promise<ApiResponse<LoginSuccessResponse>> => {
	try {
		const response = await api.post<ApiResponse<LoginSuccessResponse>>(
			API_ENDPOINTS.AUTH.VERIFY_OTP_USER,
			data,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<LoginSuccessResponse>>
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

export const forgotPassword = async (
	data: ForgotPasswordDto,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.post<ApiResponse<string>>(
			`${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}?email=${encodeURIComponent(data.email)}`,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string>>
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

export const verifyOtpPassword = async (
	data: VerifyOtpPasswordDto,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.put<ApiResponse<string>>(
			API_ENDPOINTS.AUTH.VERIFY_OTP_PASSWORD,
			data,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string>>
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

export const changePassword = async (
	data: ChangePasswordDto,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.put<ApiResponse<string>>(
			API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
			data,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string>>
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
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<LoginSuccessResponse>>
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
