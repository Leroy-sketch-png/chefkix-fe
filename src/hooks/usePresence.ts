'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { sendHeartbeat, goOffline } from '@/services/presence'
import { logDevError } from '@/lib/dev-log'
import { API_ENDPOINTS } from '@/constants'
import { useAuthStore } from '@/store/authStore'
import app from '@/configs/app'

const HEARTBEAT_INTERVAL_MS = 60_000 // 60s (server TTL = 90s)
const API_BASE_URL = app.API_BASE_URL

/**
 * Sends periodic heartbeat pings to the presence service while the user
 * is authenticated and the tab is visible. Sends goOffline on unmount /
 * tab close / visibility-hidden.
 *
 * Mount once in a layout-level component (e.g. MainLayout).
 */
export function usePresence() {
	const { isAuthenticated } = useAuth()
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const isUnloadingRef = useRef(false)

	useEffect(() => {
		if (!isAuthenticated) return
		isUnloadingRef.current = false

		const beat = () => {
			sendHeartbeat('browsing').catch(err =>
				logDevError('Presence heartbeat failed:', err),
			)
		}

		// Initial heartbeat
		beat()
		intervalRef.current = setInterval(beat, HEARTBEAT_INTERVAL_MS)

		// Pause when tab hidden, resume when visible
		const handleVisibility = () => {
			if (document.visibilityState === 'hidden') {
				if (intervalRef.current) {
					clearInterval(intervalRef.current)
					intervalRef.current = null
				}
			} else {
				if (intervalRef.current) clearInterval(intervalRef.current)
				beat()
				intervalRef.current = setInterval(beat, HEARTBEAT_INTERVAL_MS)
			}
		}

		// Go offline on tab close — use sendBeacon for reliable delivery
		const handleBeforeUnload = () => {
			isUnloadingRef.current = true
			const accessToken = useAuthStore.getState().accessToken
			if (!accessToken) return

			void fetch(`${API_BASE_URL}${API_ENDPOINTS.PRESENCE.OFFLINE}`, {
				method: 'POST',
				keepalive: true,
				credentials: 'include',
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}).catch(err => logDevError('Failed to go offline on unload:', err))
		}

		document.addEventListener('visibilitychange', handleVisibility)
		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
			document.removeEventListener('visibilitychange', handleVisibility)
			window.removeEventListener('beforeunload', handleBeforeUnload)
			if (isUnloadingRef.current) return
			goOffline().catch(err =>
				logDevError('Failed to go offline on cleanup:', err),
			)
		}
	}, [isAuthenticated])
}
