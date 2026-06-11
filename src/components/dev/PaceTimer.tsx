'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DEMO_PITCH_BEATS } from './demo-config'

const BEAT_DURATIONS_MINUTES: Record<string, number> = {
	'conversion-moat': 4,
	'taste-graph': 3,
	'viral-loop': 4,
	'commerce-intent': 3,
	'creator-engine': 3,
	'trust-layer': 3,
}

const PACE_TIMER_STORAGE_KEY = 'chefkix-demo-pace-timer-v1'

interface PaceTimerState {
	isVisible: boolean
	currentBeatIndex: number
	beatStartedAt: number | null
	sessionStartedAt: number | null
	isPaused: boolean
	pausedElapsedMs: number
}

const DEFAULT_STATE: PaceTimerState = {
	isVisible: false, // In phantom mode, this controls if the 2px line is active
	currentBeatIndex: 0,
	beatStartedAt: null,
	sessionStartedAt: null,
	isPaused: false,
	pausedElapsedMs: 0,
}

export function formatTime(ms: number): string {
	const totalSec = Math.floor(Math.abs(ms) / 1000)
	const min = Math.floor(totalSec / 60)
	const sec = totalSec % 60
	return `${ms < 0 ? '-' : ''}${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function getPaceColor(elapsedMs: number, budgetMs: number): string {
	const ratio = elapsedMs / budgetMs
	if (ratio < 0.7) return '#3fb950' // green — on track
	if (ratio < 1.0) return '#d29922' // yellow — approaching limit
	return '#f85149' // red — over budget
}

export interface PaceTimerRef {
	advanceBeat: () => void
	setBeat: (beatIndex: number) => void
	start: () => void
	reset: () => void
}

const PACE_TIMER_COMMANDS: PaceTimerRef = {
	advanceBeat: () => {
		if (typeof window === 'undefined') return
		window.dispatchEvent(new CustomEvent('chefkix-pace-advance'))
	},
	setBeat: (beatIndex: number) => {
		if (typeof window === 'undefined') return
		window.dispatchEvent(
			new CustomEvent('chefkix-pace-set-beat', { detail: beatIndex }),
		)
	},
	start: () => {
		if (typeof window === 'undefined') return
		window.dispatchEvent(new CustomEvent('chefkix-pace-start'))
	},
	reset: () => {
		if (typeof window === 'undefined') return
		window.dispatchEvent(new CustomEvent('chefkix-pace-reset'))
	},
}

export function usePaceTimer(): PaceTimerRef {
	return PACE_TIMER_COMMANDS
}

/**
 * Custom hook to read the current pace timer state, used by the Remote Control
 */
export function usePaceTimerState() {
	const [state, setStateRaw] = useState<PaceTimerState>(DEFAULT_STATE)
	const [now, setNow] = useState(Date.now())

	useEffect(() => {
		const sync = () => {
			try {
				const raw = localStorage.getItem(PACE_TIMER_STORAGE_KEY)
				if (raw) setStateRaw(JSON.parse(raw))
			} catch {
				/* ignore */
			}
		}
		const onStorage = (event: StorageEvent) => {
			if (event.key === PACE_TIMER_STORAGE_KEY) sync()
		}
		sync()
		window.addEventListener('storage', onStorage)

		const interval = setInterval(() => setNow(Date.now()), 1000)
		return () => {
			window.removeEventListener('storage', onStorage)
			clearInterval(interval)
		}
	}, [])

	const beat = DEMO_PITCH_BEATS[state.currentBeatIndex]
	const budgetMinutes = beat ? (BEAT_DURATIONS_MINUTES[beat.id] ?? 3) : 3
	const budgetMs = budgetMinutes * 60 * 1000

	const rawElapsedMs = state.isPaused
		? state.pausedElapsedMs
		: state.beatStartedAt
			? state.pausedElapsedMs + (now - state.beatStartedAt)
			: 0

	const totalElapsedMs = state.sessionStartedAt
		? (state.isPaused ? state.pausedElapsedMs : now - state.sessionStartedAt)
		: 0

	return {
		state,
		beat,
		budgetMinutes,
		budgetMs,
		rawElapsedMs,
		totalElapsedMs,
		overMs: rawElapsedMs - budgetMs,
		paceColor: getPaceColor(rawElapsedMs, budgetMs),
	}
}

export function PaceTimer() {
	const [state, setStateRaw] = useState<PaceTimerState>(DEFAULT_STATE)
	const [now, setNow] = useState(Date.now())
	const stateRef = useRef<PaceTimerState>(DEFAULT_STATE)

	const setState = useCallback((updater: Partial<PaceTimerState> | ((prev: PaceTimerState) => Partial<PaceTimerState>)) => {
		setStateRaw(prev => {
			const patch = typeof updater === 'function' ? updater(prev) : updater
			const next = { ...prev, ...patch }
			stateRef.current = next
			try {
				localStorage.setItem(PACE_TIMER_STORAGE_KEY, JSON.stringify(next))
			} catch { /* ignore */ }
			return next
		})
	}, [])

	useEffect(() => {
		try {
			const raw = localStorage.getItem(PACE_TIMER_STORAGE_KEY)
			if (raw) {
				const parsed = JSON.parse(raw) as Partial<PaceTimerState>
				setStateRaw(prev => {
					const next = { ...prev, ...parsed }
					stateRef.current = next
					return next
				})
			}
		} catch { /* ignore */ }
	}, [])

	useEffect(() => {
		if (state.isPaused || !state.beatStartedAt) return
		const interval = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(interval)
	}, [state.isPaused, state.beatStartedAt])

	useEffect(() => {
		const onAdvance = () => {
			setState(prev => {
				const nextIndex = Math.min(prev.currentBeatIndex + 1, DEMO_PITCH_BEATS.length - 1)
				return { currentBeatIndex: nextIndex, beatStartedAt: Date.now(), pausedElapsedMs: 0 }
			})
		}
		const onSetBeat = (e: Event) => {
			const idx = (e as CustomEvent<number>).detail
			if (typeof idx === 'number') {
				setState({ currentBeatIndex: idx, beatStartedAt: Date.now(), pausedElapsedMs: 0 })
			}
		}
		const onStart = () => {
			setState(prev => ({
				beatStartedAt: Date.now(),
				sessionStartedAt: prev.sessionStartedAt ?? Date.now(),
				isPaused: false,
				pausedElapsedMs: 0,
				isVisible: true,
			}))
		}
		const onReset = () => {
			setState({ ...DEFAULT_STATE })
			try { localStorage.removeItem(PACE_TIMER_STORAGE_KEY) } catch { /* ignore */ }
		}
		window.addEventListener('chefkix-pace-advance', onAdvance)
		window.addEventListener('chefkix-pace-set-beat', onSetBeat as EventListener)
		window.addEventListener('chefkix-pace-start', onStart)
		window.addEventListener('chefkix-pace-reset', onReset)
		return () => {
			window.removeEventListener('chefkix-pace-advance', onAdvance)
			window.removeEventListener('chefkix-pace-set-beat', onSetBeat as EventListener)
			window.removeEventListener('chefkix-pace-start', onStart)
			window.removeEventListener('chefkix-pace-reset', onReset)
		}
	}, [setState])

	// Listen for state updates from the remote control
	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === PACE_TIMER_STORAGE_KEY && e.newValue) {
				try {
					setStateRaw(JSON.parse(e.newValue))
				} catch { /* ignore */ }
			}
		}
		window.addEventListener('storage', onStorage)
		return () => window.removeEventListener('storage', onStorage)
	}, [])

	if (!state.isVisible) return null
	const beat = DEMO_PITCH_BEATS[state.currentBeatIndex]
	if (!beat) return null

	const budgetMinutes = BEAT_DURATIONS_MINUTES[beat.id] ?? 3
	const budgetMs = budgetMinutes * 60 * 1000

	const rawElapsedMs = state.isPaused
		? state.pausedElapsedMs
		: state.beatStartedAt
			? state.pausedElapsedMs + (now - state.beatStartedAt)
			: 0

	const paceColor = getPaceColor(rawElapsedMs, budgetMs)
	const progressWidth = Math.min(100, (rawElapsedMs / budgetMs) * 100)

	// 2px ambient line at the top of the screen
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: 2,
				zIndex: 999999,
				pointerEvents: 'none',
				background: 'transparent'
			}}
			aria-hidden='true'
		>
			<div
				style={{
					height: '100%',
					width: `${progressWidth}%`,
					background: paceColor,
					transition: 'width 1s linear, background 0.3s ease',
					boxShadow: `0 0 4px ${paceColor}88` // Subtle glow
				}}
			/>
		</div>
	)
}
