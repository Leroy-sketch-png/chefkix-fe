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
	sessionPausedAt: number | null
	sessionPausedElapsedMs: number
	isPaused: boolean
	pausedElapsedMs: number
}

const DEFAULT_STATE: PaceTimerState = {
	isVisible: false, // In phantom mode, this controls if the 2px line is active
	currentBeatIndex: 0,
	beatStartedAt: null,
	sessionStartedAt: null,
	sessionPausedAt: null,
	sessionPausedElapsedMs: 0,
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
	pause: () => void
	resume: () => void
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
	pause: () => {
		if (typeof window === 'undefined') return
		window.dispatchEvent(new CustomEvent('chefkix-pace-pause'))
	},
	resume: () => {
		if (typeof window === 'undefined') return
		window.dispatchEvent(new CustomEvent('chefkix-pace-resume'))
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
				setStateRaw(
					raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE,
				)
			} catch {
				setStateRaw(DEFAULT_STATE)
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

	const currentSessionPauseMs =
		state.isPaused && state.sessionPausedAt ? now - state.sessionPausedAt : 0
	const totalElapsedMs = state.sessionStartedAt
		? Math.max(
				0,
				now -
					state.sessionStartedAt -
					state.sessionPausedElapsedMs -
					currentSessionPauseMs,
			)
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

	const setState = useCallback(
		(
			updater:
				| Partial<PaceTimerState>
				| ((prev: PaceTimerState) => Partial<PaceTimerState>),
		) => {
			setStateRaw(prev => {
				const patch = typeof updater === 'function' ? updater(prev) : updater
				const next = { ...prev, ...patch }
				stateRef.current = next
				try {
					localStorage.setItem(PACE_TIMER_STORAGE_KEY, JSON.stringify(next))
				} catch {
					/* ignore */
				}
				return next
			})
		},
		[],
	)

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
		} catch {
			/* ignore */
		}
	}, [])

	useEffect(() => {
		if (state.isPaused || !state.beatStartedAt) return
		const interval = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(interval)
	}, [state.isPaused, state.beatStartedAt])

	useEffect(() => {
		const onAdvance = () => {
			setState(prev => {
				const nextIndex = Math.min(
					prev.currentBeatIndex + 1,
					DEMO_PITCH_BEATS.length - 1,
				)
				const now = Date.now()
				return {
					currentBeatIndex: nextIndex,
					beatStartedAt: now,
					sessionStartedAt: prev.sessionStartedAt ?? now,
					isPaused: false,
					pausedElapsedMs: 0,
					isVisible: true,
					sessionPausedAt: null,
					sessionPausedElapsedMs:
						prev.sessionPausedElapsedMs +
						(prev.isPaused && prev.sessionPausedAt
							? now - prev.sessionPausedAt
							: 0),
				}
			})
		}
		const onSetBeat = (e: Event) => {
			const idx = (e as CustomEvent<number>).detail
			if (typeof idx === 'number') {
				setState(prev => {
					const now = Date.now()
					return {
						currentBeatIndex: idx,
						beatStartedAt: now,
						sessionStartedAt: prev.sessionStartedAt ?? now,
						isPaused: false,
						pausedElapsedMs: 0,
						isVisible: true,
						sessionPausedAt: null,
						sessionPausedElapsedMs:
							prev.sessionPausedElapsedMs +
							(prev.isPaused && prev.sessionPausedAt
								? now - prev.sessionPausedAt
								: 0),
					}
				})
			}
		}
		const onStart = () => {
			setState(prev => {
				const now = Date.now()
				return {
					beatStartedAt: now,
					sessionStartedAt: prev.sessionStartedAt ?? now,
					sessionPausedAt: null,
					sessionPausedElapsedMs:
						prev.sessionPausedElapsedMs +
						(prev.isPaused && prev.sessionPausedAt
							? now - prev.sessionPausedAt
							: 0),
					isPaused: false,
					pausedElapsedMs: 0,
					isVisible: true,
				}
			})
		}
		const onPause = () => {
			setState(prev => {
				if (prev.isPaused || !prev.beatStartedAt) return {}
				const now = Date.now()
				return {
					isPaused: true,
					pausedElapsedMs: prev.pausedElapsedMs + (now - prev.beatStartedAt),
					sessionPausedAt: now,
				}
			})
		}
		const onResume = () => {
			setState(prev => {
				if (!prev.isPaused) return {}
				const now = Date.now()
				return {
					isPaused: false,
					beatStartedAt: now,
					sessionPausedAt: null,
					sessionPausedElapsedMs:
						prev.sessionPausedElapsedMs +
						(prev.sessionPausedAt ? now - prev.sessionPausedAt : 0),
				}
			})
		}
		const onReset = () => {
			stateRef.current = DEFAULT_STATE
			setStateRaw(DEFAULT_STATE)
			try {
				localStorage.removeItem(PACE_TIMER_STORAGE_KEY)
			} catch {
				/* ignore */
			}
		}
		window.addEventListener('chefkix-pace-advance', onAdvance)
		window.addEventListener('chefkix-pace-set-beat', onSetBeat as EventListener)
		window.addEventListener('chefkix-pace-start', onStart)
		window.addEventListener('chefkix-pace-pause', onPause)
		window.addEventListener('chefkix-pace-resume', onResume)
		window.addEventListener('chefkix-pace-reset', onReset)
		return () => {
			window.removeEventListener('chefkix-pace-advance', onAdvance)
			window.removeEventListener(
				'chefkix-pace-set-beat',
				onSetBeat as EventListener,
			)
			window.removeEventListener('chefkix-pace-start', onStart)
			window.removeEventListener('chefkix-pace-pause', onPause)
			window.removeEventListener('chefkix-pace-resume', onResume)
			window.removeEventListener('chefkix-pace-reset', onReset)
		}
	}, [setState])

	// Listen for state updates from the remote control
	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === PACE_TIMER_STORAGE_KEY) {
				try {
					setStateRaw(
						e.newValue
							? { ...DEFAULT_STATE, ...JSON.parse(e.newValue) }
							: DEFAULT_STATE,
					)
				} catch {
					setStateRaw(DEFAULT_STATE)
				}
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
				background: 'transparent',
			}}
			aria-hidden='true'
		>
			<div
				style={{
					height: '100%',
					width: `${progressWidth}%`,
					background: paceColor,
					transition: 'width 1s linear, background 0.3s ease',
					boxShadow: `0 0 4px ${paceColor}88`, // Subtle glow
				}}
			/>
		</div>
	)
}
