import { useTelemetryStore } from '@/lib/ghost-driver'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function GhostHUD() {
	const logs = useTelemetryStore(state => state.logs)
	const scrollRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [logs])

	if (logs.length === 0) return null

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			style={{
				position: 'fixed',
				bottom: 24,
				left: 24,
				width: 400,
				height: 250,
				background: 'rgba(13, 17, 23, 0.85)',
				backdropFilter: 'blur(12px)',
				border: '1px solid #30363d',
				borderRadius: 12,
				boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
				zIndex: 9999990, // Just below the ghost cursor
				display: 'flex',
				flexDirection: 'column',
				fontFamily: '"Space Grotesk", "JetBrains Mono", monospace',
				overflow: 'hidden'
			}}
		>
			<div style={{
				padding: '8px 12px',
				background: 'rgba(22, 27, 34, 0.8)',
				borderBottom: '1px solid #30363d',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center'
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<span style={{ color: '#ff7b72', fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>SENTINEL HUD</span>
					<div style={{ display: 'flex', gap: 4 }}>
						<motion.div 
							animate={{ opacity: [1, 0.3, 1] }} 
							transition={{ repeat: Infinity, duration: 2 }}
							style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb950' }} 
						/>
					</div>
				</div>
				<span style={{ color: '#8b949e', fontSize: 10 }}>[TELEMETRY LIVE]</span>
			</div>
			
			<div 
				ref={scrollRef}
				style={{ 
					padding: 12, 
					overflowY: 'auto', 
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					gap: 4
				}}
			>
				<AnimatePresence initial={false}>
					{logs.map((log) => {
						const color = 
							log.level === 'error' ? '#f85149' :
							log.level === 'warn' ? '#d29922' :
							log.level === 'success' ? '#3fb950' :
							'#8b949e'
						
						return (
							<motion.div
								key={log.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								style={{
									fontSize: 11,
									lineHeight: 1.4,
									display: 'flex',
									gap: 8,
									fontFamily: 'monospace'
								}}
							>
								<span style={{ color: '#484f58', minWidth: 65 }}>{log.timestamp.split('T')[1].substring(0, 8)}</span>
								<span style={{ color: log.driver === 'main' ? '#ff7b72' : '#3fb950', minWidth: 45, fontWeight: 700 }}>
									[{log.driver}]
								</span>
								<span style={{ color, wordBreak: 'break-all' }}>{log.message}</span>
							</motion.div>
						)
					})}
				</AnimatePresence>
			</div>
		</motion.div>
	)
}
