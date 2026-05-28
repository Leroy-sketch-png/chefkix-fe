'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
	DEMO_BASE_URL,
	DEMO_PITCH_BEATS,
	DEMO_PITCH_SHORTCUTS,
	DEMO_ROUTES,
	DEMO_WIDGET_ACCOUNTS,
	getBeatReadinessStatus,
	getDemoPitchShortcut,
	loadDemoReadinessReport,
	resetDemoReadinessCache,
	resolveDemoShortcut,
	type DemoReadinessReport,
	type DemoReadinessStatus,
	type DemoPitchShortcut,
} from './demo-config'

// Only render in development
const IS_DEV = process.env.NODE_ENV === 'development'

const BASE = DEMO_BASE_URL

interface OrchestratorProgressSnapshot {
	status: string | null
	strictAssertionFailures: number | null
	renderAnomalies: number | null
	beatsWithEvidence: number | null
	beatsWithValueArc: number | null
	beatsWithPhaseCoverage: number | null
	expectedBeats: number | null
	beatFallbacks: number | null
	beatSceneFallbacks: number | null
	beatRouteFallbacks: number | null
	consoleErrors: number | null
	pageErrors: number | null
	requestFailures: number | null
	http5xxResponses: number | null
	warningCount: number | null
	errorCount: number | null
	preflightCoreStatus: string | null
	beatEvidenceRate: number | null
	beatValueArcRate: number | null
	beatPhaseCoverageRate: number | null
	criticalFindings: string[]
}

interface OrchestratorTaskSnapshot {
	taskId: string
	mode: 'single-strict' | 'certify-strict'
	startedAt: string
	endedAt: string | null
	status: 'running' | 'passed' | 'failed' | 'stopped'
	exitCode: number | null
	command: string
	artifactDir: string | null
	runId: string | null
	recentOutput: string[]
	errorMessage: string | null
	runtimeAgeSec: number
	lastOutputAgeSec: number
	maxRuntimeSec: number
	watchdogRisk: 'healthy' | 'warning' | 'critical'
}

interface OrchestratorPreflightSnapshot {
	backendBaseUrl: string
	backendHealthUrl: string
	authProbeUrl: string
	runningTaskCount: number
	maxConcurrentRunningTasks: number
	launchCapacityAvailable: boolean
	backendHealthOk: boolean
	authProbeOk: boolean
	backendHealthStatusCode: number | null
	authProbeStatusCode: number | null
	errorMessage: string | null
	checkedAt: string
}

