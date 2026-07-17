'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

/**
 * PushNotificationProvider
 *
 * Mounts the remote push lifecycle hook in the main layout.
 * Remote web push is currently disabled; local timer notifications and the
 * notification socket remain active elsewhere.
 *
 * Renders nothing — pure side-effect provider.
 */
export function PushNotificationProvider() {
	usePushNotifications()
	return null
}
