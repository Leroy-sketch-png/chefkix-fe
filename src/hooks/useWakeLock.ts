'use client'

import { useEffect, useRef } from 'react'

/**
 * useWakeLock — Prevents the screen from dimming/sleeping during cooking.
 *
 * Uses the Screen Wake Lock API (W3C). Automatically re-acquires
 * when the tab regains visibility (required by the API spec —
 * wake locks are released on visibility change).
 *
 * @param enabled Whether the wake lock should be held
 */
export function useWakeLock(enabled: boolean): void {
	const wakeLockRef = useRef<WakeLockSentinel | null>(null)

	useEffect(() => {
		if (
			!enabled ||
			typeof navigator === 'undefined' ||
			!('wakeLock' in navigator)
		)
			return

		let released = false

		const acquire = async () => {
			try {
				if (released) return
				wakeLockRef.current = await navigator.wakeLock.request('screen')
				wakeLockRef.current.addEventListener('release', () => {
					wakeLockRef.current = null
				})
			} catch {
				// ignored: wake lock non-critical (low battery, background tab)
			}
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && !released) {
				acquire()
			}
		}

		acquire()
		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			released = true
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			wakeLockRef.current?.release()
			wakeLockRef.current = null
		}
	}, [enabled])
}
