'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
	DEMO_PITCH_BEATS,
	getDemoPitchShortcut,
	resolveDemoShortcut,
	swapPersonaFromVault,
	getDemoVault,
	cleanupDemoState,
	getDemoBaseUrl,
} from './demo-config'
import { useAuthStore } from '@/store/authStore'
import { usePaceTimer } from './PaceTimer'
import { getGhostDriver } from '@/lib/ghost-driver'
import { DemoQROverlay } from './DemoQROverlay'

export interface DemoRemoteCommand {
	type: 'GOTO_BEAT' | 'SAFE_HARBOR' | 'RETRY_BEAT' | 'CLEANUP' | 'WARM_VAULT' | 'REWIND_SNAPSHOT' | 'PRELOAD' | 'GHOST_DRIVER_BEAT' | 'TOGGLE_QR_OVERLAY'
	beatIndex?: number
}

interface TemporalSnapshot {
	url: string
	scrollY: number
	authState: ReturnType<typeof useAuthStore.getState>
}

export function PhantomConductor() {
	const router = useRouter()
	const { accessToken } = useAuthStore()
	const paceTimer = usePaceTimer()

	const executeCommand = useCallback(
		async (command: DemoRemoteCommand) => {
			if (command.type === 'GHOST_DRIVER_BEAT') {
				try {
					const driver = getGhostDriver('main')
					driver.start()
					// Fallback to simple clicks based on beat (omni-demo logic adapted)
					if (command.beatIndex === 1) { // Hero Recipe
						await driver.click('a[href="/recipes/explore"]')
						await driver.wait(1000)
						await driver.hover('main a[href*="/recipes/"]', true)
						await driver.click('main a[href*="/recipes/"]')
						await driver.wait(2000)
					} else if (command.beatIndex === 2) { // Co-cook
						await driver.click('a[href="/cook-together"]')
						await driver.wait(1500)
						await driver.type('input[placeholder*="room" i]', 'ABC123')
						await driver.wait(500)
						await driver.click('button:has-text("Join Room")')
					}
					driver.stop()
				} catch (e) {
					console.error('Ghost Driver error', e)
					getGhostDriver('main').stop()
				}
				return
			}

			if (command.type === 'PRELOAD') {
				// We can import preloadCriticalData lazily if needed, or just let remote do it.
				return
			}

			if (command.type === 'REWIND_SNAPSHOT') {
				const snapshotsRaw = sessionStorage.getItem('chefkix-temporal-snapshots')
				if (snapshotsRaw) {
					try {
						const snaps = JSON.parse(snapshotsRaw) as TemporalSnapshot[]
						if (snaps.length > 0) {
							const last = snaps.pop()!
							sessionStorage.setItem('chefkix-temporal-snapshots', JSON.stringify(snaps))
							
							// Restore
							useAuthStore.setState(last.authState)
							router.push(last.url)
							setTimeout(() => window.scrollTo({ top: last.scrollY, behavior: 'instant' }), 50)
							console.log('⏪ Rewound 5 seconds')
						}
					} catch { /* ignore */ }
				}
				return
			}

			if (command.type === 'SAFE_HARBOR') {
				router.push('/dashboard')
				return
			}
			
			if (command.type === 'CLEANUP' && accessToken) {
				await cleanupDemoState(accessToken)
				return
			}

			if (command.type === 'GOTO_BEAT' && typeof command.beatIndex === 'number') {
				const beat = DEMO_PITCH_BEATS[command.beatIndex]
				if (!beat) return

				const firstAction = beat.actions[0]
				const shortcut = firstAction ? getDemoPitchShortcut(firstAction) : undefined

				// Hot-swap persona
				if (beat.personaUsername) {
					const vault = getDemoVault()
					if (vault.isWarmed) {
						swapPersonaFromVault(beat.personaUsername, true)
					}
				}

				if (shortcut) {
					// We might need to get the latest access token from the store after swapping
					const latestToken = useAuthStore.getState().accessToken
					try {
						const resolved = await resolveDemoShortcut(shortcut, latestToken)
						if (resolved.copiedText) {
							await navigator.clipboard.writeText(resolved.copiedText).catch(() => {})
						}
						router.push(resolved.path)
						// Update pace timer
						paceTimer.setBeat(command.beatIndex)
					} catch (err) {
						console.error('Phantom Conductor Navigation Failed', err)
					}
				}
			}
		},
		[router, accessToken, paceTimer]
	)

	// BroadcastChannel listener
	useEffect(() => {
		if (typeof window === 'undefined') return
		const channel = new BroadcastChannel('chefkix-demo-bus')
		channel.onmessage = (event: MessageEvent<DemoRemoteCommand>) => {
			void executeCommand(event.data)
		}
		return () => channel.close()
	}, [executeCommand])

	// Jedi Keyboard Chords
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Alt + Number -> Go to Beat
			if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
				const num = parseInt(e.key, 10)
				if (num >= 1 && num <= DEMO_PITCH_BEATS.length) {
					e.preventDefault()
					void executeCommand({ type: 'GOTO_BEAT', beatIndex: num - 1 })
				}
			}

			// Alt + Shift + H -> Safe Harbor
			if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'h') {
				e.preventDefault()
				void executeCommand({ type: 'SAFE_HARBOR' })
			}

			// Alt + Shift + R -> Retry Beat (Re-execute current beat index)
			if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'r') {
				e.preventDefault()
				const currentIndexStr = localStorage.getItem('chefkix-demo-pace-timer-v1')
				if (currentIndexStr) {
					try {
						const state = JSON.parse(currentIndexStr)
						if (typeof state.currentBeatIndex === 'number') {
							void executeCommand({ type: 'GOTO_BEAT', beatIndex: state.currentBeatIndex })
						}
					} catch { /* ignore */ }
				}
			}

			// Alt + Shift + Z -> Temporal Rewind
			if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'z') {
				e.preventDefault()
				void executeCommand({ type: 'REWIND_SNAPSHOT' })
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		
		// 🛡️ BEFOREUNLOAD SHIELD 🛡️
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault()
			e.returnValue = '' // Modern browsers require this to show the prompt
		}
		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [executeCommand])

	// 🔆 SCREEN WAKE LOCK 🔆
	useEffect(() => {
		if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
		let wakeLock: any = null
		
		const requestWakeLock = async () => {
			try {
				wakeLock = await (navigator as any).wakeLock.request('screen')
				wakeLock.addEventListener('release', () => {
					console.log('Screen Wake Lock released')
				})
			} catch (err) {
				console.warn('Wake Lock error', err)
			}
		}

		requestWakeLock()

		const handleVisibilityChange = () => {
			if (wakeLock !== null && document.visibilityState === 'visible') {
				requestWakeLock()
			}
		}
		
		document.addEventListener('visibilitychange', handleVisibilityChange)
		
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			if (wakeLock) wakeLock.release()
		}
	}, [])

	// Heartbeat Radar (every 1.5 seconds)
	useEffect(() => {
		if (typeof window === 'undefined') return
		const channel = new BroadcastChannel('chefkix-demo-bus')
		const interval = setInterval(async () => {
			const start = performance.now()
			try {
				const baseUrl = getDemoBaseUrl()
				// Use a lightweight endpoint to ping
				await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(2000) }).catch(() => {})
				const latency = Math.round(performance.now() - start)
				channel.postMessage({ type: 'RADAR_PING', latency })
			} catch (err) {
				channel.postMessage({ type: 'RADAR_PING', latency: 2000 })
			}
		}, 1500)
		return () => {
			clearInterval(interval)
			channel.close()
		}
	}, [])

	// Temporal Snapshot Loop (every 5 seconds)
	useEffect(() => {
		if (typeof window === 'undefined') return
		const interval = setInterval(() => {
			try {
				const current: TemporalSnapshot = {
					url: window.location.pathname + window.location.search,
					scrollY: window.scrollY,
					authState: useAuthStore.getState()
				}
				const raw = sessionStorage.getItem('chefkix-temporal-snapshots')
				let snaps: TemporalSnapshot[] = []
				if (raw) snaps = JSON.parse(raw)
				snaps.push(current)
				if (snaps.length > 10) snaps.shift() // keep last 10
				sessionStorage.setItem('chefkix-temporal-snapshots', JSON.stringify(snaps))
			} catch { /* ignore */ }
		}, 5000)
		return () => clearInterval(interval)
	}, [])

	return <DemoQROverlay />
}
