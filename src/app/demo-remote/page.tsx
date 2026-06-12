'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
	DEMO_PITCH_BEATS,
	runPreShowChecklist,
	warmTokenVault,
	preloadCriticalData,
	getDemoVault,
	getDemoEnvMode,
	setDemoEnvMode,
	loadDemoReadinessReport,
	getBeatReadinessStatus,
	getDemoPitchShortcut,
	type DemoEnvMode,
	type DemoReadinessReport,
	type PreShowReport,
} from '@/components/dev/demo-config'
import { usePaceTimerState, formatTime } from '@/components/dev/PaceTimer'
import type { DemoRemoteCommand } from '@/components/dev/PhantomConductor'
import { DEMO_PITCH_SCRIPT } from '@/components/dev/demo-script'
import {
	applyDemoCockpitStatus,
	type DemoCockpitPresence,
} from '@/lib/demo-cockpit-presence'
import styles from './demo-remote.module.css'

type CommandRunStatus = 'queued' | 'running' | 'success' | 'failed'

const COMMAND_ACK_TIMEOUT_MS = 20000
const COMMAND_COMPLETION_TIMEOUT_MS = 270000

interface CommandRun {
	commandId: string
	type: DemoRemoteCommand['type']
	status: CommandRunStatus
	detail: string
	url?: string
	issuedAt: number
	updatedAt: number
}

