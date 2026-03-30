/**
 * Admin moderation service — all admin-only API calls.
 *
 * Backend: AdminController (/api/v1/admin/*)
 * All endpoints require ROLE_ADMIN JWT authority.
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import type {
	Report,
	ReviewReportRequest,
	BanResponse,
	BanUserRequest,
	Appeal,
	ReviewAppealRequest,
} from '@/lib/types/admin'
import type { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

const handleAdminError = <T>(
	error: unknown,
	fallbackMessage: string,
): ApiResponse<T> => {
	const axiosError = error as AxiosError<ApiResponse<T>>
	if (axiosError.response?.data) {
		return axiosError.response.data
	}
	return {
		success: false,
		message: fallbackMessage,
		statusCode: 500,
	}
}

// ── Reports ──

/** Get pending reports (status = "pending") */
export const getPendingReports = async (): Promise<ApiResponse<Report[]>> => {
	try {
		const response = await api.get<ApiResponse<Report[]>>(
			API_ENDPOINTS.ADMIN.GET_PENDING_REPORTS,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to load pending reports.')
	}
}

/** Get all reports regardless of status */
export const getAllReports = async (): Promise<ApiResponse<Report[]>> => {
	try {
		const response = await api.get<ApiResponse<Report[]>>(
			API_ENDPOINTS.ADMIN.GET_ALL_REPORTS,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to load reports.')
	}
}

/** Review a report (resolve/dismiss/ban) */
export const reviewReport = async (
	reportId: string,
	request: ReviewReportRequest,
): Promise<ApiResponse<Report>> => {
	try {
		const response = await api.post<ApiResponse<Report>>(
			API_ENDPOINTS.ADMIN.REVIEW_REPORT(reportId),
			request,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to review report.')
	}
}

// ── Bans ──

/** Manually ban a user (escalating penalties: 3d → 7d → 14d → permanent) */
export const banUser = async (
	userId: string,
	request: BanUserRequest,
): Promise<ApiResponse<BanResponse>> => {
	try {
		const response = await api.post<ApiResponse<BanResponse>>(
			API_ENDPOINTS.ADMIN.BAN_USER(userId),
			request,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to ban user.')
	}
}

/** Get active bans for a specific user */
export const getUserBans = async (
	userId: string,
): Promise<ApiResponse<BanResponse[]>> => {
	try {
		const response = await api.get<ApiResponse<BanResponse[]>>(
			API_ENDPOINTS.ADMIN.GET_USER_BANS(userId),
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to load user bans.')
	}
}

/** Revoke (deactivate) a specific ban */
export const revokeBan = async (
	banId: string,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.delete<ApiResponse<string>>(
			API_ENDPOINTS.ADMIN.REVOKE_BAN(banId),
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to revoke ban.')
	}
}

// ── Appeals ──

/** Get pending appeals (status = "pending") */
export const getPendingAppeals = async (): Promise<ApiResponse<Appeal[]>> => {
	try {
		const response = await api.get<ApiResponse<Appeal[]>>(
			API_ENDPOINTS.ADMIN.GET_PENDING_APPEALS,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to load pending appeals.')
	}
}

/** Review an appeal (approve/reject). Approving auto-revokes the ban. */
export const reviewAppeal = async (
	appealId: string,
	request: ReviewAppealRequest,
): Promise<ApiResponse<Appeal>> => {
	try {
		const response = await api.post<ApiResponse<Appeal>>(
			API_ENDPOINTS.ADMIN.REVIEW_APPEAL(appealId),
			request,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		return handleAdminError(error, 'Failed to review appeal.')
	}
}
