/**
 * Settings service for user preferences management
 * @see chefkix-be/src/main/java/com/chefkix/controller/SettingsController.java
 * @see vision_and_spec/16-settings-preferences.txt
 */

import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import {
	UserSettings,
	PrivacySettings,
	NotificationSettings,
	CookingPreferences,
	AppPreferences,
} from '@/lib/types/settings'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

// ================================
// GET ALL SETTINGS
// ================================

/**
 * Get all settings for the current user.
 * Settings are lazily initialized with defaults on first access.
 */
export const getAllSettings = async (): Promise<ApiResponse<UserSettings>> => {
	try {
		const response = await api.get<ApiResponse<UserSettings>>(
			API_ENDPOINTS.SETTINGS.GET_ALL,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<UserSettings>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch settings. Please try again later.',
			statusCode: 500,
		}
	}
}

// ================================
// PRIVACY SETTINGS
// ================================

/**
 * Get privacy settings for the current user.
 */
export const getPrivacySettings = async (): Promise<
	ApiResponse<PrivacySettings>
> => {
	try {
		const response = await api.get<ApiResponse<PrivacySettings>>(
			API_ENDPOINTS.SETTINGS.PRIVACY,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<PrivacySettings>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch privacy settings.',
			statusCode: 500,
		}
	}
}

/**
 * Update privacy settings. Only non-null fields will be updated.
 */
export const updatePrivacySettings = async (
	settings: Partial<PrivacySettings>,
): Promise<ApiResponse<PrivacySettings>> => {
	try {
		const response = await api.put<ApiResponse<PrivacySettings>>(
			API_ENDPOINTS.SETTINGS.PRIVACY,
			settings,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<PrivacySettings>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to update privacy settings.',
			statusCode: 500,
		}
	}
}

// ================================
// NOTIFICATION SETTINGS
// ================================

/**
 * Get notification settings for the current user.
 */
export const getNotificationSettings = async (): Promise<
	ApiResponse<NotificationSettings>
> => {
	try {
		const response = await api.get<ApiResponse<NotificationSettings>>(
			API_ENDPOINTS.SETTINGS.NOTIFICATIONS,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<NotificationSettings>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch notification settings.',
			statusCode: 500,
		}
	}
}

/**
 * Update notification settings. Only non-null fields will be updated.
 */
export const updateNotificationSettings = async (
	settings: Partial<NotificationSettings>,
): Promise<ApiResponse<NotificationSettings>> => {
	try {
		const response = await api.put<ApiResponse<NotificationSettings>>(
			API_ENDPOINTS.SETTINGS.NOTIFICATIONS,
			settings,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<NotificationSettings>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to update notification settings.',
			statusCode: 500,
		}
	}
}

// ================================
// COOKING PREFERENCES
// ================================

/**
 * Get cooking preferences for the current user.
 */
export const getCookingPreferences = async (): Promise<
	ApiResponse<CookingPreferences>
> => {
	try {
		const response = await api.get<ApiResponse<CookingPreferences>>(
			API_ENDPOINTS.SETTINGS.COOKING,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CookingPreferences>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch cooking preferences.',
			statusCode: 500,
		}
	}
}

/**
 * Update cooking preferences. Only non-null fields will be updated.
 */
export const updateCookingPreferences = async (
	preferences: Partial<CookingPreferences>,
): Promise<ApiResponse<CookingPreferences>> => {
	try {
		const response = await api.put<ApiResponse<CookingPreferences>>(
			API_ENDPOINTS.SETTINGS.COOKING,
			preferences,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CookingPreferences>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to update cooking preferences.',
			statusCode: 500,
		}
	}
}

// ================================
// APP PREFERENCES
// ================================

/**
 * Get app preferences for the current user.
 */
export const getAppPreferences = async (): Promise<
	ApiResponse<AppPreferences>
> => {
	try {
		const response = await api.get<ApiResponse<AppPreferences>>(
			API_ENDPOINTS.SETTINGS.APP,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<AppPreferences>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch app preferences.',
			statusCode: 500,
		}
	}
}

/**
 * Update app preferences. Only non-null fields will be updated.
 */
export const updateAppPreferences = async (
	preferences: Partial<AppPreferences>,
): Promise<ApiResponse<AppPreferences>> => {
	try {
		const response = await api.put<ApiResponse<AppPreferences>>(
			API_ENDPOINTS.SETTINGS.APP,
			preferences,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<AppPreferences>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to update app preferences.',
			statusCode: 500,
		}
	}
}
