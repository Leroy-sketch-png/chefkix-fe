import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse } from '@/lib/types'
import type {
	CookingRoom,
	CreateRoomRequest,
	JoinRoomRequest,
	LeaveRoomResponse,
} from '@/lib/types/room'
import { AxiosError } from 'axios'

// ============================================
// CO-COOKING ROOM SERVICE
// Per spec: 18-co-cooking.txt
// ============================================

/**
 * Create a co-cooking room for a recipe.
 * Automatically starts a cooking session for the host.
 */
export async function createRoom(
	request: CreateRoomRequest,
): Promise<ApiResponse<CookingRoom>> {
	try {
		const response = await api.post(API_ENDPOINTS.COOKING_ROOMS.BASE, request)
		return response.data
	} catch (error) {
		if (error instanceof AxiosError && error.response) {
			return error.response.data
		}
		return {
			success: false,
			statusCode: 500,
			message: 'Failed to create cooking room',
		}
	}
}

/**
 * Join an existing room via room code.
 * Automatically starts a cooking session for the joiner.
 */
export async function joinRoom(
	request: JoinRoomRequest,
): Promise<ApiResponse<CookingRoom>> {
	try {
		const response = await api.post(API_ENDPOINTS.COOKING_ROOMS.JOIN, request)
		return response.data
	} catch (error) {
		if (error instanceof AxiosError && error.response) {
			return error.response.data
		}
		return {
			success: false,
			statusCode: 500,
			message: 'Failed to join cooking room',
		}
	}
}

/**
 * Leave a cooking room. Does NOT affect the user's cooking session.
 */
export async function leaveRoom(
	roomCode: string,
): Promise<ApiResponse<LeaveRoomResponse>> {
	try {
		const response = await api.post(API_ENDPOINTS.COOKING_ROOMS.LEAVE(roomCode))
		return response.data
	} catch (error) {
		if (error instanceof AxiosError && error.response) {
			return error.response.data
		}
		return {
			success: false,
			statusCode: 500,
			message: 'Failed to leave cooking room',
		}
	}
}

/**
 * Get current room state. Used for reconnection/page refresh.
 */
export async function getRoom(
	roomCode: string,
): Promise<ApiResponse<CookingRoom>> {
	try {
		const response = await api.get(API_ENDPOINTS.COOKING_ROOMS.GET(roomCode))
		return response.data
	} catch (error) {
		if (error instanceof AxiosError && error.response) {
			return error.response.data
		}
		return {
			success: false,
			statusCode: 500,
			message: 'Failed to get cooking room',
		}
	}
}
