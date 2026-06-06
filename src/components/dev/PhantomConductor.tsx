'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
	DEMO_PITCH_BEATS,
	getDemoPitchShortcut,
	resolveDemoShortcut,
	swapPersonaFromVault,
	getDemoVault,
	isDemoVaultFresh,
	cleanupDemoState,
	getDemoBaseUrl,
	warmTokenVault,
	preloadCriticalData,
} from './demo-config'
import { useAuthStore } from '@/store/authStore'
import { usePaceTimer } from './PaceTimer'
import { getGhostDriver } from '@/lib/ghost-driver'
import { DemoQROverlay } from './DemoQROverlay'

export interface DemoRemoteCommand {
	type:
		| 'GOTO_BEAT'
		| 'SAFE_HARBOR'
		| 'RETRY_BEAT'
		| 'CLEANUP'
		| 'WARM_VAULT'
		| 'REWIND_SNAPSHOT'
		| 'PRELOAD'
		| 'GHOST_DRIVER_BEAT'
		| 'TOGGLE_QR_OVERLAY'
	beatIndex?: number
	commandId?: string
	issuedAt?: number
}

const DEMO_BUS_NAME = 'chefkix-demo-bus'
const COCKPIT_LOCK_NAME = 'chefkix-demo-cockpit-singleton'
const COCKPIT_LOCK_STORAGE_KEY = 'chefkix-demo-cockpit-lock-v1'
const COCKPIT_LOCK_STALE_MS = 5000
const DEMO_REMOTE_COMMAND_TYPES = new Set<DemoRemoteCommand['type']>([
	'GOTO_BEAT',
	'SAFE_HARBOR',
	'RETRY_BEAT',
	'CLEANUP',
	'WARM_VAULT',
	'REWIND_SNAPSHOT',
	'PRELOAD',
	'GHOST_DRIVER_BEAT',
	'TOGGLE_QR_OVERLAY',
])

interface TemporalSnapshot {
	url: string
	scrollY: number
	authState: ReturnType<typeof useAuthStore.getState>
}

async function waitForRouteReady(path: string, timeoutMs = 240000) {
	const target = new URL(path, window.location.origin)
	const deadline = Date.now() + timeoutMs

	while (Date.now() < deadline) {
		const current = new URL(window.location.href)
		if (
			target.pathname === '/cook-together/room' &&
			current.pathname.startsWith('/cook-together')
		) {
			return true
		}

		const paramsMatch = [...target.searchParams.entries()].every(
			([key, value]) => current.searchParams.get(key) === value,
		)
		if (
			window.location.pathname === target.pathname &&
			(!target.search || paramsMatch)
		) {
			return true
		}

		await new Promise(resolve => setTimeout(resolve, 120))
	}

	return false
}

