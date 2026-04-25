'use client'

import * as React from 'react'

interface UseIntersectionObserverOptions {
	threshold?: number | number[]
	rootMargin?: string
	root?: Element | null
	enabled?: boolean
}

/**
 * Observes an element's intersection with viewport.
 * Returns a callback ref (attach to element) and the IntersectionObserverEntry.
 *
 * @example
 * const [ref, entry] = useIntersectionObserver({ threshold: 0.5 })
 * <div ref={ref}>{entry?.isIntersecting ? 'Visible' : 'Hidden'}</div>
 */
export function useIntersectionObserver(
	options: UseIntersectionObserverOptions = {},
): [React.RefCallback<Element>, IntersectionObserverEntry | null] {
	const {
		threshold = 0,
		rootMargin = '0px',
		root = null,
		enabled = true,
	} = options
	const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(
		null,
	)
	const observerRef = React.useRef<IntersectionObserver | null>(null)
	const nodeRef = React.useRef<Element | null>(null)

	const callbackRef = React.useCallback(
		(node: Element | null) => {
			// Disconnect previous
			if (observerRef.current) {
				observerRef.current.disconnect()
				observerRef.current = null
			}

			nodeRef.current = node

			if (!node || !enabled) {
				setEntry(null)
				return
			}

			const observer = new IntersectionObserver(([e]) => setEntry(e), {
				threshold,
				rootMargin,
				root,
			})

			observer.observe(node)
			observerRef.current = observer
		},
		[threshold, rootMargin, root, enabled],
	)

	// Cleanup on unmount
	React.useEffect(() => {
		return () => {
			observerRef.current?.disconnect()
		}
	}, [])

	return [callbackRef, entry]
}
