'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { unregisterPushToken } from '@/services/push'
import { logDevError } from '@/lib/dev-log'

const LEGACY_REMOTE_PUSH_TOKEN_KEY = 'chefkix:push:fcmToken'

/**
 * Remote push notifications are intentionally disabled in the frontend.
 *
 * ChefKix still supports local browser notifications for cooking timers through
 * `pushNotifications.ts`, and authenticated in-app delivery through the
 * notification socket. Remote web push needs a provider-neutral token strategy
 * before this hook should register device tokens again.
 */
export function usePushNotifications() {
	const { isAuthenticated } = useAuthStore()
	const cleanedLegacyTokenRef = useRef(false)

	useEffect(() => {
		if (isAuthenticated || cleanedLegacyTokenRef.current) return

		try {
			const hadLegacyToken = localStorage.getItem(LEGACY_REMOTE_PUSH_TOKEN_KEY)
			if (hadLegacyToken) {
				void unregisterPushToken()
				localStorage.removeItem(LEGACY_REMOTE_PUSH_TOKEN_KEY)
			}
		} catch (error) {
			logDevError('Legacy push token cleanup failed', error)
		} finally {
			cleanedLegacyTokenRef.current = true
		}
	}, [isAuthenticated])

	const enablePush = useCallback(async (): Promise<boolean> => false, [])

	const disablePush = useCallback(async (): Promise<boolean> => {
		try {
			localStorage.removeItem(LEGACY_REMOTE_PUSH_TOKEN_KEY)
		} catch (error) {
			logDevError('Legacy push token local cleanup failed', error)
		}
		return unregisterPushToken()
	}, [])

	return { enablePush, disablePush }
}
