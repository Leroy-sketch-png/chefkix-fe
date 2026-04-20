'use client'

import * as React from 'react'

interface UseAutoRefreshOptions {
	/** Interval in milliseconds */
	interval: number
	/** Whether auto-refresh is enabled (default true) */
	enabled?: boolean
	/** Callback to execute on each interval */
	onRefresh: () => void | Promise<void>
}

/**
 * Calls `onRefresh` at a fixed interval. Includes manual refresh and pause controls.
 *
 * @example
 * const { refresh, isPaused, togglePause } = useAutoRefresh({
 *   interval: 30_000,
 *   onRefresh: () => fetchLeaderboard(),
 * })
 */
export function useAutoRefresh({
	interval,
	enabled = true,
	onRefresh,
}: UseAutoRefreshOptions) {
	const [isPaused, setIsPaused] = React.useState(false)
	const callbackRef = React.useRef(onRefresh)
	callbackRef.current = onRefresh

	React.useEffect(() => {
		if (!enabled || isPaused) return
		const id = setInterval(() => {
			callbackRef.current()
		}, interval)
		return () => clearInterval(id)
	}, [interval, enabled, isPaused])

	const refresh = React.useCallback(() => {
		callbackRef.current()
	}, [])

	const togglePause = React.useCallback(() => {
		setIsPaused(p => !p)
	}, [])

	const pause = React.useCallback(() => setIsPaused(true), [])
	const resume = React.useCallback(() => setIsPaused(false), [])

	return { refresh, isPaused, togglePause, pause, resume }
}
