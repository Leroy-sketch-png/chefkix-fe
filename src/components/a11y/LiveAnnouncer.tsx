'use client'

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
	useEffect,
	type ReactNode,
} from 'react'

type Politeness = 'polite' | 'assertive'

interface LiveAnnouncerContextValue {
	announce: (message: string, politeness?: Politeness) => void
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(
	null,
)

export function useLiveAnnouncer() {
	const ctx = useContext(LiveAnnouncerContext)
	if (!ctx) {
		// Graceful fallback — no-op if used outside provider
		return { announce: () => {} }
	}
	return ctx
}

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
	const [politeMessage, setPoliteMessage] = useState('')
	const [assertiveMessage, setAssertiveMessage] = useState('')
	const clearRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	// Clean up pending timeout on unmount
	useEffect(() => {
		return () => {
			if (clearRef.current) clearTimeout(clearRef.current)
		}
	}, [])

	const announce = useCallback(
		(message: string, politeness: Politeness = 'polite') => {
			if (clearRef.current) clearTimeout(clearRef.current)

			// Clear first to re-trigger screen reader on same message
			if (politeness === 'assertive') {
				setAssertiveMessage('')
				requestAnimationFrame(() => setAssertiveMessage(message))
			} else {
				setPoliteMessage('')
				requestAnimationFrame(() => setPoliteMessage(message))
			}

			// Auto-clear after 5 seconds
			clearRef.current = setTimeout(() => {
				setPoliteMessage('')
				setAssertiveMessage('')
			}, 5000)
		},
		[],
	)

	return (
		<LiveAnnouncerContext.Provider value={{ announce }}>
			{children}
			{/* Invisible live regions — screen readers will announce changes */}
			<div
				role='status'
				aria-live='polite'
				aria-atomic='true'
				className='sr-only'
			>
				{politeMessage}
			</div>
			<div
				role='alert'
				aria-live='assertive'
				aria-atomic='true'
				className='sr-only'
			>
				{assertiveMessage}
			</div>
		</LiveAnnouncerContext.Provider>
	)
}