function OriginalDemoWidget() {
	const [isOpen, setIsOpen] = useState(false)
	const [isMinimized, setIsMinimized] = useState(false)
	const [backendStatus, setBackendStatus] = useState<
		'checking' | 'up' | 'down'
	>('checking')
	const [isLoggingIn, setIsLoggingIn] = useState(false)
	const [activeShortcut, setActiveShortcut] = useState<string | null>(null)
	const [flashMessage, setFlashMessage] = useState<string | null>(null)
	const [hardBlockMode, setHardBlockMode] = useState(true)
	const [orchestratorTask, setOrchestratorTask] =
		useState<OrchestratorTaskSnapshot | null>(null)
	const [orchestratorProgress, setOrchestratorProgress] =
		useState<OrchestratorProgressSnapshot | null>(null)
	const [orchestratorTaskList, setOrchestratorTaskList] = useState<
		OrchestratorTaskSnapshot[]
	>([])
	const [isLaunchingOrchestrator, setIsLaunchingOrchestrator] = useState(false)
	const [isRefreshingTasks, setIsRefreshingTasks] = useState(false)
	const [isStoppingAllTasks, setIsStoppingAllTasks] = useState(false)
	const [readinessReport, setReadinessReport] =
		useState<DemoReadinessReport | null>(null)
	const [orchestratorPreflight, setOrchestratorPreflight] =
		useState<OrchestratorPreflightSnapshot | null>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const router = useRouter()
	const pathname = usePathname()
	const { isAuthenticated, user, accessToken, logout } = useAuthStore()

	// Check backend on mount and when widget opens
	useEffect(() => {
		const check = async () => {
			try {
				const res = await fetch(`${BASE}/api/v1/actuator/health`, {
					signal: AbortSignal.timeout(5000),
				})
				setBackendStatus(res.ok ? 'up' : 'down')
			} catch {
				setBackendStatus('down')
			}
		}
		// Always check on mount to show initial status
		check()
		// Only poll repeatedly when widget is open
		if (!isOpen) return
		const interval = setInterval(check, 30000)
		return () => clearInterval(interval)
	}, [isOpen])

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return
		const handler = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [isOpen])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
				event.preventDefault()
				setIsOpen(previous => !previous)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const flash = useCallback((msg: string) => {
		setFlashMessage(msg)
		setTimeout(() => setFlashMessage(null), 2000)
	}, [])

	const quickLogin = useCallback(
		async (username: string, password: string, redirectTo = '/dashboard') => {
			setIsLoggingIn(true)
			try {
				const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ emailOrUsername: username, password }),
				})
				const loginData = await loginRes.json()
				if (!loginData.success || !loginData.data?.accessToken) {
					flash('Login failed: ' + (loginData.message || 'Check monolith'))
					return
				}
				const token = loginData.data.accessToken
				const meRes = await fetch(`${BASE}/api/v1/auth/me`, {
					headers: { Authorization: `Bearer ${token}` },
				})
				const meData = await meRes.json()
				if (!meData.success || !meData.data) {
					flash('Profile fetch failed')
					return
				}
				localStorage.setItem(
					'auth-storage',
					JSON.stringify({
						state: {
							isAuthenticated: true,
							accessToken: token,
							user: meData.data,
						},
						version: 0,
					}),
				)
				flash('Logged in! Opening demo route...')
				setTimeout(() => {
					window.location.href = redirectTo
				}, 300)
			} catch (err) {
				flash('Error: ' + (err instanceof Error ? err.message : 'Network'))
			} finally {
				setIsLoggingIn(false)
			}
		},
		[flash],
	)

	const navigateTo = useCallback(
		(path: string) => {
			router.push(path)
			setIsOpen(false)
		},
		[router],
	)

	const openPitchShortcut = useCallback(
		async (shortcut: DemoPitchShortcut) => {
			if (shortcut.requiresAuth && !accessToken) {
				flash('Log in to use this demo step')
				return
			}

			setActiveShortcut(shortcut.label)
			try {
				const resolved = await resolveDemoShortcut(shortcut, accessToken)
				if (resolved.copiedText) {
					await navigator.clipboard.writeText(resolved.copiedText)
				}
				if (resolved.watchUrl) {
					flash('Watch URL copied for second screen')
				} else if (resolved.notice) {
					flash(resolved.notice)
				}
				navigateTo(resolved.path)
			} catch (err) {
				flash(
					'Could not open demo step: ' +
						(err instanceof Error ? err.message : 'Unknown error'),
				)
			} finally {
				setActiveShortcut(null)
			}
		},
		[accessToken, flash, navigateTo],
	)

	const getReadinessTone = useCallback((status: DemoReadinessStatus | null) => {
		switch (status) {
			case 'ready':
				return { label: 'Ready', color: '#3fb950', border: '#23863666', bg: '#23863622' }
			case 'warning':
				return { label: 'Watch', color: '#d29922', border: '#d2992266', bg: '#d299221f' }
			case 'blocked':
				return { label: 'Blocked', color: '#f85149', border: '#f8514966', bg: '#f851491f' }
			default:
				return { label: 'Unknown', color: '#8b949e', border: '#30363d', bg: '#11161d' }
		}
	}, [])

	const refreshReadinessReport = useCallback(async () => {
		try {
			resetDemoReadinessCache()
			const report = await loadDemoReadinessReport()
			setReadinessReport(report)
		} catch {
			setReadinessReport(null)
		}
	}, [])

	const refreshOrchestratorPreflight = useCallback(async () => {
		try {
			const response = await fetch('/api/dev/orchestrator/preflight', {
				method: 'GET',
				cache: 'no-store',
			})

			const payload = (await response.json()) as {
				success?: boolean
				message?: string
				data?: { preflight?: OrchestratorPreflightSnapshot }
			}

			if (!payload.data?.preflight) {
				setOrchestratorPreflight(null)
				return
			}

			setOrchestratorPreflight(payload.data.preflight)
			if (!response.ok || !payload.success) {
				flash(payload.message || 'Orchestrator preflight failed')
			}
		} catch {
			setOrchestratorPreflight(null)
		}
	}, [flash])

	const refreshOrchestratorTaskList = useCallback(async () => {
		setIsRefreshingTasks(true)
		try {
			const response = await fetch('/api/dev/orchestrator/list', {
				method: 'GET',
				cache: 'no-store',
			})

			const payload = (await response.json()) as {
				success?: boolean
				message?: string
				data?: { tasks?: OrchestratorTaskSnapshot[] }
			}

			if (!response.ok || !payload.success || !payload.data?.tasks) {
				throw new Error(payload.message || 'Failed to load orchestrator task list')
			}

			setOrchestratorTaskList(payload.data.tasks)
		} catch (error) {
			flash(
				error instanceof Error
					? `Orchestrator list failed: ${error.message}`
					: 'Orchestrator list failed',
			)
		} finally {
			setIsRefreshingTasks(false)
		}
	}, [flash])

	const refreshOrchestratorTask = useCallback(
		async (taskId: string) => {
			const response = await fetch(
				`/api/dev/orchestrator/status?taskId=${encodeURIComponent(taskId)}`,
				{
					method: 'GET',
					cache: 'no-store',
				},
			)

			const payload = (await response.json()) as {
				success?: boolean
				message?: string
				data?: {
					task?: OrchestratorTaskSnapshot
					progress?: OrchestratorProgressSnapshot | null
				}
			}

			if (!response.ok || !payload.success || !payload.data?.task) {
				throw new Error(payload.message || 'Failed to fetch orchestrator status')
			}

			setOrchestratorTask(payload.data.task)
			setOrchestratorProgress(payload.data.progress ?? null)
			return payload.data.task
		},
		[],
	)

	const stopOrchestratorTask = useCallback(
		async (taskId: string) => {
			const response = await fetch('/api/dev/orchestrator/stop', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ taskId }),
			})

			const payload = (await response.json()) as {
				success?: boolean
				message?: string
				data?: OrchestratorTaskSnapshot
			}

			if (!response.ok || !payload.success || !payload.data) {
				throw new Error(payload.message || 'Failed to stop orchestrator task')
			}

			if (orchestratorTask?.taskId === taskId) {
				setOrchestratorTask(payload.data)
			}
			await refreshOrchestratorTaskList()
			flash(`Stopped task ${taskId.slice(0, 8)}`)
		},
		[flash, orchestratorTask?.taskId, refreshOrchestratorTaskList],
	)

	const stopAllOrchestratorTasks = useCallback(async () => {
		setIsStoppingAllTasks(true)
		try {
			const response = await fetch('/api/dev/orchestrator/stop-all', {
				method: 'POST',
			})

			const payload = (await response.json()) as {
				success?: boolean
				message?: string
				data?: { stoppedTaskIds?: string[] }
			}

			if (!response.ok || !payload.success) {
				throw new Error(payload.message || 'Failed to stop all orchestrator tasks')
			}

			const stoppedCount = payload.data?.stoppedTaskIds?.length ?? 0
			await refreshOrchestratorTaskList()
			if (orchestratorTask?.status === 'running') {
				await refreshOrchestratorTask(orchestratorTask.taskId).catch(() => undefined)
			}
			flash(`Stop-all complete (${stoppedCount})`)
		} catch (error) {
			flash(
				error instanceof Error
					? `Stop-all failed: ${error.message}`
					: 'Stop-all failed',
			)
		} finally {
			setIsStoppingAllTasks(false)
		}
	}, [flash, orchestratorTask, refreshOrchestratorTask, refreshOrchestratorTaskList])

	const launchOrchestratorRun = useCallback(
		async (mode: 'single-strict' | 'certify-strict') => {
			const preflightBlocked =
				hardBlockMode &&
				orchestratorPreflight !== null &&
				(!orchestratorPreflight.backendHealthOk ||
					!orchestratorPreflight.authProbeOk ||
					!orchestratorPreflight.launchCapacityAvailable)

			if (hardBlockMode && backendStatus !== 'up') {
				flash('Hard block active: backend must be UP before launch')
				return
			}

			if (preflightBlocked) {
				flash(
					`Hard block active: ${orchestratorPreflight?.errorMessage || 'server preflight failed'}`,
				)
				return
			}

			setIsLaunchingOrchestrator(true)
			try {
				const response = await fetch('/api/dev/orchestrator/launch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ mode, hostFailover: false }),
				})

				const payload = (await response.json()) as {
					success?: boolean
					message?: string
					data?: {
						task?: OrchestratorTaskSnapshot
						preflight?: OrchestratorPreflightSnapshot
					}
				}

				if (!response.ok || !payload.success || !payload.data?.task) {
					if (payload.data?.preflight) {
						setOrchestratorPreflight(payload.data.preflight)
					}
					throw new Error(payload.message || 'Failed to launch orchestrator')
				}

				setOrchestratorTask(payload.data.task)
				if (payload.data.preflight) {
					setOrchestratorPreflight(payload.data.preflight)
				}
				setOrchestratorProgress(null)
				await refreshOrchestratorTaskList()
				flash(mode === 'certify-strict' ? 'Strict certify launched' : 'Strict run launched')
			} catch (error) {
				flash(
					error instanceof Error
						? `Launch failed: ${error.message}`
						: 'Launch failed',
				)
			} finally {
				setIsLaunchingOrchestrator(false)
			}
		},
		[
			backendStatus,
			flash,
			hardBlockMode,
			orchestratorPreflight,
			refreshOrchestratorTaskList,
		],
	)

	useEffect(() => {
		if (!isOpen) {
			return
		}

		void refreshOrchestratorTaskList()
		const interval = window.setInterval(() => {
			void refreshOrchestratorTaskList()
		}, 4000)

		return () => {
			window.clearInterval(interval)
		}
	}, [isOpen, refreshOrchestratorTaskList])

	useEffect(() => {
		if (!isOpen) {
			return
		}

		void refreshReadinessReport()
		void refreshOrchestratorPreflight()
		const interval = window.setInterval(() => {
			void refreshReadinessReport()
			void refreshOrchestratorPreflight()
		}, 20000)

		return () => {
			window.clearInterval(interval)
		}
	}, [isOpen, refreshOrchestratorPreflight, refreshReadinessReport])

	useEffect(() => {
		if (!isOpen || !orchestratorTask || orchestratorTask.status !== 'running') {
			return
		}

		let cancelled = false
		const interval = window.setInterval(() => {
			void refreshOrchestratorTask(orchestratorTask.taskId)
				.then(nextTask => {
					if (cancelled || nextTask.status === 'running') {
						return
					}

					flash(nextTask.status === 'passed' ? 'Orchestrator passed' : 'Orchestrator failed')
				})
				.catch(() => {
					// Keep polling until transient failures clear.
				})
		}, 2000)

		return () => {
			cancelled = true
			window.clearInterval(interval)
		}
	}, [flash, isOpen, orchestratorTask, refreshOrchestratorTask])

	// Only render in dev mode; keep hidden on full dev dashboard to avoid duplicate controls.
	if (!IS_DEV || pathname === '/_dev')
		return null

	if (isMinimized) {
		return (
			<div className='hidden md:block'>
				<button
					onClick={() => setIsMinimized(false)}
					style={{
						position: 'fixed',
						bottom: 16,
						right: 16,
						zIndex: 99999,
						width: 12,
						height: 12,
						borderRadius: '50%',
						background:
							backendStatus === 'up'
								? '#3fb950'
								: backendStatus === 'down'
									? '#f85149'
									: '#d29922',
						border: 'none',
						cursor: 'pointer',
						opacity: 0.6,
					}}
					title='Show demo widget'
				/>
			</div>
		)
	}

	return (
		<div className='hidden md:block'>
			<div
				ref={panelRef}
				style={{
					position: 'fixed',
					bottom: 16,
					right: 16,
					zIndex: 99999,
					fontFamily: "'Inter', system-ui, sans-serif",
				}}
			>
				{/* Flash message */}
				{flashMessage && (
					<div
						style={{
							position: 'absolute',
							bottom: 52,
							right: 0,
							whiteSpace: 'nowrap',
							background: '#238636',
							color: '#fff',
							padding: '6px 14px',
							borderRadius: 8,
							fontSize: 12,
							fontWeight: 600,
							boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
							animation: 'fadeIn 0.2s ease-out',
						}}
					>
						{flashMessage}
					</div>
				)}

				{/* Expanded panel */}
				{isOpen && (
					<div
						style={{
							position: 'absolute',
							bottom: 52,
							right: 0,
							width: 340,
							background: '#161b22',
							border: '1px solid #30363d',
							borderRadius: 12,
							boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
							overflow: 'hidden',
							maxHeight: 'calc(100vh - 100px)',
							overflowY: 'auto',
						}}
					>
						{/* Header */}
						<div
							style={{
								padding: '12px 16px',
								borderBottom: '1px solid #30363d',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								background: '#0d1117',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<span style={{ fontSize: 16 }}>🍳</span>
								<span
									style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}
								>
									Demo Control
								</span>
							</div>
							<div style={{ display: 'flex', gap: 6 }}>
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: '50%',
										background:
											backendStatus === 'up'
												? '#3fb950'
												: backendStatus === 'down'
													? '#f85149'
													: '#d29922',
									}}
									title={`Backend: ${backendStatus}`}
								/>
								<button
									onClick={() => {
										setIsMinimized(true)
										setIsOpen(false)
									}}
									style={{
										background: 'none',
										border: 'none',
										color: '#8b949e',
										cursor: 'pointer',
										fontSize: 14,
										padding: 0,
									}}
								>
									−
								</button>
							</div>
						</div>

						{/* Auth Status */}
						<div
							style={{
								padding: '10px 16px',
								borderBottom: '1px solid #21262d',
							}}
						>
							{isAuthenticated && user ? (
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<div>
										<div
											style={{
												fontSize: 12,
												color: '#3fb950',
												fontWeight: 600,
											}}
										>
											✓ Logged in as{' '}
											{user.username || user.displayName || 'user'}
										</div>
										<div
											style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}
										>
											Token: {accessToken?.substring(0, 20)}...
										</div>
									</div>
									<div style={{ display: 'flex', gap: 4 }}>
										<button
											onClick={() => {
												navigator.clipboard.writeText(accessToken || '')
												flash('Token copied!')
											}}
											style={btnSmall}
										>
											📋
										</button>
										<button
											onClick={() => {
												logout()
												flash('Logged out')
												setTimeout(() => window.location.reload(), 500)
											}}
											style={{ ...btnSmall, color: '#f85149' }}
										>
											⏏
										</button>
									</div>
								</div>
							) : (
								<div>
									<div
										style={{
											fontSize: 12,
											color: '#d29922',
											fontWeight: 600,
											marginBottom: 8,
										}}
									>
										Not authenticated
									</div>
									{DEMO_WIDGET_ACCOUNTS.map(acc => (
										<button
											key={acc.username}
											onClick={() =>
												quickLogin(acc.username, acc.password, acc.defaultRoute)
											}
											disabled={isLoggingIn || backendStatus !== 'up'}
											style={{
												width: '100%',
												padding: '8px 12px',
												marginBottom: 4,
												background: isLoggingIn ? '#21262d' : '#238636',
												border: 'none',
												borderRadius: 6,
												color: '#fff',
												fontSize: 12,
												fontWeight: 600,
												cursor: isLoggingIn ? 'wait' : 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												gap: 6,
											}}
										>
											{isLoggingIn
												? '⏳ Logging in...'
												: `⚡ Login as ${acc.label}`}
										</button>
									))}
									<div style={{ fontSize: 10, color: '#8b949e', marginTop: 6 }}>
										More personas and commands live in /_dev.
									</div>
									{backendStatus !== 'up' && (
										<div
											style={{ fontSize: 10, color: '#f85149', marginTop: 4 }}
										>
											Backend is {backendStatus}. Start monolith first.
										</div>
									)}
								</div>
							)}
						</div>

						{/* Quick Navigation */}
						<div style={{ padding: '8px' }}>
							<div
								style={{
									fontSize: 10,
									color: '#8b949e',
									textTransform: 'uppercase',
									letterSpacing: 1,
									padding: '4px 8px',
									fontWeight: 600,
								}}
							>
								Quick Navigate
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr',
									gap: 4,
								}}
							>
								{DEMO_ROUTES.map(route => (
									<button
										key={route.path}
										onClick={() => navigateTo(route.path)}
										style={{
											padding: '8px 10px',
											background:
												pathname === route.path ? '#1f6feb22' : '#0d1117',
											border: `1px solid ${pathname === route.path ? '#1f6feb' : '#21262d'}`,
											borderRadius: 6,
											cursor: 'pointer',
											textAlign: 'left',
											display: 'flex',
											alignItems: 'center',
											gap: 6,
											color: '#e6edf3',
										}}
									>
										<span style={{ fontSize: 14 }}>{route.icon}</span>
										<div>
											<div style={{ fontSize: 11, fontWeight: 600 }}>
												{route.label}
											</div>
											<div style={{ fontSize: 9, color: '#8b949e' }}>
												{route.description}
											</div>
										</div>
									</button>
								))}
							</div>
						</div>

						{/* Pitch Flow */}
						<div style={{ padding: '8px', borderTop: '1px solid #21262d' }}>
							<div
								style={{
									fontSize: 10,
									color: '#8b949e',
									textTransform: 'uppercase',
									letterSpacing: 1,
									padding: '4px 8px',
									fontWeight: 600,
								}}
							>
								Pitch Flow
							</div>
							<div style={{ display: 'grid', gap: 4 }}>
								{DEMO_PITCH_SHORTCUTS.map(shortcut => {
									const disabled =
										activeShortcut === shortcut.label ||
										(Boolean(shortcut.requiresAuth) && !isAuthenticated)

									return (
										<button
											key={shortcut.label}
											onClick={() => openPitchShortcut(shortcut)}
											disabled={disabled}
											style={{
												padding: '8px 10px',
												background: disabled ? '#11161d' : '#0d1117',
												border: `1px solid ${disabled ? '#21262d' : '#30363d'}`,
												borderRadius: 6,
												cursor: disabled ? 'not-allowed' : 'pointer',
												textAlign: 'left',
												display: 'flex',
												alignItems: 'center',
												gap: 8,
												color: '#e6edf3',
											}}
										>
											<span style={{ fontSize: 16 }}>{shortcut.icon}</span>
											<div style={{ flex: 1 }}>
												<div style={{ fontSize: 11, fontWeight: 600 }}>
													{shortcut.label}
												</div>
												<div style={{ fontSize: 9, color: '#8b949e' }}>
													{shortcut.description}
												</div>
											</div>
											<span style={{ color: '#8b949e', fontSize: 11 }}>
												{activeShortcut === shortcut.label ? '...' : '→'}
											</span>
										</button>
									)
								})}
							</div>
							{!isAuthenticated && (
								<div
									style={{
										fontSize: 10,
										color: '#8b949e',
										padding: '6px 8px 0',
									}}
								>
									Most shortcuts expect a logged-in demo persona.
								</div>
							)}
						</div>

						{/* Beat Board */}
						<div style={{ padding: '8px', borderTop: '1px solid #21262d' }}>
							<div
								style={{
									fontSize: 10,
									color: '#8b949e',
									textTransform: 'uppercase',
									letterSpacing: 1,
									padding: '4px 8px',
									fontWeight: 600,
								}}
							>
								Beat Board
							</div>
							<div style={{ display: 'grid', gap: 4 }}>
								{DEMO_PITCH_BEATS.map(beat => {
									const status = getBeatReadinessStatus(beat, readinessReport)
									const tone = getReadinessTone(status)
									const firstAction = beat.actions[0]
									const shortcut = firstAction
										? getDemoPitchShortcut(firstAction)
										: undefined

									return (
										<div
											key={beat.id}
											style={{
												padding: '8px 10px',
												borderRadius: 6,
												border: `1px solid ${tone.border}`,
												background: tone.bg,
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: 8,
												}}
											>
												<div style={{ fontSize: 10, fontWeight: 600, color: '#e6edf3' }}>
													{beat.phase} · {beat.title}
												</div>
												<span style={{ fontSize: 9, fontWeight: 700, color: tone.color }}>
													{tone.label}
												</span>
											</div>
											<div style={{ fontSize: 9, color: '#8b949e', marginTop: 4 }}>
												{beat.minutes} · persona {beat.personaUsername}
											</div>
											{shortcut && (
												<button
													onClick={() => void openPitchShortcut(shortcut)}
													disabled={Boolean(shortcut.requiresAuth) && !isAuthenticated}
													style={{
														...btnAction,
														marginTop: 6,
														padding: '5px 8px',
														fontSize: 10,
														background: '#0d1117',
														border: '1px solid #30363d',
														opacity:
															Boolean(shortcut.requiresAuth) && !isAuthenticated ? 0.5 : 1,
													}}
												>
													Open Beat
												</button>
											)}
										</div>
									)
								})}
							</div>
							<div style={{ fontSize: 9, color: '#8b949e', padding: '6px 8px 0' }}>
								Readiness source: /demo-readiness.json
							</div>
						</div>

						{/* Orchestrator Control Plane */}
						<div style={{ padding: '8px', borderTop: '1px solid #21262d' }}>
							<div
								style={{
									fontSize: 10,
									color: '#8b949e',
									textTransform: 'uppercase',
									letterSpacing: 1,
									padding: '4px 8px',
									fontWeight: 600,
								}}
							>
								Orchestrator Control Plane
							</div>

							<div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px 8px' }}>
								<button
									onClick={() => setHardBlockMode(previous => !previous)}
									style={{
										...btnAction,
										background: hardBlockMode ? '#23863622' : '#d2992222',
										color: hardBlockMode ? '#3fb950' : '#d29922',
										border: `1px solid ${hardBlockMode ? '#23863666' : '#d2992266'}`,
										padding: '6px 8px',
										fontSize: 10,
									}}
								>
									Hard Block: {hardBlockMode ? 'ON' : 'OFF'}
								</button>
								<span style={{ fontSize: 10, color: '#8b949e' }}>
									{backendStatus === 'up' ? 'backend ready' : 'backend down'}
								</span>
							</div>

							{orchestratorPreflight && (
								<div
									style={{
										margin: '0 8px 8px',
										padding: '6px 8px',
										borderRadius: 8,
										border: `1px solid ${orchestratorPreflight.backendHealthOk && orchestratorPreflight.authProbeOk && orchestratorPreflight.launchCapacityAvailable ? '#23863666' : '#f8514966'}`,
										background:
											orchestratorPreflight.backendHealthOk && orchestratorPreflight.authProbeOk && orchestratorPreflight.launchCapacityAvailable
												? '#23863622'
												: '#f851491f',
										fontSize: 9,
										color:
											orchestratorPreflight.backendHealthOk && orchestratorPreflight.authProbeOk && orchestratorPreflight.launchCapacityAvailable
												? '#3fb950'
												: '#f85149',
										lineHeight: 1.35,
									}}
								>
									<div>
										preflight backend/auth:{' '}
										{orchestratorPreflight.backendHealthOk ? 'ok' : 'fail'}/
										{orchestratorPreflight.authProbeOk ? 'ok' : 'fail'}
									</div>
									<div>
										status codes:{' '}
										{orchestratorPreflight.backendHealthStatusCode ?? 'n/a'}/
										{orchestratorPreflight.authProbeStatusCode ?? 'n/a'}
									</div>
									<div>
										capacity:{' '}
										{orchestratorPreflight.runningTaskCount}/
										{orchestratorPreflight.maxConcurrentRunningTasks} ({orchestratorPreflight.launchCapacityAvailable ? 'available' : 'full'})
									</div>
									{orchestratorPreflight.errorMessage && (
										<div>{orchestratorPreflight.errorMessage}</div>
									)}
								</div>
							)}

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '0 8px 8px' }}>
								<button
									onClick={() => void launchOrchestratorRun('single-strict')}
									disabled={isLaunchingOrchestrator}
									style={{ ...btnAction, background: '#1f6feb', opacity: isLaunchingOrchestrator ? 0.6 : 1 }}
								>
									Run Strict
								</button>
								<button
									onClick={() => void launchOrchestratorRun('certify-strict')}
									disabled={isLaunchingOrchestrator}
									style={{ ...btnAction, background: '#8957e5', opacity: isLaunchingOrchestrator ? 0.6 : 1 }}
								>
									Certify x3
								</button>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '0 8px 8px' }}>
								<button
									onClick={() => void refreshOrchestratorTaskList()}
									disabled={isRefreshingTasks}
									style={{ ...btnAction, background: '#21262d', opacity: isRefreshingTasks ? 0.6 : 1 }}
								>
									Refresh Tasks
								</button>
								<button
									onClick={() => void stopAllOrchestratorTasks()}
									disabled={isStoppingAllTasks}
									style={{ ...btnAction, background: '#f8514922', color: '#f85149', border: '1px solid #f8514966', opacity: isStoppingAllTasks ? 0.6 : 1 }}
								>
									Stop All
								</button>
							</div>

							{orchestratorTask && (
								<div
									style={{
										margin: '0 8px 8px',
										padding: 8,
										borderRadius: 8,
										border: '1px solid #30363d',
										background: '#0d1117',
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
										<span style={{ fontSize: 10, color: '#8b949e', fontFamily: 'monospace' }}>
											{orchestratorTask.taskId.slice(0, 8)} · {orchestratorTask.mode}
										</span>
										<span
											style={{
												fontSize: 10,
												fontWeight: 700,
												color:
													orchestratorTask.status === 'passed'
														? '#3fb950'
														: orchestratorTask.status === 'failed'
															? '#f85149'
															: orchestratorTask.status === 'stopped'
																? '#d29922'
																: '#58a6ff',
											}}
										>
											{orchestratorTask.status}
										</span>
									</div>
											<div style={{ marginTop: 4, fontSize: 9, color: '#8b949e' }}>
												watchdog:{orchestratorTask.watchdogRisk} · runtime:{orchestratorTask.runtimeAgeSec}s/{orchestratorTask.maxRuntimeSec}s · idle:{orchestratorTask.lastOutputAgeSec}s
											</div>
									{orchestratorProgress && (
										<div style={{ marginTop: 6, fontSize: 10, color: '#8b949e' }}>
											<div>
												strict:{orchestratorProgress.strictAssertionFailures ?? 'n/a'} · render:{' '}
												{orchestratorProgress.renderAnomalies ?? 'n/a'} · 5xx:{' '}
												{orchestratorProgress.http5xxResponses ?? 'n/a'} · page:{' '}
												{orchestratorProgress.pageErrors ?? 'n/a'}
											</div>
											<div>
												beats e/a/p:{orchestratorProgress.beatsWithEvidence ?? 'n/a'}/
												{orchestratorProgress.beatsWithValueArc ?? 'n/a'}/
												{orchestratorProgress.beatsWithPhaseCoverage ?? 'n/a'} of{' '}
												{orchestratorProgress.expectedBeats ?? 'n/a'}
											</div>
											<div>
												rates e/a/p:{orchestratorProgress.beatEvidenceRate ?? 'n/a'}%/{' '}
												{orchestratorProgress.beatValueArcRate ?? 'n/a'}%/{' '}
												{orchestratorProgress.beatPhaseCoverageRate ?? 'n/a'}%
											</div>
											<div>
												fallbacks total/scene/route:{' '}
												{orchestratorProgress.beatFallbacks ?? 'n/a'}/
												{orchestratorProgress.beatSceneFallbacks ?? 'n/a'}/
												{orchestratorProgress.beatRouteFallbacks ?? 'n/a'} · reqFail:{' '}
												{orchestratorProgress.requestFailures ?? 'n/a'} · console:{' '}
												{orchestratorProgress.consoleErrors ?? 'n/a'}
											</div>
											<div>
												preflight:{orchestratorProgress.preflightCoreStatus ?? 'n/a'} · warnings:{' '}
												{orchestratorProgress.warningCount ?? 'n/a'} · errors:{' '}
												{orchestratorProgress.errorCount ?? 'n/a'}
											</div>
											{orchestratorProgress.criticalFindings.length > 0 && (
												<div
													style={{
														marginTop: 6,
														padding: '5px 6px',
														borderRadius: 6,
														border: '1px solid #f8514966',
														background: '#f851491f',
														color: '#f85149',
														fontSize: 9,
														lineHeight: 1.35,
													}}
												>
													{orchestratorProgress.criticalFindings.slice(0, 3).join(' | ')}
												</div>
											)}
										</div>
									)}
									{orchestratorTask.recentOutput.length > 0 && (
										<div
											style={{
												marginTop: 6,
												padding: 6,
												fontSize: 9,
												fontFamily: 'monospace',
												lineHeight: 1.35,
												maxHeight: 70,
												overflow: 'auto',
												borderRadius: 6,
												background: '#11161d',
												border: '1px solid #21262d',
												color: '#8b949e',
											}}
										>
											{orchestratorTask.recentOutput.slice(-5).join('\n')}
										</div>
									)}
									<div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
										<button
											onClick={() => void stopOrchestratorTask(orchestratorTask.taskId)}
											disabled={orchestratorTask.status !== 'running'}
											style={{
												...btnAction,
												background: '#f8514922',
												color: '#f85149',
												border: '1px solid #f8514966',
												padding: '5px 8px',
												fontSize: 10,
												opacity: orchestratorTask.status === 'running' ? 1 : 0.5,
											}}
										>
											Stop Task
										</button>
									</div>
								</div>
							)}

							<div style={{ margin: '0 8px', border: '1px solid #21262d', borderRadius: 8, background: '#0d1117' }}>
								<div style={{ padding: '6px 8px', fontSize: 10, color: '#8b949e', borderBottom: '1px solid #21262d' }}>
									Task Timeline ({orchestratorTaskList.filter(task => task.status === 'running').length} running)
								</div>
								<div style={{ maxHeight: 92, overflow: 'auto' }}>
									{orchestratorTaskList.length === 0 ? (
										<div style={{ padding: 8, fontSize: 10, color: '#8b949e' }}>No tasks yet</div>
									) : (
										orchestratorTaskList.slice(0, 6).map(task => (
											<div
												key={`widget-task-${task.taskId}`}
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													padding: '6px 8px',
													borderTop: '1px solid #161b22',
													fontSize: 10,
												}}
											>
												<span style={{ color: '#8b949e', fontFamily: 'monospace' }}>
													{task.taskId.slice(0, 8)} · {task.mode}
												</span>
												<span
													style={{
														fontWeight: 700,
														color:
															task.status === 'passed'
																? '#3fb950'
																: task.status === 'failed'
																	? '#f85149'
																	: task.status === 'stopped'
																		? '#d29922'
																		: '#58a6ff',
													}}
												>
																			{task.status} · {task.runtimeAgeSec}s/{task.maxRuntimeSec}s
												</span>
											</div>
										))
									)}
								</div>
							</div>
						</div>

						{/* Quick Actions */}
						<div
							style={{
								padding: '8px 16px 12px',
								borderTop: '1px solid #21262d',
							}}
						>
							<div style={{ display: 'flex', gap: 6 }}>
								<button
									onClick={() => navigateTo('/demo-cockpit')}
									style={{ ...btnAction, background: '#1f6feb', flex: 1 }}
								>
									🔧 Full Dashboard
								</button>
								<button
									onClick={() =>
										window.open(`${BASE}/api/v1/swagger-ui.html`, '_blank')
									}
									style={{ ...btnAction, background: '#21262d', flex: 1 }}
								>
									📄 Swagger
								</button>
							</div>
						</div>
					</div>
				)}

				{/* FAB Button */}
				<button
					onClick={() => setIsOpen(!isOpen)}
					style={{
						width: 44,
						height: 44,
						borderRadius: '50%',
						background: isOpen ? '#30363d' : '#ff5a36',
						border: '2px solid rgba(255,255,255,0.15)',
						color: '#fff',
						fontSize: 20,
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 4px 16px rgba(255,90,54,0.4)',
						transition: 'all 0.2s ease',
						position: 'relative',
					}}
					title='Demo Control Widget'
				>
					{isOpen ? '✕' : '🍳'}
					{/* Status dot */}
					<span
						style={{
							position: 'absolute',
							top: -2,
							right: -2,
							width: 10,
							height: 10,
							borderRadius: '50%',
							background:
								backendStatus === 'up'
									? '#3fb950'
									: backendStatus === 'down'
										? '#f85149'
										: '#d29922',
							border: '2px solid #161b22',
						}}
					/>
				</button>

				<style>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(8px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
			</div>
		</div>
	)
}

