/**
 * Presence service — real-time "friends online" via Redis heartbeat + WebSocket.
 * Wave 5.7: Presence System.
 */
import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

export interface PresenceInfo {
	userId: string
	username: string
	displayName: string | null
	avatarUrl: string | null
	online: boolean
	activity: string | null
	recipeTitle: string | null
	lastSeenEpoch: number
}

export const sendHeartbeat = async (
	activity: string = 'browsing',
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.post<ApiResponse<void>>(
			API_ENDPOINTS.PRESENCE.HEARTBEAT,
			{ activity },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Heartbeat failed', statusCode: 500 }
	}
}

export const getFriendsPresence = async (): Promise<
	ApiResponse<PresenceInfo[]>
> => {
	try {
		const response = await api.get<ApiResponse<PresenceInfo[]>>(
			API_ENDPOINTS.PRESENCE.FRIENDS,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<PresenceInfo[]>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch presence',
			statusCode: 500,
		}
	}
}

export const getFriendsCookingNow = async (): Promise<
	ApiResponse<PresenceInfo[]>
> => {
	try {
		const response = await api.get<ApiResponse<PresenceInfo[]>>(
			API_ENDPOINTS.PRESENCE.FRIENDS_COOKING,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<PresenceInfo[]>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch cooking friends',
			statusCode: 500,
		}
	}
}

export const goOffline = async (): Promise<ApiResponse<void>> => {
	try {
		const response = await api.post<ApiResponse<void>>(
			API_ENDPOINTS.PRESENCE.OFFLINE,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to go offline',
			statusCode: 500,
		}
	}
}
