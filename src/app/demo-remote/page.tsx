'use client'

import { useState, useCallback, useEffect } from 'react'
import {
	DEMO_PITCH_BEATS,
	runPreShowChecklist,
	warmTokenVault,
	preloadCriticalData,
	getDemoEnvMode,
	setDemoEnvMode,
	type DemoEnvMode,
	type PreShowReport
} from '@/components/dev/demo-config'
import { usePaceTimerState, formatTime } from '@/components/dev/PaceTimer'
import type { DemoRemoteCommand } from '@/components/dev/PhantomConductor'
import { DEMO_PITCH_SCRIPT } from '@/components/dev/demo-script'

export default function DemoRemote() {
	const timer = usePaceTimerState()
	const [channel, setChannel] = useState<BroadcastChannel | null>(null)
	const [preShowReport, setPreShowReport] = useState<PreShowReport | null>(null)
	const [isRunningChecks, setIsRunningChecks] = useState(false)
	const [flashMsg, setFlashMsg] = useState<string | null>(null)
	
	const [envMode, setEnvModeState] = useState<DemoEnvMode>('cloud')
	const [latency, setLatency] = useState<number>(0)
	const [latencyHistory, setLatencyHistory] = useState<number[]>([])

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setEnvModeState(getDemoEnvMode())
			const ch = new BroadcastChannel('chefkix-demo-bus')
			ch.onmessage = (e) => {
				if (e.data?.type === 'RADAR_PING') {
					setLatency(e.data.latency)
					setLatencyHistory(prev => [...prev.slice(-20), e.data.latency])
				}
			}
			setChannel(ch)
			return () => ch.close()
		}
	}, [])

	const flash = useCallback((msg: string) => {
		setFlashMsg(msg)
		setTimeout(() => setFlashMsg(null), 2000)
	}, [])

	const sendCommand = useCallback(
		(cmd: DemoRemoteCommand) => {
			if (channel) {
				channel.postMessage(cmd)
				flash(`Sent: ${cmd.type}`)
			}
		},
		[channel, flash]
	)

	const runChecks = async () => {
		setIsRunningChecks(true)
		try {
			// First warm the vault so the check passes
			await warmTokenVault()
			
			// Preload critical data to cache
			await preloadCriticalData()

			// Need a token to pass to checklist? In the real pitch, you warm vault and use testuser
			// For remote, we'll try to find a token in local storage or just pass null
			let token = null
			try {
				const storageStr = localStorage.getItem('auth-storage')
				if (storageStr) {
					token = JSON.parse(storageStr)?.state?.accessToken || null
				}
			} catch {}
			
			const report = await runPreShowChecklist(token)
			setPreShowReport(report)
		} finally {
			setIsRunningChecks(false)
		}
	}

	return (
		<div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui, sans-serif', padding: 20 }}>
			<div style={{ maxWidth: 800, margin: '0 auto' }}>
				<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #30363d' }}>
					<div>
						<h1 style={{ margin: 0, fontSize: 24 }}>Phantom Remote</h1>
						<div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>Control the main screen via BroadcastChannel</div>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
						{flashMsg && <div style={{ color: '#3fb950', fontSize: 14, fontWeight: 600 }}>{flashMsg}</div>}
						
						<div style={{ display: 'flex', alignItems: 'center', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: '4px 8px', gap: 12 }}>
							<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
								<div style={{ fontSize: 10, textTransform: 'uppercase', color: '#8b949e' }}>Radar</div>
								<div style={{ fontSize: 14, fontWeight: 600, color: latency > 800 ? '#f85149' : latency > 300 ? '#d29922' : '#3fb950' }}>{latency}ms</div>
							</div>
							<div style={{ display: 'flex', alignItems: 'flex-end', height: 24, width: 40, gap: 1 }}>
								{latencyHistory.map((l, i) => (
									<div key={i} style={{ width: 2, background: l > 800 ? '#f85149' : '#3fb950', height: `${Math.min(100, (l / 1000) * 100)}%` }} />
								))}
							</div>
						</div>

						<div style={{ display: 'flex', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
							<button 
								onClick={() => { setDemoEnvMode('cloud'); setEnvModeState('cloud') }}
								style={{ background: envMode === 'cloud' ? '#3fb950' : 'transparent', color: envMode === 'cloud' ? '#fff' : '#8b949e', border: 'none', padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
							>
								☁️ Cloud Live
							</button>
							<button 
								onClick={() => { setDemoEnvMode('local'); setEnvModeState('local') }}
								style={{ background: envMode === 'local' ? '#d29922' : 'transparent', color: envMode === 'local' ? '#fff' : '#8b949e', border: 'none', padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
							>
								💻 Local Demo
							</button>
						</div>
					</div>
				</header>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
					{/* LEFT COL: PACING & PANIC */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						<section style={{ background: '#161b22', border: `1px solid ${timer.paceColor}`, borderRadius: 8, padding: 16 }}>
							<h2 style={{ fontSize: 12, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 12px 0' }}>Current Pace</h2>
							
							{timer.beat ? (
								<>
									<div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{timer.beat.title}</div>
									<div style={{ fontSize: 32, fontWeight: 700, color: timer.paceColor, fontVariantNumeric: 'tabular-nums' }}>
										{formatTime(timer.rawElapsedMs)}
									</div>
									<div style={{ fontSize: 14, color: '#8b949e', marginBottom: 12 }}>
										Budget: {timer.budgetMinutes}:00
									</div>
									
									<div style={{ display: 'flex', gap: 8 }}>
										<button 
											onClick={() => {
												// Start/Pause is just local state in PaceTimer, but let's dispatch globally
												window.dispatchEvent(new CustomEvent('chefkix-pace-start'))
											}}
											style={{ flex: 1, background: '#238636', color: '#fff', border: 'none', padding: '8px', borderRadius: 4, cursor: 'pointer' }}
										>
											Start/Resume
										</button>
										<button 
											onClick={() => {
												window.dispatchEvent(new CustomEvent('chefkix-pace-reset'))
											}}
											style={{ background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', padding: '8px', borderRadius: 4, cursor: 'pointer' }}
										>
											Reset
										</button>
									</div>
								</>
							) : (
								<div style={{ color: '#8b949e', fontStyle: 'italic' }}>Timer not active</div>
							)}
						</section>

						<section style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 16 }}>
							<h2 style={{ fontSize: 12, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 12px 0' }}>Panic Actions</h2>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								<button 
									onClick={() => sendCommand({ type: 'SAFE_HARBOR' })}
									style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: '12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
								>
									⚓ Safe Harbor (Dashboard)
								</button>
								<button 
									onClick={() => sendCommand({ type: 'CLEANUP' })}
									style={{ background: '#0d1117', color: '#d29922', border: '1px solid #d29922', padding: '12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
								>
									🧹 Force Cleanup State
								</button>
								<button 
									onClick={() => sendCommand({ type: 'RETRY_BEAT' })}
									style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: '12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
								>
									🔄 Retry Current Beat
								</button>
								<button 
									onClick={() => sendCommand({ type: 'REWIND_SNAPSHOT' })}
									style={{ background: '#0d1117', color: '#58a6ff', border: '1px solid #1f6feb', padding: '12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
								>
									⏪ Rewind 5s Snapshot
								</button>
								<button 
									onClick={() => sendCommand({ type: 'TOGGLE_QR_OVERLAY' })}
									style={{ background: '#0d1117', color: '#8b949e', border: '1px solid #30363d', padding: '12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
								>
									📡 Toggle QR Overlay
								</button>
							</div>
						</section>
					</div>

					{/* RIGHT COL: BEATS & CHECKLIST */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						<section style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 16 }}>
							<h2 style={{ fontSize: 12, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 12px 0' }}>Pitch Flow</h2>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
								{DEMO_PITCH_BEATS.map((beat, idx) => (
									<button
										key={beat.id}
										onClick={() => sendCommand({ type: 'GOTO_BEAT', beatIndex: idx })}
										style={{ 
											background: timer.state.currentBeatIndex === idx ? '#1f6feb22' : '#0d1117', 
											border: `1px solid ${timer.state.currentBeatIndex === idx ? '#1f6feb' : '#30363d'}`, 
											color: '#e6edf3', 
											padding: '12px', 
											borderRadius: 4, 
											cursor: 'pointer',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center'
										}}
									>
										<div>
											<div style={{ fontSize: 11, color: '#8b949e', textAlign: 'left', marginBottom: 2 }}>Beat {idx + 1}</div>
											<div style={{ fontSize: 14, fontWeight: 600 }}>{beat.title}</div>
										</div>
									</button>
								))}
							</div>
						</section>
					</div>

					{/* RIGHT COL: TELEPROMPTER & CHECKLIST */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						<section style={{ background: '#0d1117', border: `2px solid ${timer.paceColor}`, borderRadius: 8, padding: 24 }}>
							<h2 style={{ fontSize: 14, textTransform: 'uppercase', color: timer.paceColor, margin: '0 0 16px 0', fontWeight: 700 }}>Live Teleprompter</h2>
							
							{(() => {
								const currentBeat = DEMO_PITCH_BEATS[timer.state.currentBeatIndex]
								const script = currentBeat ? DEMO_PITCH_SCRIPT[currentBeat.id] : null
								if (!script) return <div style={{ color: '#8b949e' }}>No script found for this beat.</div>
								
								return (
									<div>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
											<div style={{ fontSize: 24, fontWeight: 700 }}>{script.title}</div>
											<button 
												onClick={() => sendCommand({ type: 'GHOST_DRIVER_BEAT', beatIndex: timer.state.currentBeatIndex })}
												style={{ background: '#21262d', color: '#ff7b72', border: '1px solid #30363d', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
											>
												👻 Autopilot Beat
											</button>
										</div>
										<div style={{ fontSize: 16, color: '#8b949e', fontStyle: 'italic', marginBottom: 24 }}>{script.objective}</div>
										
										<div style={{ marginBottom: 24 }}>
											<h3 style={{ fontSize: 12, textTransform: 'uppercase', color: '#c9d1d9', marginBottom: 12, borderBottom: '1px solid #30363d', paddingBottom: 4 }}>Must-Say Numbers</h3>
											<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
												{script.mustSayNumbers.map((num, i) => (
													<div key={i} style={{ background: '#1f6feb22', color: '#58a6ff', padding: '8px 12px', borderRadius: 4, fontSize: 18, fontWeight: 700, border: '1px solid #1f6feb' }}>
														{num}
													</div>
												))}
											</div>
										</div>

										<div style={{ marginBottom: 24 }}>
											<h3 style={{ fontSize: 12, textTransform: 'uppercase', color: '#c9d1d9', marginBottom: 12, borderBottom: '1px solid #30363d', paddingBottom: 4 }}>Key Prompts</h3>
											<ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
												{script.prompts.map((p, i) => (
													<li key={i} style={{ fontSize: 18, lineHeight: 1.5, color: '#e6edf3' }}>{p}</li>
												))}
											</ul>
										</div>

										<div style={{ background: '#21262d', padding: 16, borderRadius: 8, borderLeft: '4px solid #d29922' }}>
											<div style={{ fontSize: 11, textTransform: 'uppercase', color: '#d29922', marginBottom: 4, fontWeight: 700 }}>Fallback Transition</div>
											<div style={{ fontSize: 16, fontStyle: 'italic', color: '#c9d1d9' }}>&quot;{script.fallbackLine}&quot;</div>
										</div>
									</div>
								)
							})()}
						</section>

						<section style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 16 }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
								<h2 style={{ fontSize: 12, textTransform: 'uppercase', color: '#8b949e', margin: 0 }}>Pre-Show Checklist</h2>
								<button 
									onClick={runChecks}
									disabled={isRunningChecks}
									style={{ background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', padding: '6px 12px', borderRadius: 4, cursor: isRunningChecks ? 'wait' : 'pointer' }}
								>
									{isRunningChecks ? 'Running...' : 'Run Checks'}
								</button>
							</div>

							{preShowReport && (
								<div style={{ borderTop: '1px solid #30363d', paddingTop: 12 }}>
									<div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: preShowReport.verdict === 'GO' ? '#3fb950' : preShowReport.verdict === 'NO-GO' ? '#f85149' : '#d29922' }}>
										Verdict: {preShowReport.verdict}
									</div>
									<div style={{ display: 'grid', gap: 6 }}>
										{preShowReport.checks.map(c => (
											<div key={c.id} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '8px', background: '#0d1117', borderRadius: 4, border: '1px solid #30363d' }}>
												<div style={{ 
													color: c.status === 'pass' ? '#3fb950' : c.status === 'fail' ? '#f85149' : '#d29922',
													width: 60,
													fontWeight: 600,
													textTransform: 'uppercase'
												}}>
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
