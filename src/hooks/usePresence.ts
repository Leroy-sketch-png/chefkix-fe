'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { sendHeartbeat, goOffline } from '@/services/presence'
import { logDevError } from '@/lib/dev-log'

const HEARTBEAT_INTERVAL_MS = 60_000 // 60s (server TTL = 90s)

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

	useEffect(() => {
		if (!isAuthenticated) return

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
				beat()
				intervalRef.current = setInterval(beat, HEARTBEAT_INTERVAL_MS)
			}
		}

		// Go offline on tab close
		const handleBeforeUnload = () => {
			goOffline().catch(() => {})
		}

		document.addEventListener('visibilitychange', handleVisibility)
		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
			document.removeEventListener('visibilitychange', handleVisibility)
			window.removeEventListener('beforeunload', handleBeforeUnload)
			goOffline().catch(() => {})
		}
	}, [isAuthenticated])
}
