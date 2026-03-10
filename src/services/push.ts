/**
 * Push Notification Service
 *
 * Handles FCM (Firebase Cloud Messaging) token registration and push notification permissions.
 * Requires Firebase credentials to be set in environment variables.
 */

import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'

// Check if push notifications are supported
export function isPushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	)
}

// Get device ID (stable identifier for this browser/device)
function getDeviceId(): string {
	if (typeof window === 'undefined') return 'unknown'

	let deviceId = localStorage.getItem('chefkix-device-id')
	if (!deviceId) {
		deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
		localStorage.setItem('chefkix-device-id', deviceId)
	}
	return deviceId
}

// Get device name for display purposes
function getDeviceName(): string {
	if (typeof window === 'undefined') return 'Unknown Device'

	const ua = navigator.userAgent
	if (ua.includes('Chrome')) return 'Chrome Browser'
	if (ua.includes('Firefox')) return 'Firefox Browser'
	if (ua.includes('Safari')) return 'Safari Browser'
	if (ua.includes('Edge')) return 'Edge Browser'
	return 'Web Browser'
}

// Check current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
	if (!isPushSupported()) return 'unsupported'
	return Notification.permission
}

// Request notification permission
export async function requestNotificationPermission(): Promise<
	'granted' | 'denied' | 'default' | 'unsupported'
> {
	if (!isPushSupported()) return 'unsupported'

	try {
		const permission = await Notification.requestPermission()
		return permission
	} catch (error) {
		console.error('Failed to request notification permission:', error)
		return 'default'
	}
}

// Register for push notifications
export async function registerForPush(): Promise<boolean> {
	if (!isPushSupported()) {
		return false
	}

	if (Notification.permission !== 'granted') {
		const permission = await requestNotificationPermission()
		if (permission !== 'granted') {
			return false
		}
	}

	try {
		// Register service worker
		const registration = await navigator.serviceWorker.register(
			'/firebase-messaging-sw.js'
		)
		// Service worker registered

		// Wait for service worker to be ready
		await navigator.serviceWorker.ready

		// Get FCM token (requires firebase-messaging SDK)
		// This is a placeholder - actual implementation needs Firebase SDK initialization
		const fcmToken = await getFCMToken(registration)
		if (!fcmToken) {
			return false
		}

		// Send token to backend
		await api.post(API_ENDPOINTS.NOTIFICATIONS.REGISTER_PUSH_TOKEN, {
			fcmToken,
			deviceId: getDeviceId(),
			platform: 'web',
			deviceName: getDeviceName(),
		})

		return true
	} catch (error) {
		console.error('Failed to register for push:', error)
		return false
	}
}

// Unregister push notifications for this device
export async function unregisterPush(): Promise<boolean> {
	try {
		const deviceId = getDeviceId()
		await api.delete(`${API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_PUSH_TOKEN}/${deviceId}`)
		return true
	} catch (error) {
		console.error('Failed to unregister push:', error)
		return false
	}
}

// Get FCM token from service worker
async function getFCMToken(
	registration: ServiceWorkerRegistration
): Promise<string | null> {
	// Note: This requires Firebase Messaging SDK to be initialized
	// For now, we use the Web Push API directly with VAPID

	try {
		// Check if we have existing subscription
		const existingSubscription =
			await registration.pushManager.getSubscription()
		if (existingSubscription) {
			// Use the endpoint as a pseudo-token (we'd need VAPID for real)
			return existingSubscription.endpoint
		}

		// For full Firebase implementation, you'd need:
		// 1. import { getMessaging, getToken } from 'firebase/messaging'
		// 2. Initialize Firebase app with config
		// 3. const token = await getToken(messaging, { vapidKey: '...' })

		// Placeholder: Subscribe with VAPID key (backend needs to provide this)
		// const subscription = await registration.pushManager.subscribe({
		//   userVisibleOnly: true,
		//   applicationServerKey: vapidPublicKey,
		// })

		return null
	} catch (error) {
		console.error('Failed to get FCM token:', error)
		return null
	}
}

// Show a local notification (for testing or fallback)
export function showLocalNotification(
	title: string,
	body: string,
	options?: NotificationOptions
): void {
	if (!isPushSupported()) return
	if (Notification.permission !== 'granted') return

	// Check if service worker is registered
	navigator.serviceWorker.ready.then(registration => {
		registration.showNotification(title, {
			body,
			icon: '/icon-192.png',
			badge: '/icon-72.png',
			...options,
		})
	})
}
