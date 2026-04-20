import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Copy text to clipboard with success/error state tracking.
 *
 * @example
 * const { copy, copied } = useClipboard()
 * <button onClick={() => copy("Hello!")}>
 *   {copied ? "Copied!" : "Copy"}
 * </button>
 */
export function useClipboard({ timeout = 2000 } = {}) {
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [])

	const copy = useCallback(
		async (text: string) => {
			try {
				await navigator.clipboard.writeText(text)
				setCopied(true)
				setError(null)
				if (timerRef.current) clearTimeout(timerRef.current)
				timerRef.current = setTimeout(() => setCopied(false), timeout)
			} catch (err) {
				setCopied(false)
				setError(err instanceof Error ? err : new Error('Copy failed'))
			}
		},
		[timeout],
	)

	return { copy, copied, error }
}
