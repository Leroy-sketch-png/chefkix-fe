/**
 * Admin moderation service — all admin-only API calls.
 *
 * Backend: AdminController (/api/v1/admin/*)
 * All endpoints require ROLE_ADMIN JWT authority.
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import type {
	Report,
	ReviewReportRequest,
	BanResponse,
	BanUserRequest,
	Appeal,
	ReviewAppealRequest,
} from '@/lib/types/admin'

// ── Reports ──

/** Get pending reports (status = "pending") */
export const getPendingReports = async (): Promise<ApiResponse<Report[]>> => {
	const response = await api.get<ApiResponse<Report[]>>('/admin/reports')
	return response.data
}

/** Get all reports regardless of status */
export const getAllReports = async (): Promise<ApiResponse<Report[]>> => {
	const response = await api.get<ApiResponse<Report[]>>('/admin/reports/all')
	return response.data
}

/** Review a report (resolve/dismiss/ban) */
export const reviewReport = async (
	reportId: string,
	request: ReviewReportRequest,
): Promise<ApiResponse<Report>> => {
	const response = await api.post<ApiResponse<Report>>(
		`/admin/reports/${reportId}/review`,
		request,
	)
	return response.data
}

// ── Bans ──

/** Manually ban a user (escalating penalties: 3d → 7d → 14d → permanent) */
export const banUser = async (
	userId: string,
	request: BanUserRequest,
): Promise<ApiResponse<BanResponse>> => {
	const response = await api.post<ApiResponse<BanResponse>>(
		`/admin/users/${userId}/ban`,
		request,
	)
	return response.data
}

/** Get active bans for a specific user */
export const getUserBans = async (
	userId: string,
): Promise<ApiResponse<BanResponse[]>> => {
	const response = await api.get<ApiResponse<BanResponse[]>>(
		`/admin/users/${userId}/bans`,
	)
	return response.data
}

/** Revoke (deactivate) a specific ban */
export const revokeBan = async (
	banId: string,
): Promise<ApiResponse<string>> => {
	const response = await api.delete<ApiResponse<string>>(`/admin/bans/${banId}`)
	return response.data
}

// ── Appeals ──

/** Get pending appeals (status = "pending") */
export const getPendingAppeals = async (): Promise<ApiResponse<Appeal[]>> => {
	const response = await api.get<ApiResponse<Appeal[]>>('/admin/appeals')
	return response.data
}

/** Review an appeal (approve/reject). Approving auto-revokes the ban. */
export const reviewAppeal = async (
	appealId: string,
	request: ReviewAppealRequest,
): Promise<ApiResponse<Appeal>> => {
	const response = await api.post<ApiResponse<Appeal>>(
		`/admin/appeals/${appealId}/review`,
		request,
	)
	return response.data
}
