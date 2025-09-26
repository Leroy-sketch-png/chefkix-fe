import app from '@/configs/app'
import { useAuthStore } from '@/store/authStore'
import axios, { AxiosError, AxiosResponse } from 'axios'

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080',
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: app.AXIOS_TIMEOUT,
})

// Request Interceptor: Add the auth token to every request if it exists.
api.interceptors.request.use(config => {
	const token = useAuthStore.getState().token
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
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
