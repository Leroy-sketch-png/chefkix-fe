import app from '@/configs/app'
import { useAuthStore } from '@/store/authStore'
import axios, { AxiosError, AxiosResponse } from 'axios'

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8888',
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: app.AXIOS_TIMEOUT,
	withCredentials: true, // Enable sending/receiving HttpOnly cookies (refreshToken)
})

// Request Interceptor: Add the auth token to every request if it exists.
api.interceptors.request.use(config => {
	const accessToken = useAuthStore.getState().accessToken
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`
	}
	return config
})

// Response Interceptor: Standardize successful and error responses.
api.interceptors.response.use(
	(response: AxiosResponse) => {
		const backendResponse = response.data
		response.data = {
			success: true,
			statusCode: backendResponse.code,
			message: backendResponse.message,
			data: backendResponse.result,
		}
		return response
	},
	(error: AxiosError) => {
		// Handle 401 Unauthorized by forcing logout
		if (error.response?.status === 401) {
			// Clear auth state when token is invalid/expired
			const { logout } = useAuthStore.getState()
			logout()

			// Redirect to sign-in if we're in browser context
			if (typeof window !== 'undefined') {
				window.location.href =
					'/auth/sign-in?error=Session expired. Please sign in again.'
			}
		}

		if (error.response) {
			const backendError = error.response.data as any
			error.response.data = {
				success: false,
				statusCode: backendError.code,
				message: backendError.message,
				error: backendError.result,
			}
		}
		return Promise.reject(error)
	},
)
