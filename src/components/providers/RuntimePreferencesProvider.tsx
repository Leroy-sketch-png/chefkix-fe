'use client'

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { setAudioEnabled } from '@/lib/audio'
import {
	DEFAULT_APP_PREFERENCES,
	type AppPreferences,
} from '@/lib/types/settings'
import { getKitchenAudioCoordinator } from '@/lib/voice'
import { getAppPreferences } from '@/services/settings'
import { useReducedMotionPreference } from './ReducedMotionProvider'

interface RuntimePreferencesContextValue {
	preferences: AppPreferences
	isReady: boolean
	applyPreferences: (updates: Partial<AppPreferences>) => void
}

const RuntimePreferencesContext =
	createContext<RuntimePreferencesContextValue | null>(null)

function mergePreferences(
	current: AppPreferences,
	updates: Partial<AppPreferences>,
): AppPreferences {
	return {
		...current,
		...updates,
		kitchenAudio: {
			...current.kitchenAudio,
			...updates.kitchenAudio,
		},
	}
}

export function RuntimePreferencesProvider({
	children,
}: {
	children: ReactNode
}) {
	const { isAuthenticated, isHydrated, user } = useAuth()
	const { setMotionPreference } = useReducedMotionPreference()
	const [preferences, setPreferences] = useState<AppPreferences>(
		DEFAULT_APP_PREFERENCES,
	)
	const [isReady, setIsReady] = useState(false)
	const preferencesRef = useRef(preferences)

	const applyPreferences = useCallback(
		(updates: Partial<AppPreferences>) => {
			const next = mergePreferences(preferencesRef.current, updates)
			preferencesRef.current = next
			setPreferences(next)
			setIsReady(true)

			if (updates.reducedMotion !== undefined) {
				setMotionPreference(updates.reducedMotion ? 'reduced' : 'auto')
			}
			if (updates.soundEffects !== undefined) {
				setAudioEnabled(updates.soundEffects)
			}
			if (updates.kitchenAudio) {
				getKitchenAudioCoordinator().setPreferences(updates.kitchenAudio)
			}
		},
		[setMotionPreference],
	)

	useEffect(() => {
		if (!isHydrated) return
		if (!isAuthenticated) {
			preferencesRef.current = DEFAULT_APP_PREFERENCES
			setPreferences(DEFAULT_APP_PREFERENCES)
			setIsReady(true)
			return
		}
		if (!user?.userId) {
			setIsReady(false)
			return
		}

		let cancelled = false
		setIsReady(false)

		const hydrate = async () => {
			const response = await getAppPreferences()
			if (cancelled) return
			if (response.success && response.data) {
				applyPreferences(response.data)
			}
		}

		void hydrate()
		return () => {
			cancelled = true
		}
	}, [applyPreferences, isAuthenticated, isHydrated, user?.userId])

	const value = useMemo(
		() => ({ preferences, isReady, applyPreferences }),
		[applyPreferences, isReady, preferences],
	)

	return (
		<RuntimePreferencesContext.Provider value={value}>
			{children}
		</RuntimePreferencesContext.Provider>
	)
}

export function useRuntimePreferences(): RuntimePreferencesContextValue {
	const context = useContext(RuntimePreferencesContext)
	if (!context) {
		throw new Error(
			'useRuntimePreferences must be used within RuntimePreferencesProvider',
		)
	}
	return context
}
