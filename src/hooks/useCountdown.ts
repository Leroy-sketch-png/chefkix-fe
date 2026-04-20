'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseCountdownOptions {
	/** Total seconds to count down from */
	seconds: number
	/** Interval in ms (default 1000) */
	interval?: number
	/** Auto-start on mount */
	autoStart?: boolean
	/** Called when countdown reaches 0 */
	onComplete?: () => void
}

interface UseCountdownReturn {
	/** Remaining seconds */
	remaining: number
	/** Whether the countdown is currently running */
	isRunning: boolean
	/** Start or resume the countdown */
	start: () => void
	/** Pause the countdown */
	pause: () => void
	/** Reset to initial value and stop */
	reset: () => void
	/** Reset and immediately start */
	restart: () => void
}

export function useCountdown({
	seconds,
	interval = 1000,
	autoStart = false,
	onComplete,
}: UseCountdownOptions): UseCountdownReturn {
	const [remaining, setRemaining] = useState(seconds)
	const [isRunning, setIsRunning] = useState(autoStart)
	const onCompleteRef = useRef(onComplete)
	onCompleteRef.current = onComplete

	useEffect(() => {
		if (!isRunning || remaining <= 0) return

		const id = setInterval(() => {
			setRemaining(prev => {
				const next = prev - interval / 1000
				if (next <= 0) {
					setIsRunning(false)
					onCompleteRef.current?.()
					return 0
				}
				return next
			})
		}, interval)

		return () => clearInterval(id)
	}, [isRunning, remaining, interval])

	const start = useCallback(() => setIsRunning(true), [])
	const pause = useCallback(() => setIsRunning(false), [])
	const reset = useCallback(() => {
		setIsRunning(false)
		setRemaining(seconds)
	}, [seconds])
	const restart = useCallback(() => {
		setRemaining(seconds)
		setIsRunning(true)
	}, [seconds])

	return { remaining, isRunning, start, pause, reset, restart }
}
