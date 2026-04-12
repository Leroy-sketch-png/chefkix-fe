'use client'

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useMemo,
} from 'react'

interface ReducedMotionContextValue {
	/** True when user prefers reduced motion (OS setting OR app setting) */
	shouldReduceMotion: boolean
	/** Override OS preference (stored in localStorage) */
	setMotionPreference: (preference: 'auto' | 'reduced' | 'full') => void
	/** Current app-level preference */
	motionPreference: 'auto' | 'reduced' | 'full'
}

const ReducedMotionContext = createContext<ReducedMotionContextValue>({
	shouldReduceMotion: false,
	setMotionPreference: () => {},
	motionPreference: 'auto',
})

const STORAGE_KEY = 'chefkix-motion-preference'

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
	const [osPreference, setOsPreference] = useState(false)
	const [motionPreference, setMotionPreferenceState] = useState<
		'auto' | 'reduced' | 'full'
	>('auto')

	// Read OS preference
	useEffect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
		setOsPreference(mq.matches)

		const handler = (e: MediaQueryListEvent) => setOsPreference(e.matches)
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [])

	// Read stored preference
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (stored === 'reduced' || stored === 'full') {
				setMotionPreferenceState(stored)
			}
		} catch {
			// localStorage not available
		}
	}, [])

	const setMotionPreference = (preference: 'auto' | 'reduced' | 'full') => {
		setMotionPreferenceState(preference)
		try {
			if (preference === 'auto') {
				localStorage.removeItem(STORAGE_KEY)
			} else {
				localStorage.setItem(STORAGE_KEY, preference)
			}
		} catch {
			// localStorage not available
		}
	}

	const shouldReduceMotion = useMemo(() => {
		if (motionPreference === 'reduced') return true
		if (motionPreference === 'full') return false
		return osPreference // 'auto' follows OS
	}, [motionPreference, osPreference])

	const value = useMemo(
		() => ({ shouldReduceMotion, setMotionPreference, motionPreference }),
		[shouldReduceMotion, motionPreference],
	)

	return (
		<ReducedMotionContext.Provider value={value}>
			{children}
		</ReducedMotionContext.Provider>
	)
}

export function useReducedMotionPreference() {
	return useContext(ReducedMotionContext)
}
