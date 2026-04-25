'use client'

import { useState, useEffect, useRef } from 'react'
import { getUserPresence } from '@/services/presence'

/**
 * Hook to check if a specific user is online.
 * Uses polling with a reasonable interval to avoid hammering the server.
 *
 * @param userId - The user ID to check presence for
 * @param enabled - Whether to fetch presence (disable for current user)
 * @returns { isOnline, isLoading }
 */
export function useUserOnlineStatus(
	userId: string | undefined,
	enabled: boolean = true,
) {
	const [isOnline, setIsOnline] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const mountedRef = useRef(true)

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	useEffect(() => {
		if (!userId || !enabled) {
			setIsOnline(false)
			setIsLoading(false)
			return
		}

		let intervalId: ReturnType<typeof setInterval> | null = null

		const checkPresence = async () => {
			try {
				const response = await getUserPresence(userId)
				if (mountedRef.current && response.success && response.data) {
					setIsOnline(response.data.online)
				}
			} catch {
				// ignored: presence check non-critical
				if (mountedRef.current) {
					setIsOnline(false)
				}
			} finally {
				if (mountedRef.current) {
					setIsLoading(false)
				}
			}
		}

		// Initial check
		checkPresence()

		// Poll every 60 seconds (matches heartbeat interval)
		intervalId = setInterval(checkPresence, 60_000)

		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [userId, enabled])

	return { isOnline, isLoading }
}
