'use client'

import { useState, useEffect, useCallback } from 'react'
import {
	isPushSupported,
	getNotificationPermission,
	requestNotificationPermission,
	registerForPush,
	unregisterPush,
} from '@/services/push'
import { useAuthStore } from '@/store/authStore'

export interface UsePushNotificationsReturn {
	/** Whether push notifications are supported on this device */
	isSupported: boolean
	/** Current permission status: 'granted', 'denied', 'default', or 'unsupported' */
	permission: NotificationPermission | 'unsupported'
	/** Whether push notifications are currently enabled (permission granted + registered) */
	isEnabled: boolean
	/** Loading state during registration/unregistration */
	isLoading: boolean
	/** Request permission and register for push */
	enable: () => Promise<boolean>
	/** Unregister push notifications */
	disable: () => Promise<boolean>
}

/**
 * Hook for managing push notification state and registration.
 * 
 * @example
 * ```tsx
 * function NotificationSettings() {
 *   const { isSupported, permission, isEnabled, enable, disable, isLoading } = usePushNotifications()
 * 
 *   if (!isSupported) return <p>Push notifications not supported</p>
 * 
 *   return (
 *     <Switch
 *       checked={isEnabled}
 *       onCheckedChange={checked => checked ? enable() : disable()}
 *       disabled={isLoading || permission === 'denied'}
 *     />
 *   )
 * }
 * ```
 */
export function usePushNotifications(): UsePushNotificationsReturn {
	const [isSupported, setIsSupported] = useState(false)
	const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
	const [isEnabled, setIsEnabled] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const { isAuthenticated } = useAuthStore()

	// Check support and permission on mount
	useEffect(() => {
		const supported = isPushSupported()
		setIsSupported(supported)
		setPermission(getNotificationPermission())

		// Check if already enabled (has stored device ID and granted permission)
		if (supported && Notification.permission === 'granted') {
			const deviceId = localStorage.getItem('chefkix-device-id')
			const pushRegistered = localStorage.getItem('chefkix-push-registered')
			setIsEnabled(!!deviceId && pushRegistered === 'true')
		}
	}, [])

	// Update permission state when it changes
	useEffect(() => {
		if (!isSupported) return

		// Listen for permission changes (some browsers support this)
		const checkPermission = () => {
			setPermission(getNotificationPermission())
		}

		// Poll periodically (permissions API doesn't have great event support)
		const interval = setInterval(checkPermission, 5000)
		return () => clearInterval(interval)
	}, [isSupported])

	const enable = useCallback(async (): Promise<boolean> => {
		if (!isSupported || !isAuthenticated) return false

		setIsLoading(true)
		try {
			// First request permission
			const perm = await requestNotificationPermission()
			setPermission(perm)

			if (perm !== 'granted') {
				return false
			}

			// Then register with backend
			const success = await registerForPush()
			if (success) {
				localStorage.setItem('chefkix-push-registered', 'true')
				setIsEnabled(true)
			}
			return success
		} finally {
			setIsLoading(false)
		}
	}, [isSupported, isAuthenticated])

	const disable = useCallback(async (): Promise<boolean> => {
		if (!isSupported) return false

		setIsLoading(true)
		try {
			const success = await unregisterPush()
			if (success) {
				localStorage.removeItem('chefkix-push-registered')
				setIsEnabled(false)
			}
			return success
		} finally {
			setIsLoading(false)
		}
	}, [isSupported])

	return {
		isSupported,
		permission,
		isEnabled,
		isLoading,
		enable,
		disable,
	}
}
