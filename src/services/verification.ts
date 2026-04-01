/**
 * Verification service — creator verified badge lifecycle.
 * Wave 5.9: Verified Creator Badge.
 */
import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

export interface VerificationStatus {
	id: string
	userId: string
	status: 'PENDING' | 'APPROVED' | 'REJECTED'
	reason: string | null
	adminNotes: string | null
	requestedAt: string
	reviewedAt: string | null
}

export const applyForVerification = async (
	reason?: string,
	paymentId?: string,
): Promise<ApiResponse<VerificationStatus>> => {
	try {
		const response = await api.post<ApiResponse<VerificationStatus>>(
			API_ENDPOINTS.VERIFICATION.APPLY,
			{ reason, paymentId },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<VerificationStatus>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to apply for verification',
			statusCode: 500,
		}
	}
}

export const getVerificationStatus = async (): Promise<
	ApiResponse<VerificationStatus>
> => {
	try {
		const response = await api.get<ApiResponse<VerificationStatus>>(
			API_ENDPOINTS.VERIFICATION.STATUS,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<VerificationStatus>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch verification status',
			statusCode: 500,
		}
	}
}
