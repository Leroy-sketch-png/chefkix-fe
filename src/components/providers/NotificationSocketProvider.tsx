'use client'

import { useNotificationSocket } from '@/hooks/useNotificationSocket'

/**
 * Mounts the WebSocket notification hook.
 * Place inside main layout — auto-connects when user is authenticated.
 * Replaces HTTP polling with real-time push delivery.
 */
export function NotificationSocketProvider() {
	useNotificationSocket()
	return null
}
