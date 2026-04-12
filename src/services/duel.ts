import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import { DuelResponse, CreateDuelRequest } from '@/lib/types/duel'
import { logDevError } from '@/lib/dev-log'
import { AxiosError } from 'axios'

function extractErrorMessage(error: unknown, fallback: string): string {
	const axiosError = error as AxiosError<ApiResponse<unknown>>
	return axiosError.response?.data?.message || fallback
}

// ============================================
// MUTATIONS
// ============================================

export async function createDuel(
	request: CreateDuelRequest,
): Promise<ApiResponse<DuelResponse>> {
	try {
		const res = await api.post<ApiResponse<DuelResponse>>(
			API_ENDPOINTS.DUELS.CREATE,
			request,
		)
		return res.data
	} catch (error) {
		logDevError('Failed to create duel:', error)
		return {
			success: false,
			statusCode: 500,
			message: extractErrorMessage(error, 'Failed to send challenge'),
			data: null as unknown as DuelResponse,
		}
	}
}

export async function acceptDuel(
	duelId: string,
): Promise<ApiResponse<DuelResponse>> {
	try {
		const res = await api.post<ApiResponse<DuelResponse>>(
			API_ENDPOINTS.DUELS.ACCEPT(duelId),
		)
		return res.data
	} catch (error) {
		logDevError('Failed to accept duel:', error)
		return {
			success: false,
			statusCode: 500,
			message: extractErrorMessage(error, 'Failed to accept duel'),
			data: null as unknown as DuelResponse,
		}
	}
}

export async function declineDuel(
	duelId: string,
): Promise<ApiResponse<DuelResponse>> {
	try {
		const res = await api.post<ApiResponse<DuelResponse>>(
			API_ENDPOINTS.DUELS.DECLINE(duelId),
		)
		return res.data
	} catch (error) {
		logDevError('Failed to decline duel:', error)
		return {
			success: false,
			statusCode: 500,
			message: extractErrorMessage(error, 'Failed to decline duel'),
			data: null as unknown as DuelResponse,
		}
	}
}

export async function cancelDuel(
	duelId: string,
): Promise<ApiResponse<DuelResponse>> {
	try {
		const res = await api.post<ApiResponse<DuelResponse>>(
			API_ENDPOINTS.DUELS.CANCEL(duelId),
		)
		return res.data
	} catch (error) {
		logDevError('Failed to cancel duel:', error)
		return {
			success: false,
			statusCode: 500,
			message: extractErrorMessage(error, 'Failed to cancel duel'),
			data: null as unknown as DuelResponse,
		}
	}
}

// ============================================
// QUERIES
// ============================================

export async function getDuel(duelId: string): Promise<DuelResponse | null> {
	try {
		const res = await api.get<ApiResponse<DuelResponse>>(
			API_ENDPOINTS.DUELS.GET(duelId),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('Failed to get duel:', error)
		return null
	}
}

export async function getMyDuels(): Promise<DuelResponse[]> {
	try {
		const res = await api.get<ApiResponse<DuelResponse[]>>(
			API_ENDPOINTS.DUELS.MY,
		)
		return res.data.data ?? []
	} catch (error) {
		logDevError('Failed to get my duels:', error)
		return []
	}
}

export async function getActiveDuels(): Promise<DuelResponse[]> {
	try {
		const res = await api.get<ApiResponse<DuelResponse[]>>(
			API_ENDPOINTS.DUELS.ACTIVE,
		)
		return res.data.data ?? []
	} catch (error) {
		logDevError('Failed to get active duels:', error)
		return []
	}
}

export async function getPendingInvites(): Promise<DuelResponse[]> {
	try {
		const res = await api.get<ApiResponse<DuelResponse[]>>(
			API_ENDPOINTS.DUELS.INVITES,
		)
		return res.data.data ?? []
	} catch (error) {
		logDevError('Failed to get pending invites:', error)
		return []
	}
}
