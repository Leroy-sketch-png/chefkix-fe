/**
 * Notification Service
 * Based on: .tmp/implemented_spec/10-notifications.txt
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants/api'
import type { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

// ============================================
// TYPES - Must match BE NotificationType enum exactly
// ============================================

// NotificationType: MUST match NotificationType.java exactly
export type NotificationType =
	// Social - Instagram model (follow-based)
	| 'FOLLOW'
	| 'NEW_FOLLOWER'
	// Posts
	| 'POST_LIKE'
	| 'POST_COMMENT'
	| 'RECIPE_LIKED'
	| 'USER_MENTION'
	// Gamification
	| 'XP_AWARDED'
	| 'LEVEL_UP'
	| 'BADGE_EARNED'
	| 'CREATOR_BONUS'
	// Reminders (scheduled)
	| 'STREAK_WARNING'
	| 'POST_DEADLINE'
	| 'CHALLENGE_AVAILABLE'
	| 'CHALLENGE_REMINDER'
	// Co-Cooking (spec 24-advanced-multiplayer.txt)
	| 'ROOM_INVITE'
	| 'CO_CHEF_TAGGED'

/**
 * Notification interface matching BE NotificationResponse exactly
 * BE uses @JsonProperty("isRead") and @JsonProperty("isSummary") for correct serialization
 */
export interface Notification {
	id: string
	type: NotificationType
	isRead: boolean
	content: string
	targetEntityId?: string
	targetEntityUrl?: string
	createdAt: string
	count: number
	latestActorId?: string
	latestActorName?: string
	latestActorAvatarUrl?: string
	isSummary?: boolean
	actorInfo?: {
		actorId: string
		actorName: string
		avatarUrl?: string
	}
	// Legacy FE-only fields — NOT in BE NotificationResponse.java
	// These will always be undefined from API responses.
	/** @deprecated Not in BE response. Use content/actorInfo instead. */
	title?: string
	/** @deprecated Not in BE response. Use content instead. */
	body?: string
	/** @deprecated Not in BE response. Use targetEntityId instead. */
	data?: Record<string, unknown>
}

export interface NotificationPagination {
	page: number
	size: number
	total: number
}

export interface NotificationsResponse {
	notifications: Notification[]
	unreadCount: number
	pagination: NotificationPagination
}

export interface NotificationParams {
	page?: number
	size?: number
	unreadOnly?: boolean
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get notifications for current user
 * Note: BE returns List<NotificationResponse> directly (no wrapper)
 */
export const getNotifications = async (
	params?: NotificationParams,
): Promise<ApiResponse<NotificationsResponse>> => {
	try {
		// NOTE: Our axios instance wraps ALL responses into { success, statusCode, message, data }
		// so the actual payload is always in `response.data.data`.
		// BE returns an array directly here, so `response.data.data` will be Notification[].
		const response = await api.get<Notification[]>(
			API_ENDPOINTS.NOTIFICATIONS.GET,
			{ params: { limit: params?.size ?? 20 } },
		)

		const wrapped = response.data as unknown as ApiResponse<unknown>
		const raw = wrapped.data
		const notifications: Notification[] = Array.isArray(raw)
			? (raw as Notification[])
			: []

		return {
			success: true,
			statusCode: wrapped.statusCode ?? 200,
			data: {
				notifications,
				unreadCount: notifications.filter(n => !n.isRead).length,
				pagination: {
					page: params?.page ?? 0,
					size: params?.size ?? 20,
					total: notifications.length,
				},
			},
		}
	} catch (error) {
		logDevError('notifications failed:', error)
		const axiosError = error as AxiosError<ApiResponse<NotificationsResponse>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch notifications',
			statusCode: 500,
		}
	}
}

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (
	notificationId: string,
): Promise<ApiResponse<{ read: boolean }>> => {
	try {
		const response = await api.post<ApiResponse<{ read: boolean }>>(
			API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<{ read: boolean }>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to mark notification as read',
			statusCode: 500,
		}
	}
}

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (): Promise<
	ApiResponse<{ readCount: number }>
> => {
	try {
		const response = await api.post<ApiResponse<{ readCount: number }>>(
			API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<{ readCount: number }>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to mark all notifications as read',
			statusCode: 500,
		}
	}
}

/**
 * Get unread notification count
 * Lightweight endpoint for badge display without fetching all notifications
 */
export const getUnreadCount = async (): Promise<ApiResponse<number>> => {
	try {
		const response = await api.get<number>(
			API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
		)
		const wrapped = response.data as unknown as ApiResponse<unknown>
		const raw = wrapped.data
		const count = typeof raw === 'number' ? raw : 0
		return {
			success: true,
			statusCode: wrapped.statusCode ?? 200,
			data: count,
		}
	} catch (error) {
		logDevError('count failed:', error)
		const axiosError = error as AxiosError<ApiResponse<number>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch unread count',
			statusCode: 500,
			data: 0,
		}
	}
}