export default function DemoRemote() {
	const timer = usePaceTimerState()
	const [channel, setChannel] = useState<BroadcastChannel | null>(null)
	const [preShowReport, setPreShowReport] = useState<PreShowReport | null>(null)
	const [isRunningChecks, setIsRunningChecks] = useState(false)
	const [flashMsg, setFlashMsg] = useState<string | null>(null)
	const [commandRuns, setCommandRuns] = useState<CommandRun[]>([])
	const [readinessReport, setReadinessReport] =
		useState<DemoReadinessReport | null>(null)

	const [envMode, setEnvModeState] = useState<DemoEnvMode>('cloud')
	const [latency, setLatency] = useState<number>(0)
	const [latencyHistory, setLatencyHistory] = useState<number[]>([])
	const [cockpitStatus, setCockpitStatus] = useState<
		'ACTIVE' | 'STANDBY' | 'UNKNOWN'
	>('UNKNOWN')
	const cockpitPresenceRef = useRef<DemoCockpitPresence>({
		activeCockpitId: null,
		status: 'UNKNOWN',
	})
	const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [wakeLockStatus, setWakeLockStatus] = useState<string>('UNKNOWN')

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setEnvModeState(getDemoEnvMode())
			const ch = new BroadcastChannel('chefkix-demo-bus')
			ch.onmessage = e => {
				if (e.data?.type === 'RADAR_PING') {
					setLatency(e.data.latency)
					setLatencyHistory(prev => [...prev.slice(-20), e.data.latency])
					setCockpitStatus('ACTIVE')
					cockpitPresenceRef.current = {
						...cockpitPresenceRef.current,
						status: 'ACTIVE',
					}

					if (heartbeatTimeoutRef.current) {
						clearTimeout(heartbeatTimeoutRef.current)
					}
					heartbeatTimeoutRef.current = setTimeout(() => {
						setCockpitStatus('UNKNOWN')
						cockpitPresenceRef.current = {
							...cockpitPresenceRef.current,
							status: 'UNKNOWN',
						}
					}, 3000)
				}
				if (e.data?.type === 'COCKPIT_STATUS') {
					const nextPresence = applyDemoCockpitStatus(
						cockpitPresenceRef.current,
						e.data,
					)
					cockpitPresenceRef.current = nextPresence
					setCockpitStatus(nextPresence.status)
				}
				if (e.data?.type === 'WAKE_LOCK_STATUS') {
					setWakeLockStatus(String(e.data.status || 'UNKNOWN'))
				}
				if (e.data?.type === 'COMMAND_STATUS' && e.data.commandId) {
					setCommandRuns(prev => {
						let matched = false
						const status: CommandRunStatus =
							e.data.status === 'SUCCESS'
								? 'success'
								: e.data.status === 'FAILED'
									? 'failed'
									: 'running'
						const updatedAt =
							typeof e.data.at === 'number' ? e.data.at : Date.now()
						const next = prev.map(run => {
							if (run.commandId !== e.data.commandId) return run
							matched = true
							return {
								...run,
								status,
								detail: String(e.data.detail || e.data.status || ''),
								url: typeof e.data.url === 'string' ? e.data.url : run.url,
								updatedAt,
							}
						})

						if (matched) return next

						return [
							{
								commandId: String(e.data.commandId),
								type: e.data.commandType as DemoRemoteCommand['type'],
								status,
								detail: String(e.data.detail || e.data.status || ''),
								url: typeof e.data.url === 'string' ? e.data.url : undefined,
								issuedAt: updatedAt,
								updatedAt,
							},
							...prev,
						].slice(0, 8)
					})
				}
			}
			setChannel(ch)
			return () => {
				if (heartbeatTimeoutRef.current) {
					clearTimeout(heartbeatTimeoutRef.current)
				}
				ch.close()
			}
		}
	}, [])

	useEffect(() => {
		void loadDemoReadinessReport().then(setReadinessReport)
	}, [])

	const flash = useCallback((msg: string) => {
		setFlashMsg(msg)
		setTimeout(() => setFlashMsg(null), 2000)
	}, [])

	const commandBlockReason = !channel
		? 'Remote bus is not connected'
		: cockpitStatus !== 'ACTIVE'
			? 'Cockpit heartbeat is not active. Open /demo-cockpit on the main screen before sending commands.'
			: null

	const sendCommand = useCallback(
		(cmd: DemoRemoteCommand) => {
			if (!channel || commandBlockReason) {
				flash(commandBlockReason || 'Remote bus is not connected')
				return
			}

			const commandId =
				typeof crypto !== 'undefined' && 'randomUUID' in crypto
					? crypto.randomUUID()
					: `${Date.now()}-${Math.random()}`
			const issuedAt = Date.now()
			const run: CommandRun = {
				commandId,
				type: cmd.type,
				status: 'queued',
				detail: 'Waiting for cockpit acknowledgement',
				issuedAt,
				updatedAt: issuedAt,
			}
			setCommandRuns(prev => [run, ...prev].slice(0, 8))
			setTimeout(() => {
				channel.postMessage({ ...cmd, commandId, issuedAt })
			}, 25)
			flash(`Queued: ${cmd.type}`)

			setTimeout(() => {
				setCommandRuns(prev =>
					prev.map(item =>
						item.commandId === commandId && item.status === 'queued'
							? {
									...item,
									status: 'failed',
									detail:
										'No cockpit STARTED acknowledgement within 20 seconds',
									updatedAt: Date.now(),
								}
							: item,
					),
				)
			}, COMMAND_ACK_TIMEOUT_MS)

			setTimeout(() => {
				setCommandRuns(prev =>
					prev.map(item =>
						item.commandId === commandId &&
						(item.status === 'queued' || item.status === 'running')
							? {
									...item,
									status: 'failed',
									detail: 'Cockpit command did not finish within 270 seconds',
									updatedAt: Date.now(),
								}
							: item,
					),
				)
			}, COMMAND_COMPLETION_TIMEOUT_MS)
		},
		[channel, commandBlockReason, flash],
	)

	const runChecks = async () => {
		if (commandBlockReason) {
			flash(commandBlockReason)
			return
		}
		setIsRunningChecks(true)
		try {
			const vault = await warmTokenVault()
			let token = vault.tokens.testuser?.accessToken ?? null
			sendCommand({ type: 'WARM_VAULT' })
			sendCommand({ type: 'PRELOAD' })

			// Preload critical data to cache
			await preloadCriticalData(token)

			// Need a token to pass to checklist? In the real pitch, you warm vault and use testuser
			// For remote, we'll try to find a token in local storage or just pass null
			try {
				const storageStr = localStorage.getItem('auth-storage')
				if (!token && storageStr) {
					token = JSON.parse(storageStr)?.state?.accessToken || null
				}
			} catch {}

			const report = await runPreShowChecklist(token)
			setPreShowReport(report)
		} finally {
			setIsRunningChecks(false)
		}
	}

	const latestCommand = commandRuns[0]
	const isCockpitBusy =
		latestCommand?.status === 'queued' || latestCommand?.status === 'running'
	const isControlBlocked = Boolean(commandBlockReason) || isCockpitBusy
	const wakeLockIssue =
		wakeLockStatus === 'ERROR' || wakeLockStatus === 'UNSUPPORTED'
	const operatorGateColor = commandBlockReason
		? '#f85149'
		: wakeLockIssue
			? '#d29922'
			: '#3fb950'
	const operatorGateLabel = commandBlockReason
		? 'NO CONTROL'
		: wakeLockIssue
			? 'CONTROL WITH WAKE RISK'
			: 'CONTROL LIVE'
	const operatorGateDetail =
		commandBlockReason ||
		(wakeLockIssue
			? `Wake lock is ${wakeLockStatus}. Keep the laptop plugged in and set display sleep manually.`
			: 'Cockpit heartbeat is live. Commands remain manually paced.')
	const commandColor =
		latestCommand?.status === 'success'
			? '#3fb950'
			: latestCommand?.status === 'failed'
				? '#f85149'
				: latestCommand
					? '#d29922'
					: '#8b949e'

	return (
		<div className={styles.page}>
			<div className={styles.shell}>
				<header
					className={styles.header}
					style={{
						marginBottom: 24,
						paddingBottom: 16,
						borderBottom: '1px solid #30363d',
					}}
				>
					<div>
						<h1 style={{ margin: 0, fontSize: 24 }}>Phantom Remote</h1>
						<div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
							Control the main screen via BroadcastChannel
						</div>
					</div>
					<div className={styles.headerControls}>
						{flashMsg && (
							<div style={{ color: '#3fb950', fontSize: 14, fontWeight: 600 }}>
								{flashMsg}
							</div>
						)}

						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								background: '#161b22',
								border: '1px solid #30363d',
								borderRadius: 6,
								padding: '4px 8px',
								gap: 12,
							}}
						>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
								}}
							>
								<div
									style={{
										fontSize: 10,
										textTransform: 'uppercase',
										color: '#8b949e',
									}}
								>
									Radar
								</div>
								<div
									style={{
										fontSize: 14,
										fontWeight: 600,
										color:
											latency > 800
												? '#f85149'
												: latency > 300
													? '#d29922'
													: '#3fb950',
									}}
								>
									{latency}ms
								</div>
								<div
									style={{
										fontSize: 10,
										fontWeight: 700,
										color:
											cockpitStatus === 'ACTIVE'
												? '#3fb950'
												: cockpitStatus === 'STANDBY'
													? '#d29922'
													: '#8b949e',
									}}
								>
									{cockpitStatus}
								</div>
								<div
									style={{
										fontSize: 10,
										fontWeight: 700,
										color:
											wakeLockStatus === 'LOCKED'
												? '#3fb950'
												: wakeLockStatus === 'ERROR' ||
													  wakeLockStatus === 'UNSUPPORTED'
													? '#f85149'
													: '#8b949e',
									}}
								>
									WAKE {wakeLockStatus}
								</div>
							</div>
							<div
								style={{
									display: 'flex',
									alignItems: 'flex-end',
									height: 24,
									width: 40,
									gap: 1,
								}}
							>
								{latencyHistory.map((l, i) => (
									<div
										key={i}
										style={{
											width: 2,
											background: l > 800 ? '#f85149' : '#3fb950',
											height: `${Math.min(100, (l / 1000) * 100)}%`,
										}}
									/>
								))}
							</div>
						</div>

						<div
							style={{
								display: 'flex',
								background: '#161b22',
								border: '1px solid #30363d',
								borderRadius: 6,
								overflow: 'hidden',
							}}
						>
							<button
								onClick={() => {
									setDemoEnvMode('cloud')
									setEnvModeState('cloud')
								}}
								style={{
									background: envMode === 'cloud' ? '#3fb950' : 'transparent',
									color: envMode === 'cloud' ? '#fff' : '#8b949e',
									border: 'none',
									padding: '8px 12px',
									fontSize: 12,
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								☁️ Cloud Live
							</button>
							<button
								onClick={() => {
									setDemoEnvMode('local')
									setEnvModeState('local')
								}}
								style={{
									background: envMode === 'local' ? '#d29922' : 'transparent',
									color: envMode === 'local' ? '#fff' : '#8b949e',
									border: 'none',
									padding: '8px 12px',
									fontSize: 12,
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								💻 Local Demo
							</button>
						</div>
					</div>
				</header>

				<section
					className={styles.authority}
					style={{
						background: '#161b22',
						border: `2px solid ${operatorGateColor}`,
						borderRadius: 8,
						padding: 16,
						marginBottom: 24,
						gap: 16,
					}}
				>
					<div>
						<div
							style={{
								fontSize: 11,
								textTransform: 'uppercase',
								color: '#8b949e',
								fontWeight: 800,
							}}
						>
							Presenter command authority
						</div>
						<div
							style={{
								marginTop: 4,
								fontSize: 20,
								fontWeight: 900,
								color: operatorGateColor,
							}}
						>
							{operatorGateLabel}
						</div>
					</div>
					<div
						className={styles.authorityDetail}
						style={{ color: '#c9d1d9', fontSize: 14 }}
					>
						{operatorGateDetail}
					</div>
				</section>

				<div
					className={styles.workspaceGrid}
					style={{
						gap: 24,
						alignItems: 'start',
					}}
				>
					{/* LEFT COL: PACING & PANIC */}
					<div className={styles.workspaceColumn}>
						<section
							style={{
								background: '#161b22',
								border: `1px solid ${timer.paceColor}`,
								borderRadius: 8,
								padding: 16,
							}}
						>
							<h2
								style={{
									fontSize: 12,
									textTransform: 'uppercase',
									color: '#8b949e',
									margin: '0 0 12px 0',
								}}
							>
								Current Pace
							</h2>

							{timer.beat ? (
								<>
									<div
										style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}
									>
										{timer.beat.title}
									</div>
									<div
										style={{
											fontSize: 32,
											fontWeight: 700,
											color: timer.paceColor,
											fontVariantNumeric: 'tabular-nums',
										}}
									>
										{formatTime(timer.rawElapsedMs)}
									</div>
									<div
										style={{
											fontSize: 14,
											color: '#8b949e',
											marginBottom: 12,
											display: 'flex',
											justifyContent: 'space-between',
										}}
									>
										<span>Budget: {timer.budgetMinutes}:00</span>
										<span>Total Time: {formatTime(timer.totalElapsedMs)}</span>
									</div>

									<div style={{ display: 'flex', gap: 8 }}>
										<button
											onClick={() => {
												if (
													timer.state.beatStartedAt &&
													!timer.state.isPaused
												) {
													sendCommand({ type: 'PAUSE_TIMER' })
												} else if (timer.state.isPaused) {
													sendCommand({ type: 'RESUME_TIMER' })
												} else {
													sendCommand({ type: 'START_TIMER' })
												}
											}}
											style={{
												flex: 1,
												background:
													timer.state.beatStartedAt && !timer.state.isPaused
														? '#d29922'
														: '#238636',
												color: '#fff',
												border: 'none',
												padding: '8px',
												borderRadius: 4,
												cursor: 'pointer',
											}}
										>
											{timer.state.beatStartedAt && !timer.state.isPaused
												? 'Pause'
												: timer.state.isPaused
													? 'Resume'
													: 'Start'}
										</button>
										<button
											onClick={() => {
												sendCommand({ type: 'RESET_TIMER' })
											}}
											style={{
												background: '#21262d',
												color: '#e6edf3',
												border: '1px solid #30363d',
												padding: '8px',
												borderRadius: 4,
												cursor: 'pointer',
											}}
										>
											Reset
										</button>
									</div>
								</>
							) : (
								<div style={{ color: '#8b949e', fontStyle: 'italic' }}>
									Timer not active
								</div>
							)}
						</section>

						<section
							data-testid='demo-command-gate'
							data-command-id={latestCommand?.commandId || ''}
							data-command-status={latestCommand?.status || 'idle'}
							data-command-type={latestCommand?.type || ''}
							style={{
								background: '#161b22',
								border: `1px solid ${commandColor}`,
								borderRadius: 8,
								padding: 16,
							}}
						>
							<h2
								style={{
									fontSize: 12,
									textTransform: 'uppercase',
									color: '#8b949e',
									margin: '0 0 12px 0',
								}}
							>
								Cockpit Command Gate
							</h2>
							{latestCommand ? (
								<div style={{ display: 'grid', gap: 8 }}>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											gap: 12,
											alignItems: 'center',
										}}
									>
										<div style={{ fontSize: 13, fontWeight: 700 }}>
											{latestCommand.type}
										</div>
										<div
											style={{
												color: commandColor,
												fontSize: 12,
												fontWeight: 800,
												textTransform: 'uppercase',
											}}
										>
											{latestCommand.status}
										</div>
									</div>
									<div style={{ color: '#c9d1d9', fontSize: 12 }}>
										{latestCommand.detail}
									</div>
									{latestCommand.url && (
										<div style={{ color: '#8b949e', fontSize: 11 }}>
											Cockpit: {latestCommand.url}
										</div>
									)}
									<div style={{ color: '#8b949e', fontSize: 11 }}>
										Advance only when the status is green. Panic controls remain
										live.
									</div>
								</div>
							) : (
								<div style={{ color: '#8b949e', fontSize: 12 }}>
									No command sent yet. Use Run Checks, then drive one beat at a
									time.
								</div>
							)}
						</section>

						<section
							style={{
								background: '#161b22',
								border: '1px solid #30363d',
								borderRadius: 8,
								padding: 16,
							}}
						>
							<h2
								style={{
									fontSize: 12,
									textTransform: 'uppercase',
									color: '#8b949e',
									margin: '0 0 12px 0',
								}}
							>
								Panic Actions
							</h2>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								<button
									onClick={() => sendCommand({ type: 'SAFE_HARBOR' })}
									style={{
										background: '#0d1117',
										color: '#e6edf3',
										border: '1px solid #30363d',
										padding: '12px',
										borderRadius: 4,
										cursor: 'pointer',
										textAlign: 'left',
										fontWeight: 600,
									}}
								>
									⚓ Safe Harbor (Dashboard)
								</button>
								<button
									onClick={() => sendCommand({ type: 'WARM_VAULT' })}
									style={{
										background: '#0d1117',
										color: '#3fb950',
										border: '1px solid #238636',
										padding: '12px',
										borderRadius: 4,
										cursor: 'pointer',
										textAlign: 'left',
										fontWeight: 600,
									}}
								>
									Warm Cockpit Vault
								</button>
								<button
									onClick={() => sendCommand({ type: 'PRELOAD' })}
									style={{
										background: '#0d1117',
										color: '#58a6ff',
										border: '1px solid #1f6feb',
										padding: '12px',
										borderRadius: 4,
										cursor: 'pointer',
										textAlign: 'left',
										fontWeight: 600,
									}}
								>
									Preload Cockpit Data
								</button>
								<button
									onClick={() => sendCommand({ type: 'CLEANUP' })}
									style={{
										background: '#0d1117',
										color: '#d29922',
										border: '1px solid #d29922',
										padding: '12px',
										borderRadius: 4,
										cursor: 'pointer',
										textAlign: 'left',
										fontWeight: 600,
									}}
								>
									🧹 Force Cleanup State
								</button>
								<button
									onClick={() => sendCommand({ type: 'RETRY_BEAT' })}
									style={{
										background: '#0d1117',
										color: '#e6edf3',
										border: '1px solid #30363d',
										padding: '12px',
										borderRadius: 4,
										cursor: 'pointer',
										textAlign: 'left',
										fontWeight: 600,
									}}
								>
									🔄 Retry Current Beat
								</button>
								<button
									onClick={() => sendCommand({ type: 'REWIND_SNAPSHOT' })}
									style={{
										background: '#0d1117',
										color: '#58a6ff',
										border: '1px solid #1f6feb',
										padding: '12px',
										borderRadius: 4,
										cursor: 'pointer',
										textAlign: 'left',
										fontWeight: 600,
									}}
								>
									⏪ Rewind 5s Snapshot
								</button>
								<button
									onClick={() => sendCommand({ type: 'TOGGLE_QR_OVERLAY' })}
									style={{
										background: '#0d1117',
										color: '#8b949e',
										border: '1px solid #30363d',
										padding: '12px',
										borderRadius: 4,
										cursor: 'pointer',
										textAlign: 'left',
										fontWeight: 600,
									}}
								>
									📡 Toggle QR Overlay
								</button>
							</div>
						</section>
					</div>

					{/* RIGHT COL: BEATS & CHECKLIST */}
					<div className={styles.workspaceColumn}>
						<section
							style={{
								background: '#161b22',
								border: '1px solid #30363d',
								borderRadius: 8,
								padding: 16,
							}}
						>
							<h2
								style={{
									fontSize: 12,
									textTransform: 'uppercase',
									color: '#8b949e',
									margin: '0 0 12px 0',
								}}
							>
								Pitch Flow
							</h2>
							<div
								style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}
							>
								{DEMO_PITCH_BEATS.map((beat, idx) => {
									const readiness = getBeatReadinessStatus(
										beat,
										readinessReport,
									)
									const blocked = isControlBlocked || readiness !== 'ready'
									return (
										<button
											key={beat.id}
											disabled={blocked}
											onClick={() =>
												sendCommand({ type: 'GOTO_BEAT', beatIndex: idx })
											}
											style={{
												background:
													timer.state.currentBeatIndex === idx
														? '#1f6feb22'
														: '#0d1117',
												border: `1px solid ${timer.state.currentBeatIndex === idx ? '#1f6feb' : '#30363d'}`,
												color: '#e6edf3',
												padding: '12px',
												borderRadius: 4,
												cursor: blocked ? 'not-allowed' : 'pointer',
												opacity: blocked ? 0.55 : 1,
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
											}}
										>
											<div>
												<div
													style={{
														fontSize: 11,
														color: '#8b949e',
														textAlign: 'left',
														marginBottom: 2,
													}}
												>
													Beat {idx + 1}
												</div>
												<div style={{ fontSize: 14, fontWeight: 600 }}>
													{beat.title}
												</div>
												<div
													style={{
														fontSize: 10,
														color:
															readiness === 'ready'
																? '#3fb950'
																: readiness === 'warning'
																	? '#d29922'
																	: '#f85149',
														textAlign: 'left',
														marginTop: 4,
													}}
												>
													{readiness || 'unresolved'}
												</div>
											</div>
										</button>
									)
								})}
							</div>
						</section>
					</div>

					{/* RIGHT COL: TELEPROMPTER & CHECKLIST */}
					<div className={styles.teleprompterColumn}>
						<section
							style={{
								background: '#0d1117',
								border: `2px solid ${timer.paceColor}`,
								borderRadius: 8,
								padding: 24,
							}}
						>
							<h2
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
									color: timer.paceColor,
									margin: '0 0 16px 0',
									fontWeight: 700,
								}}
							>
								Live Teleprompter
							</h2>

							{(() => {
								const currentBeat =
									DEMO_PITCH_BEATS[timer.state.currentBeatIndex]
								const currentReadiness = currentBeat
									? getBeatReadinessStatus(currentBeat, readinessReport)
									: null
								const script = currentBeat
									? DEMO_PITCH_SCRIPT[currentBeat.id]
									: null
								if (!script)
									return (
										<div style={{ color: '#8b949e' }}>
											No script found for this beat.
										</div>
									)

								return (
									<div>
										<div
											className={styles.teleprompterHeader}
											style={{
												alignItems: 'flex-start',
												marginBottom: 8,
											}}
										>
											<div style={{ fontSize: 24, fontWeight: 700 }}>
												{script.title}
											</div>
											<button
												disabled={
													isControlBlocked || currentReadiness !== 'ready'
												}
												onClick={() =>
													sendCommand({
														type: 'GHOST_DRIVER_BEAT',
														beatIndex: timer.state.currentBeatIndex,
													})
												}
												style={{
													background: '#21262d',
													color: '#ff7b72',
													border: '1px solid #30363d',
													padding: '6px 12px',
													borderRadius: 4,
													cursor:
														isControlBlocked || currentReadiness !== 'ready'
															? 'not-allowed'
															: 'pointer',
													opacity:
														isControlBlocked || currentReadiness !== 'ready'
															? 0.6
															: 1,
													fontSize: 12,
													fontWeight: 600,
												}}
											>
												👻 Autopilot Beat
											</button>
										</div>
										<div
											style={{
												fontSize: 16,
												color: '#8b949e',
												fontStyle: 'italic',
												marginBottom: 24,
											}}
										>
											{script.objective}
										</div>

										<div style={{ marginBottom: 24 }}>
											<h3
												style={{
													fontSize: 12,
													textTransform: 'uppercase',
													color: '#c9d1d9',
													marginBottom: 10,
												}}
											>
												Manual scene controls
											</h3>
											<div
												className={styles.sceneGrid}
												style={{
													gap: 8,
												}}
											>
												{currentBeat.actions.map(actionId => {
													const shortcut = getDemoPitchShortcut(actionId)
													const readiness = getBeatReadinessStatus(
														currentBeat,
														readinessReport,
													)
													const blocked =
														isControlBlocked ||
														readiness !== 'ready' ||
														!shortcut
													return (
														<button
															key={actionId}
															disabled={blocked}
															onClick={() =>
																sendCommand({
																	type: 'GOTO_ACTION',
																	actionId,
																})
															}
															style={{
																background: '#161b22',
																color: blocked ? '#6e7681' : '#e6edf3',
																border: '1px solid #30363d',
																padding: '10px',
																borderRadius: 4,
																cursor: blocked ? 'not-allowed' : 'pointer',
																textAlign: 'left',
																fontSize: 12,
																fontWeight: 600,
															}}
														>
															{shortcut?.label || actionId}
														</button>
													)
												})}
											</div>
										</div>

										<div style={{ marginBottom: 24 }}>
											<h3
												style={{
													fontSize: 12,
													textTransform: 'uppercase',
													color: '#c9d1d9',
													marginBottom: 12,
													borderBottom: '1px solid #30363d',
													paddingBottom: 4,
												}}
											>
												Live Proof To Point At
											</h3>
											<div
												style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
											>
												{script.proofPoints.map((proofPoint, i) => (
													<div
														key={i}
														style={{
															background: '#1f6feb22',
															color: '#58a6ff',
															padding: '8px 12px',
															borderRadius: 4,
															fontSize: 18,
															fontWeight: 700,
															border: '1px solid #1f6feb',
														}}
													>
														{proofPoint}
													</div>
												))}
											</div>
										</div>

										<div style={{ marginBottom: 24 }}>
											<h3
												style={{
													fontSize: 12,
													textTransform: 'uppercase',
													color: '#c9d1d9',
													marginBottom: 12,
													borderBottom: '1px solid #30363d',
													paddingBottom: 4,
												}}
											>
												Key Prompts
											</h3>
											<ul
												style={{
													margin: 0,
													paddingLeft: 20,
													display: 'flex',
													flexDirection: 'column',
													gap: 12,
												}}
											>
												{script.prompts.map((p, i) => (
													<li
														key={i}
														style={{
															fontSize: 18,
															lineHeight: 1.5,
															color: '#e6edf3',
														}}
													>
														{p}
													</li>
												))}
											</ul>
										</div>

										<div
											style={{
												background: '#21262d',
												padding: 16,
												borderRadius: 8,
												borderLeft: '4px solid #d29922',
											}}
										>
											<div
												style={{
													fontSize: 11,
													textTransform: 'uppercase',
													color: '#d29922',
													marginBottom: 4,
													fontWeight: 700,
												}}
											>
												Fallback Transition
											</div>
											<div
												style={{
													fontSize: 16,
													fontStyle: 'italic',
													color: '#c9d1d9',
												}}
											>
												&quot;{script.fallbackLine}&quot;
											</div>
										</div>
									</div>
								)
							})()}
						</section>

						<section
							style={{
								background: '#161b22',
								border: '1px solid #30363d',
								borderRadius: 8,
								padding: 16,
							}}
						>
							<div
								className={styles.checklistHeader}
								style={{
									alignItems: 'center',
									marginBottom: 12,
								}}
							>
								<h2
									style={{
										fontSize: 12,
										textTransform: 'uppercase',
										color: '#8b949e',
										margin: 0,
									}}
								>
									Pre-Show Checklist
								</h2>
								<button
									onClick={runChecks}
									disabled={isRunningChecks || Boolean(commandBlockReason)}
									style={{
										background: '#21262d',
										color: '#e6edf3',
										border: '1px solid #30363d',
										padding: '6px 12px',
										borderRadius: 4,
										cursor:
											isRunningChecks || commandBlockReason
												? 'not-allowed'
												: 'pointer',
										opacity: commandBlockReason ? 0.55 : 1,
									}}
								>
									{isRunningChecks ? 'Running...' : 'Run Checks'}
								</button>
							</div>

							{preShowReport && (
								<div style={{ borderTop: '1px solid #30363d', paddingTop: 12 }}>
									<div
										style={{
											marginBottom: 12,
											fontSize: 14,
											fontWeight: 600,
											color:
												preShowReport.verdict === 'GO'
													? '#3fb950'
													: preShowReport.verdict === 'NO-GO'
														? '#f85149'
														: '#d29922',
										}}
									>
										Verdict: {preShowReport.verdict}
									</div>
									<div style={{ display: 'grid', gap: 6 }}>
										{preShowReport.checks.map(c => (
											<div
												key={c.id}
												style={{
													display: 'flex',
													gap: 8,
													fontSize: 12,
													padding: '8px',
													background: '#0d1117',
													borderRadius: 4,
													border: '1px solid #30363d',
												}}
											>
												<div
													style={{
														color:
															c.status === 'pass'
																? '#3fb950'
																: c.status === 'fail'
																	? '#f85149'
																	: '#d29922',
														width: 60,
														fontWeight: 600,
														textTransform: 'uppercase',
													}}
												>
													{c.status}
												</div>
												<div style={{ flex: 1, color: '#c9d1d9' }}>
													<strong>{c.label}:</strong> {c.detail}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</section>
					</div>
				</div>
			</div>
		</div>
	)
}