export function PhantomConductor() {
	const router = useRouter()
	const { accessToken } = useAuthStore()
	const paceTimer = usePaceTimer()
	const isPrimaryCockpitRef = useRef(false)
	const releaseLockRef = useRef<(() => void) | null>(null)

	const postCommandStatus = useCallback(
		(
			command: DemoRemoteCommand,
			status: 'STARTED' | 'SUCCESS' | 'FAILED',
			detail?: string,
		) => {
			if (typeof window === 'undefined' || !command.commandId) return
			try {
				const channel = new BroadcastChannel(DEMO_BUS_NAME)
				channel.postMessage({
					type: 'COMMAND_STATUS',
					commandId: command.commandId,
					commandType: command.type,
					status,
					detail:
						detail ||
						(status === 'SUCCESS'
							? `Ready at ${window.location.pathname}${window.location.search}`
							: status),
					url: window.location.pathname + window.location.search,
					at: Date.now(),
				})
				channel.close()
			} catch {
				// Remote acknowledgement is diagnostic only; never block the cockpit.
			}
		},
		[],
	)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const cockpitId =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random()}`
		const channel = new BroadcastChannel(DEMO_BUS_NAME)
		let heartbeat: ReturnType<typeof setInterval> | null = null
		let retryTimer: ReturnType<typeof setTimeout> | null = null
		let disposed = false
		let channelClosed = false

		const announce = (status: 'ACTIVE' | 'STANDBY') => {
			if (channelClosed) return
			try {
				channel.postMessage({
					type: 'COCKPIT_STATUS',
					status,
					cockpitId,
					at: Date.now(),
				})
			} catch {
				// The browser can close BroadcastChannel during route teardown.
			}
		}

		const becomePrimary = () => {
			isPrimaryCockpitRef.current = true
			document.documentElement.classList.add('chefkix-demo-cockpit')
			announce('ACTIVE')
		}

		const becomeStandby = () => {
			isPrimaryCockpitRef.current = false
			document.documentElement.classList.remove('chefkix-demo-cockpit')
			announce('STANDBY')
		}

		const startStorageLock = () => {
			const claim = () => {
				try {
					const raw = localStorage.getItem(COCKPIT_LOCK_STORAGE_KEY)
					const current = raw
						? (JSON.parse(raw) as { cockpitId?: string; updatedAt?: number })
						: null
					const isStale =
						!current?.updatedAt ||
						Date.now() - current.updatedAt > COCKPIT_LOCK_STALE_MS

					if (
						!current?.cockpitId ||
						current.cockpitId === cockpitId ||
						isStale
					) {
						localStorage.setItem(
							COCKPIT_LOCK_STORAGE_KEY,
							JSON.stringify({ cockpitId, updatedAt: Date.now() }),
						)
						becomePrimary()
						return
					}

					becomeStandby()
				} catch {
					becomePrimary()
				}
			}

			claim()
			heartbeat = setInterval(claim, 1000)
		}

		const scheduleLockRetry = () => {
			if (disposed || retryTimer) return
			retryTimer = setTimeout(() => {
				retryTimer = null
				requestBrowserLock()
			}, 1000)
		}

		const requestBrowserLock = () => {
			if (disposed) return
			void navigator.locks
				.request(COCKPIT_LOCK_NAME, { ifAvailable: true }, async lock => {
					if (!lock) {
						becomeStandby()
						scheduleLockRetry()
						return
					}

					becomePrimary()
					await new Promise<void>(resolve => {
						releaseLockRef.current = resolve
						if (disposed) resolve()
					})
				})
				.catch(() => startStorageLock())
		}

		if ('locks' in navigator && navigator.locks?.request) {
			requestBrowserLock()
		} else {
			startStorageLock()
		}

		return () => {
			disposed = true
			releaseLockRef.current?.()
			if (heartbeat) clearInterval(heartbeat)
			if (retryTimer) clearTimeout(retryTimer)
			try {
				const raw = localStorage.getItem(COCKPIT_LOCK_STORAGE_KEY)
				const current = raw ? (JSON.parse(raw) as { cockpitId?: string }) : null
				if (current?.cockpitId === cockpitId) {
					localStorage.removeItem(COCKPIT_LOCK_STORAGE_KEY)
				}
			} catch {
				// ignore cleanup failures
			}
			becomeStandby()
			channelClosed = true
			channel.close()
		}
	}, [])

	const executeCommand = useCallback(
		async (command: DemoRemoteCommand) => {
			if (!isPrimaryCockpitRef.current) return
			postCommandStatus(command, 'STARTED')

			if (command.type === 'WARM_VAULT') {
				try {
					const vault = await warmTokenVault()
					const warmedCount = Object.keys(vault.tokens).length
					const ttlMinutes = vault.minExpiresInSeconds
						? Math.floor(vault.minExpiresInSeconds / 60)
						: 0
					postCommandStatus(
						command,
						'SUCCESS',
						`Vault warmed for ${warmedCount} persona(s), minimum TTL ${ttlMinutes} min`,
					)
				} catch (err) {
					const message =
						err instanceof Error ? err.message : 'Vault warm failed'
					postCommandStatus(command, 'FAILED', message)
				}
				return
			}

			if (command.type === 'PRELOAD') {
				try {
					let preloadToken =
						useAuthStore.getState().accessToken ||
						getDemoVault().tokens.testuser?.accessToken ||
						null
					if (!preloadToken || !isDemoVaultFresh('testuser')) {
						const vault = await warmTokenVault()
						preloadToken = vault.tokens.testuser?.accessToken || preloadToken
					}
					await preloadCriticalData(preloadToken)
					postCommandStatus(command, 'SUCCESS', 'Critical data preloaded')
				} catch (err) {
					const message =
						err instanceof Error ? err.message : 'Critical data preload failed'
					postCommandStatus(command, 'FAILED', message)
				}
				return
			}

			if (command.type === 'RETRY_BEAT') {
				try {
					const raw = localStorage.getItem('chefkix-demo-pace-timer-v1')
					const currentBeatIndex = raw
						? (JSON.parse(raw) as { currentBeatIndex?: unknown })
								.currentBeatIndex
						: null
					if (typeof currentBeatIndex === 'number') {
						await executeCommand({
							type: 'GOTO_BEAT',
							beatIndex: currentBeatIndex,
							commandId: command.commandId,
							issuedAt: command.issuedAt,
						})
					} else {
						postCommandStatus(command, 'FAILED', 'No current beat is available to retry')
					}
				} catch (err) {
					const message =
						err instanceof Error ? err.message : 'Retry beat failed'
					postCommandStatus(command, 'FAILED', message)
				}
				return
			}

			if (command.type === 'GHOST_DRIVER_BEAT') {
				try {
					const driver = getGhostDriver('main')
					driver.start()
					// Fallback to simple clicks based on beat (omni-demo logic adapted)
					if (command.beatIndex === 1) {
						// Hero Recipe
						await driver.click('a[href="/recipes/explore"]')
						await driver.wait(1000)
						await driver.hover('main a[href*="/recipes/"]', true)
						await driver.click('main a[href*="/recipes/"]')
						await driver.wait(2000)
					} else if (command.beatIndex === 2) {
						// Co-cook
						await driver.click('a[href="/cook-together"]')
						await driver.wait(1500)
						await driver.type('input[placeholder*="room" i]', 'ABC123')
						await driver.wait(500)
						await driver.click('button:has-text("Join Room")')
					}
					driver.stop()
					postCommandStatus(command, 'SUCCESS', 'Ghost driver beat finished')
				} catch (e) {
					console.error('Ghost Driver error', e)
					getGhostDriver('main').stop()
					const message =
						e instanceof Error ? e.message : 'Ghost driver beat failed'
					postCommandStatus(command, 'FAILED', message)
				}
				return
			}

			if (command.type === 'REWIND_SNAPSHOT') {
				const snapshotsRaw = sessionStorage.getItem(
					'chefkix-temporal-snapshots',
				)
				if (snapshotsRaw) {
					try {
						const snaps = JSON.parse(snapshotsRaw) as TemporalSnapshot[]
						if (snaps.length > 0) {
							const last = snaps.pop()!
							sessionStorage.setItem(
								'chefkix-temporal-snapshots',
								JSON.stringify(snaps),
							)

							// Restore
							useAuthStore.setState(last.authState)
							router.push(last.url)
							setTimeout(
								() =>
									window.scrollTo({ top: last.scrollY, behavior: 'instant' }),
								50,
							)
							console.log('⏪ Rewound 5 seconds')
						}
					} catch {
						/* ignore */
					}
				}
				return
			}

			if (command.type === 'SAFE_HARBOR') {
				router.push('/dashboard')
				const ready = await waitForRouteReady('/dashboard')
				postCommandStatus(
					command,
					ready ? 'SUCCESS' : 'FAILED',
					ready ? 'Dashboard ready' : 'Dashboard did not become ready',
				)
				return
			}

			if (command.type === 'CLEANUP' && accessToken) {
				postCommandStatus(command, 'SUCCESS', 'Cleanup started; cockpit may reload')
				await cleanupDemoState(accessToken)
				return
			}

			if (command.type === 'CLEANUP' && !accessToken) {
				postCommandStatus(command, 'FAILED', 'Cleanup requires an active token')
				return
			}

			if (
				command.type === 'GOTO_BEAT' &&
				typeof command.beatIndex === 'number'
			) {
				const beat = DEMO_PITCH_BEATS[command.beatIndex]
				if (!beat) {
					postCommandStatus(
						command,
						'FAILED',
						`Unknown beat index: ${command.beatIndex}`,
					)
					return
				}

				const firstAction = beat.actions[0]
				const shortcut = firstAction
					? getDemoPitchShortcut(firstAction)
					: undefined
				if (!shortcut) {
					postCommandStatus(command, 'FAILED', `No shortcut for beat: ${beat.title}`)
					return
				}

				// Hot-swap persona
				if (beat.personaUsername) {
					const vault = getDemoVault()
					if (!vault.isWarmed || !isDemoVaultFresh(beat.personaUsername)) {
						await warmTokenVault()
					}
					if (!swapPersonaFromVault(beat.personaUsername, true)) {
						postCommandStatus(
							command,
							'FAILED',
							`Demo persona unavailable or stale: ${beat.personaUsername}`,
						)
						return
					}
				}

				if (shortcut) {
					// We might need to get the latest access token from the store after swapping
					const latestToken = useAuthStore.getState().accessToken
					try {
						const resolved = await resolveDemoShortcut(shortcut, latestToken)
						if (resolved.copiedText) {
							await navigator.clipboard
								.writeText(resolved.copiedText)
								.catch(() => {})
						}
						router.push(resolved.path)
						// Update pace timer
						paceTimer.setBeat(command.beatIndex)
						const ready = await waitForRouteReady(resolved.path)
						postCommandStatus(
							command,
							ready ? 'SUCCESS' : 'FAILED',
							ready
								? `${beat.title} ready at ${resolved.path}`
								: `Beat route did not load: ${resolved.path}`,
						)
					} catch (err) {
						console.error('Phantom Conductor Navigation Failed', err)
						const message =
							err instanceof Error
								? err.message
								: 'Phantom conductor navigation failed'
						postCommandStatus(command, 'FAILED', message)
					}
				}
			}

			if (command.type === 'TOGGLE_QR_OVERLAY') {
				postCommandStatus(command, 'SUCCESS', 'QR overlay command delivered')
			}
		},
		[router, accessToken, paceTimer, postCommandStatus],
	)

	// BroadcastChannel listener
	useEffect(() => {
		if (typeof window === 'undefined') return
		const channel = new BroadcastChannel(DEMO_BUS_NAME)
		channel.onmessage = (event: MessageEvent<DemoRemoteCommand>) => {
			if (!DEMO_REMOTE_COMMAND_TYPES.has(event.data?.type)) return
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
				const currentIndexStr = localStorage.getItem(
					'chefkix-demo-pace-timer-v1',
				)
				if (currentIndexStr) {
					try {
						const state = JSON.parse(currentIndexStr)
						if (typeof state.currentBeatIndex === 'number') {
							void executeCommand({
								type: 'GOTO_BEAT',
								beatIndex: state.currentBeatIndex,
							})
						}
					} catch {
						/* ignore */
					}
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
			if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
				return
			}
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
		if (typeof navigator === 'undefined') return
		const channel = new BroadcastChannel(DEMO_BUS_NAME)
		let channelClosed = false
		const postWakeStatus = (status: string) => {
			if (channelClosed) return
			try {
				channel.postMessage({ type: 'WAKE_LOCK_STATUS', status })
			} catch {
				// Ignore teardown races.
			}
		}
		if (!('wakeLock' in navigator)) {
			postWakeStatus('UNSUPPORTED')
			channelClosed = true
			channel.close()
			return
		}
		let wakeLock: WakeLockSentinel | null = null
		let wakeLockRequestBlocked = false
		let wakeLockRequestInFlight = false

		const requestWakeLock = async () => {
			if (
				!isPrimaryCockpitRef.current ||
				wakeLock ||
				wakeLockRequestBlocked ||
				wakeLockRequestInFlight
			)
				return
			wakeLockRequestInFlight = true
			try {
				wakeLock = await navigator.wakeLock.request('screen')
				wakeLockRequestBlocked = false
				postWakeStatus('LOCKED')
				wakeLock.addEventListener('release', () => {
					wakeLock = null
					postWakeStatus('RELEASED')
					console.log('Screen Wake Lock released')
				})
			} catch {
				// The remote surfaces this as ERROR; avoid console warning spam when
				// browsers deny wake lock in automation, low-power, or background states.
				wakeLockRequestBlocked = true
				postWakeStatus('ERROR')
			} finally {
				wakeLockRequestInFlight = false
			}
		}

		void requestWakeLock()

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				wakeLockRequestBlocked = false
				void requestWakeLock()
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			if (wakeLock) void wakeLock.release()
			channelClosed = true
			channel.close()
		}
	}, [])

	// Heartbeat Radar (every 1.5 seconds)
	useEffect(() => {
		if (typeof window === 'undefined') return
		const channel = new BroadcastChannel(DEMO_BUS_NAME)
		const interval = setInterval(async () => {
			if (!isPrimaryCockpitRef.current) return
			const start = performance.now()
			try {
				const baseUrl = getDemoBaseUrl()
				// Use a lightweight endpoint to ping
				await fetch(`${baseUrl}/api/v1/actuator/health`, {
					signal: AbortSignal.timeout(2000),
				}).catch(() => {})
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
					authState: useAuthStore.getState(),
				}
				const raw = sessionStorage.getItem('chefkix-temporal-snapshots')
				let snaps: TemporalSnapshot[] = []
				if (raw) snaps = JSON.parse(raw)
				snaps.push(current)
				if (snaps.length > 10) snaps.shift() // keep last 10
				sessionStorage.setItem(
					'chefkix-temporal-snapshots',
					JSON.stringify(snaps),
				)
			} catch {
				/* ignore */
			}
		}, 5000)
		return () => clearInterval(interval)
	}, [])

	return <DemoQROverlay />
}
