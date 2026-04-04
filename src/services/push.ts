/**
 * Push Notification Token Service
 *
 * Manages FCM token registration with the backend (DeviceController).
 * Bridges Firebase client SDK ↔ ChefKix backend push infrastructure.
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants/api'
import { logDevError } from '@/lib/dev-log'

// ============================================
// DEVICE FINGERPRINT
// ============================================

const DEVICE_ID_KEY = 'chefkix:push:deviceId'

/** Generate a stable device ID from browser fingerprint, persisted in localStorage */
export function getOrCreateDeviceId(): string {
	if (typeof window === 'undefined') return 'ssr'

	const existing = localStorage.getItem(DEVICE_ID_KEY)
	if (existing) return existing

	// Simple fingerprint: random UUID since crypto.randomUUID is widely supported
	const id =
		typeof crypto !== 'undefined' && crypto.randomUUID
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

	localStorage.setItem(DEVICE_ID_KEY, id)
	return id
}

/** Get a human-readable device name for the backend */
function getDeviceName(): string {
	if (typeof navigator === 'undefined') return 'Unknown'

	const ua = navigator.userAgent
	if (ua.includes('Chrome')) return 'Chrome Browser'
	if (ua.includes('Firefox')) return 'Firefox Browser'
	if (ua.includes('Safari')) return 'Safari Browser'
	if (ua.includes('Edge')) return 'Edge Browser'
	return 'Web Browser'
}

// ============================================
// BACKEND TOKEN REGISTRATION
// ============================================

/**
 * Register an FCM token with the backend.
 * Backend stores it in push_tokens collection, associated with the authenticated user.
 */
export async function registerPushToken(
	fcmToken: string
): Promise<ApiResponse<string> | null> {
	try {
		const response = await api.post<ApiResponse<string>>(
			API_ENDPOINTS.NOTIFICATIONS.REGISTER_PUSH_TOKEN,
			{
				fcmToken,
				deviceId: getOrCreateDeviceId(),
				platform: 'web',
				deviceName: getDeviceName(),
			}
		)
		return response.data
	} catch (error) {
		logDevError('Failed to register push token', error)
		return null
	}
}

/**
 * Unregister the push token for this device.
 * Called on logout or when user disables push notifications.
 */
export async function unregisterPushToken(): Promise<boolean> {
	try {
		const deviceId = getOrCreateDeviceId()
		await api.delete(
			`${API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_PUSH_TOKEN}/${deviceId}`
		)
		return true
	} catch (error) {
		logDevError('Failed to unregister push token', error)
		return false
	}
}

/**
 * Unregister ALL push tokens for the current user.
 * Called when user does a full "sign out everywhere" action.
 */
export async function unregisterAllPushTokens(): Promise<boolean> {
	try {
		await api.delete(API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_ALL_PUSH_TOKENS)
		return true
	} catch (error) {
		logDevError('Failed to unregister all push tokens', error)
		return false
	}
}
