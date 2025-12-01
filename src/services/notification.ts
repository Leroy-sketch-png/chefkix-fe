/**
 * Notification Service
 * Based on: .tmp/implemented_spec/10-notifications.txt
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants/api'
import type { AxiosError } from 'axios'

// ============================================
// TYPES
// ============================================

export type NotificationType =
	| 'xp_awarded'
	| 'level_up'
	| 'badge_unlocked'
	| 'creator_bonus'
	| 'new_follower'
	| 'post_liked'
	| 'recipe_liked'
	| 'comment'
	| 'reply'
	| 'challenge_reminder'
	| 'post_deadline'
	| 'streak_warning'

export interface Notification {
	id: string
	type: NotificationType
	title: string
	body: string
	data: Record<string, unknown>
	read: boolean
	createdAt: string
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
 */
export const getNotifications = async (
	params?: NotificationParams,
): Promise<ApiResponse<NotificationsResponse>> => {
	try {
		const response = await api.get<ApiResponse<NotificationsResponse>>(
			API_ENDPOINTS.NOTIFICATIONS.GET,
			{ params },
		)
		return response.data
	} catch (error) {
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
 * Register device for push notifications
 */
export const registerDevice = async (
	token: string,
	platform: 'ios' | 'android',
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.post<ApiResponse<void>>(
			API_ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE,
			{ token, platform },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to register device',
			statusCode: 500,
		}
	}
}

/**
 * Unregister device from push notifications
 */
export const unregisterDevice = async (
	token: string,
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.delete<ApiResponse<void>>(
			API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_DEVICE(token),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to unregister device',
			statusCode: 500,
		}
	}
}
