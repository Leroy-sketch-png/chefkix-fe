import type { AxiosError } from 'axios'

import type { ApiResponse } from '@/lib/types'
import { logDevError } from '@/lib/dev-log'

const errorResponse = <T>(
	message: string,
	statusCode = 503,
): ApiResponse<T> => ({
	success: false,
	message,
	statusCode,
})

export const canUseDirectAiFromBrowser = true

export const getDirectAiPreflightFailure = <T>(): ApiResponse<T> | null => null

export const handleDirectAiError = <T>(
	error: unknown,
	fallbackMessage: string,
): ApiResponse<T> => {
	const axiosError = error as AxiosError<ApiResponse<T>>
	const status =
		axiosError.response?.status ?? axiosError.response?.data?.statusCode ?? 500

	if (axiosError.response?.data) {
		return axiosError.response.data
	}

	logDevError(`[AI Proxy] ${fallbackMessage}:`, error)
	return errorResponse<T>(fallbackMessage, status)
}
