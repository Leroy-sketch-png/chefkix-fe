import * as React from 'react'

/**
 * requestAnimationFrame loop hook.
 *
 * Adapted from .tmp stash. Calls the callback on every frame with
 * timestamp and delta time. Automatically cleans up on unmount
 * or when active is false.
 *
 * @param callback - Called each frame with (time: DOMHighResTimeStamp, delta: number)
 * @param active - Whether the loop is running (default true)
 *
 * @example
 * useAnimationFrame((time, delta) => {
 *   // Update particle position
 *   ref.current.style.transform = `translateX(${Math.sin(time / 1000) * 50}px)`
 * })
 *
 * // Pause/resume
 * useAnimationFrame(callback, isPlaying)
 */
export function useAnimationFrame(
	callback: (time: DOMHighResTimeStamp, delta: number) => void,
	active = true,
) {
	const callbackRef = React.useRef(callback)
	const frameRef = React.useRef<number>(0)
	const prevTimeRef = React.useRef<number>(0)

	// Always use latest callback without restarting the loop
	React.useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	React.useEffect(() => {
		if (!active) return

		const loop = (time: DOMHighResTimeStamp) => {
			const delta = prevTimeRef.current ? time - prevTimeRef.current : 0
			prevTimeRef.current = time
			callbackRef.current(time, delta)
			frameRef.current = requestAnimationFrame(loop)
		}

		frameRef.current = requestAnimationFrame(loop)

		return () => {
			cancelAnimationFrame(frameRef.current)
			prevTimeRef.current = 0
		}
	}, [active])
}
