/**
 * Hook to detect and react to online/offline status
 */

import { useState, useEffect, useCallback } from 'react'

export interface OfflineStatus {
	isOnline: boolean
	isOffline: boolean
	/** Time of last connectivity change */
	lastChanged: Date | null
	/** Time spent offline in current session (ms) */
	offlineDuration: number
}

export function useOnlineStatus(): OfflineStatus {
	const [isOnline, setIsOnline] = useState(() => {
		if (typeof window === 'undefined') return true
		return navigator.onLine
	})
	const [lastChanged, setLastChanged] = useState<Date | null>(null)
	const [offlineStartTime, setOfflineStartTime] = useState<number | null>(null)
	const [offlineDuration, setOfflineDuration] = useState(0)

	const handleOnline = useCallback(() => {
		setIsOnline(true)
		setLastChanged(new Date())
		// Calculate time spent offline
		if (offlineStartTime) {
			setOfflineDuration(Date.now() - offlineStartTime)
			setOfflineStartTime(null)
		}
	}, [offlineStartTime])

	const handleOffline = useCallback(() => {
		setIsOnline(false)
		setLastChanged(new Date())
		setOfflineStartTime(Date.now())
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return

		// Initial check
		if (!navigator.onLine) {
			setOfflineStartTime(Date.now())
		}

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [handleOnline, handleOffline])

	return {
		isOnline,
		isOffline: !isOnline,
		lastChanged,
		offlineDuration,
	}
}
