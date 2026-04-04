'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

/**
 * PushNotificationProvider
 *
 * Mounts the push notification lifecycle hook in the main layout.
 * Handles: FCM token registration on auth, foreground message handling,
 * and token cleanup on logout.
 *
 * Renders nothing — pure side-effect provider.
 */
export function PushNotificationProvider() {
	usePushNotifications()
	return null
}