const btnSmall: React.CSSProperties = {
	background: '#21262d',
	border: '1px solid #30363d',
	borderRadius: 4,
	color: '#e6edf3',
	cursor: 'pointer',
	fontSize: 12,
	padding: '4px 6px',
}

const btnAction: React.CSSProperties = {
	padding: '8px 12px',
	border: 'none',
	borderRadius: 6,
	color: '#fff',
	fontSize: 11,
	fontWeight: 600,
	cursor: 'pointer',
}

// ============================================
// EXTREME 3000% CHEAT ENGINE
// ============================================
import { demoInjector } from '@/lib/demo-injector'
import { useCelebration } from '@/components/providers/CelebrationProvider'
import { useCookingStore } from '@/store/cookingStore'
import { getGhostDriver } from '@/lib/ghost-driver'
import { GhostCursor } from '@/components/dev/GhostCursor'
import { GhostHUD } from '@/components/dev/GhostHUD'
import { runOmniDemo } from '@/lib/demo-sequences'
import { initializeAirGap } from '@/lib/airgap-engine'
import { rewindTimeline } from '@/lib/chronos-engine'

function CheatEngine() {
	const [isOpen, setIsOpen] = useState(false)
	const [ghostMode, setGhostMode] = useState(false)
	const { showLevelUp } = useCelebration()
	
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
				event.preventDefault()
				setIsOpen(p => !p)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	if (!isOpen) return null

	return (
		<div
			style={{
				position: 'fixed',
				top: 80,
				right: 20,
				zIndex: 999999,
				width: 380,
				background: ghostMode ? 'rgba(10, 10, 15, 0.4)' : '#0d1117',
				border: ghostMode ? '1px solid rgba(48, 54, 61, 0.3)' : '1px solid #30363d',
				borderRadius: 12,
				boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
				fontFamily: "'Space Grotesk', monospace",
				color: '#e6edf3',
				backdropFilter: ghostMode ? 'blur(4px)' : 'none',
				opacity: ghostMode ? 0.6 : 1,
				transition: 'all 0.2s ease',
			}}
		>
			<div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<span style={{ color: '#ff5a36', fontWeight: 800 }}>⚡ CHEAT ENGINE 3000%</span>
				</div>
				<div style={{ display: 'flex', gap: 12 }}>
					<button onClick={() => setGhostMode(!ghostMode)} style={{ background: 'none', border: 'none', color: ghostMode ? '#3fb950' : '#8b949e', cursor: 'pointer', fontSize: 12 }}>Ghost</button>
					<button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: 16 }}>×</button>
				</div>
			</div>

			<div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
				
				<div style={{ padding: 12, border: '1px solid #ff5a36', borderRadius: 8, background: 'rgba(255, 90, 54, 0.1)' }}>
					<div style={{ fontSize: 11, color: '#ff5a36', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Core Experience Injects</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
						<button 
							onClick={() => showLevelUp({ oldLevel: 4, newLevel: 5 })}
							style={{ ...btnAction, background: '#238636' }}
						>
							[FORCE] Level Up
						</button>
						<button 
							onClick={() => demoInjector.injectAiResponse()}
							style={{ ...btnAction, background: '#8957e5' }}
						>
							[FORCE] AI Response
						</button>
					</div>
				</div>

				<div style={{ padding: 12, border: '1px solid #3fb950', borderRadius: 8, background: 'rgba(63, 185, 80, 0.1)' }}>
					<div style={{ fontSize: 11, color: '#3fb950', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Multiplayer Injects</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
						<button 
							onClick={() => {
								useCookingStore.getState().handleRoomEvent({
									type: 'STEP_COMPLETED',
									userId: 'mock-friend-123',
									displayName: 'Chef Gordon (MOCK)',
									timestamp: new Date().toISOString(),
									data: { stepNumber: 1 }
								})
							}}
							style={{ ...btnAction, background: '#2ea043' }}
						>
							[MOCK] Friend Completes Step 1
						</button>
						<button 
							onClick={() => {
								useCookingStore.getState().handleRoomEvent({
									type: 'PARTICIPANT_JOINED',
									userId: 'mock-friend-123',
									displayName: 'Chef Gordon (MOCK)',
									timestamp: new Date().toISOString(),
									data: {
										participant: {
											userId: 'mock-friend-123',
											displayName: 'Chef Gordon (MOCK)',
											avatarUrl: null,
											sessionId: 'mock-sess',
											currentStep: 1,
											completedSteps: [],
											joinedAt: new Date().toISOString(),
											isHost: false,
											role: 'COOK'
										}
									}
								})
							}}
							style={{ ...btnAction, background: '#21262d', border: '1px solid #30363d' }}
						>
							[MOCK] Friend Joins Room
						</button>
					</div>
				</div>

				<div style={{ padding: 12, border: '1px solid #d29922', borderRadius: 8, background: 'rgba(210, 153, 34, 0.1)' }}>
					<div style={{ fontSize: 11, color: '#d29922', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Time & Presentation</div>
					<div style={{ display: 'flex', gap: 8 }}>
						<button 
							onClick={() => {
								demoInjector.toggleTimeWarp(!demoInjector.timeWarpActive)
								const styleId = 'cheat-engine-time-warp'
								if (demoInjector.timeWarpActive) {
									const style = document.createElement('style')
									style.id = styleId
									style.innerHTML = `* { transition: none !important; animation: none !important; scroll-behavior: auto !important; }`
									document.head.appendChild(style)
								} else {
									document.getElementById(styleId)?.remove()
								}
							}}
							style={{ ...btnAction, flex: 1, background: '#9e6a03' }}
						>
							Toggle Time Warp
						</button>
						<button 
							onClick={() => {
								const styleId = 'cheat-engine-laser'
								if (document.getElementById(styleId)) {
									document.getElementById(styleId)?.remove()
									document.body.classList.remove('laser-active')
								} else {
									const style = document.createElement('style')
									style.id = styleId
									style.innerHTML = `
										body.laser-active > *:not(#cheat-engine-wrapper) { filter: brightness(0.2) grayscale(0.5); pointer-events: none; }
										body.laser-active .laser-target { filter: none !important; z-index: 99999; position: relative; pointer-events: auto; box-shadow: 0 0 0 9999px rgba(0,0,0,0.8), 0 0 20px rgba(255,90,54,0.5); border-radius: 8px; }
									`
									document.head.appendChild(style)
									document.body.classList.add('laser-active')
								}
							}}
							style={{ ...btnAction, flex: 1, background: '#21262d', border: '1px solid #30363d' }}
						>
							Laser Focus
						</button>
					</div>
				</div>
				
				<div style={{ padding: 12, border: '1px solid #ff7b72', borderRadius: 8, background: 'rgba(255, 123, 114, 0.1)' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
						<div style={{ fontSize: 11, color: '#ff7b72', fontWeight: 700, textTransform: 'uppercase' }}>Ghost Driver (Autopilot)</div>
						<button 
							onClick={() => {
								getGhostDriver('main').stop()
								getGhostDriver('friend').stop()
							}}
							style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 10, textDecoration: 'underline' }}
						>
							Emergency Stop
						</button>
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
						<div style={{ display: 'flex', gap: 8 }}>
							<button 
								onClick={runOmniDemo}
								style={{ ...btnAction, flex: 1, background: '#b31d28', border: '1px solid #ff7b72', textTransform: 'uppercase', letterSpacing: 1, padding: '12px' }}
							>
								[☢️] INITIATE OMNI-DEMO
							</button>
							<button 
								onClick={rewindTimeline}
								style={{ ...btnAction, flex: '0 0 auto', background: '#d29922', border: '1px solid #e3b341', textTransform: 'uppercase', padding: '12px', color: '#161b22' }}
								title="Temporal Rewind (Restore Last Snapshot)"
							>
								[⏪] REWIND
							</button>
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
							<button 
								onClick={async () => {
									try {
										const driver = getGhostDriver('main')
										driver.start()
										await driver.click('a[href="/recipes/explore"]')
										await driver.wait(1000)
										const firstRecipe = 'main a[href*="/recipes/"]'
										await driver.hover(firstRecipe, true)
										await driver.click(firstRecipe)
										await driver.wait(2000)
										await driver.scroll(400)
										await driver.wait(1000)
										await driver.hover('button:has-text("Start Cooking")', true)
										await driver.click('button:has-text("Start Cooking")')
										await driver.wait(2000)
										driver.stop()
									} catch (e) {
										console.error('Ghost Driver error', e)
										getGhostDriver('main').stop()
									}
								}}
								style={{ ...btnAction, background: '#21262d', border: '1px solid #30363d', color: '#ff7b72' }}
							>
								[▶] Hero Recipe
							</button>
							<button 
								onClick={async () => {
									try {
										const driver = getGhostDriver('main')
										driver.start()
										await driver.click('a[href="/cook-together"]')
										await driver.wait(1500)
										await driver.type('input[placeholder*="room" i]', 'ABC123')
										await driver.wait(500)
										await driver.click('button:has-text("Join Room")')
										await driver.wait(3000)
										driver.stop()
									} catch (e) {
										console.error('Ghost Driver error', e)
										getGhostDriver('main').stop()
									}
								}}
								style={{ ...btnAction, background: '#21262d', border: '1px solid #30363d', color: '#ff7b72' }}
							>
								[▶] Co-Cook Join
							</button>
						</div>
					</div>
				</div>
				
				<div style={{ fontSize: 10, color: '#8b949e', textAlign: 'center', marginTop: 8 }}>
					Press Ctrl+Shift+C to toggle visibility
				</div>
			</div>
		</div>
	)
}

export function DemoWidget() {
	const [autoRunActive, setAutoRunActive] = useState(false)

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search)
			
			if (urlParams.get('airgap') === 'true') {
				initializeAirGap()
			}
			
			if (urlParams.get('autoplay') === 'omni') {
				setAutoRunActive(true)
				// Start it shortly after mount
				setTimeout(() => {
					runOmniDemo()
				}, 2000)
			}
		}
	}, [])

	return (
		<>
			<OriginalDemoWidget />
			{(IS_DEV || autoRunActive) && (
				<>
					{!autoRunActive && <CheatEngine />}
					<GhostCursor driverName="main" color="#ff5a36" />
					<GhostCursor driverName="friend" color="#3fb950" />
					<GhostHUD />
				</>
			)}
		</>
	)
}
