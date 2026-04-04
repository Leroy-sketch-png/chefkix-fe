'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { isFirebaseConfigured, getFCMToken, onForegroundMessage } from '@/lib/firebase'
import {
	isNotificationSupported,
	requestNotificationPermission,
} from '@/lib/pushNotifications'
import { registerPushToken, unregisterPushToken } from '@/services/push'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const FCM_TOKEN_KEY = 'chefkix:push:fcmToken'

/**
 * usePushNotifications
 *
 * Manages the full FCM push notification lifecycle:
 * 1. On auth → request permission → get FCM token → register with backend
 * 2. Listens for foreground messages → shows toast notifications
 * 3. On logout → unregister token from backend
 *
 * Mount in MainLayout — persists across navigation.
 */
export function usePushNotifications() {
	const { isAuthenticated } = useAuthStore()
	const router = useRouter()
	const unsubscribeRef = useRef<(() => void) | null>(null)
	const registeredRef = useRef(false)

	const registerToken = useCallback(async () => {
		if (registeredRef.current) return
		if (!isFirebaseConfigured()) return
		if (!isNotificationSupported()) return

		// Only register if permission is already granted — don't prompt here
		if (Notification.permission !== 'granted') return

		try {
			const fcmToken = await getFCMToken()
			if (!fcmToken) return

			// Check if token changed since last registration
			const previousToken = localStorage.getItem(FCM_TOKEN_KEY)
			if (previousToken === fcmToken) {
				registeredRef.current = true
				return
			}

			const result = await registerPushToken(fcmToken)
			if (result?.success) {
				localStorage.setItem(FCM_TOKEN_KEY, fcmToken)
				registeredRef.current = true
			}
		} catch (error) {
			logDevError('Push token registration failed', error)
		}
	}, [])

	// Register token when authenticated + permission granted
	useEffect(() => {
		if (!isAuthenticated) {
			registeredRef.current = false
			return
		}

		registerToken()
	}, [isAuthenticated, registerToken])

	// Listen for foreground messages
	useEffect(() => {
		if (!isAuthenticated) return
		if (!isFirebaseConfigured()) return

		const unsubscribe = onForegroundMessage((payload) => {
			const title = payload.notification?.title || 'ChefKix'
			const body = payload.notification?.body || 'You have a new notification'
			const data = payload.data || {}

			// Build a click handler based on notification type
			let href: string | undefined
			if (data.link) {
				href = data.link
			} else if (data.type && data.targetId) {
				switch (data.type) {
					case 'POST_LIKE':
					case 'POST_COMMENT':
						href = `/post/${data.targetId}`
						break
					case 'NEW_FOLLOWER':
						href = `/${data.targetId}`
						break
					case 'LEVEL_UP':
					case 'BADGE_EARNED':
						href = '/profile?tab=achievements'
						break
					case 'STREAK_WARNING':
						href = '/dashboard'
						break
					default:
						href = '/notifications'
				}
			}

			toast(title, {
				description: body,
				duration: 6000,
				action: href
					? {
							label: 'View',
							onClick: () => router.push(href),
						}
					: undefined,
			})
		})

		unsubscribeRef.current = unsubscribe

		return () => {
			if (unsubscribeRef.current) {
				unsubscribeRef.current()
				unsubscribeRef.current = null
			}
		}
	}, [isAuthenticated, router])

	// Unregister on logout
	useEffect(() => {
		if (isAuthenticated) return

		// If we were previously registered, unregister
		const hadToken = localStorage.getItem(FCM_TOKEN_KEY)
		if (hadToken) {
			unregisterPushToken()
			localStorage.removeItem(FCM_TOKEN_KEY)
			registeredRef.current = false
		}
	}, [isAuthenticated])

	/**
	 * Manually trigger push notification setup.
	 * Called from settings page when user enables push notifications.
	 * Requests permission if needed, then registers token.
	 */
	const enablePush = useCallback(async (): Promise<boolean> => {
		if (!isFirebaseConfigured()) return false
		if (!isNotificationSupported()) return false

		const permission = await requestNotificationPermission()
		if (permission !== 'granted') return false

		const fcmToken = await getFCMToken()
		if (!fcmToken) return false

		const result = await registerPushToken(fcmToken)
		if (result?.success) {
			localStorage.setItem(FCM_TOKEN_KEY, fcmToken)
			registeredRef.current = true
			return true
		}
		return false
	}, [])

	/**
	 * Disable push notifications.
	 * Unregisters token from backend.
	 */
	const disablePush = useCallback(async (): Promise<boolean> => {
		const success = await unregisterPushToken()
		if (success) {
			localStorage.removeItem(FCM_TOKEN_KEY)
			registeredRef.current = false
		}
		return success
	}, [])

	return { enablePush, disablePush }
}
