import { useEffect, useState } from 'react'
import { getGhostDriver } from '@/lib/ghost-driver'
import { motion, AnimatePresence } from 'framer-motion'

export function GhostCursor({ driverName = 'main', color = '#ff5a36' }: { driverName?: string, color?: string }) {
	const [state, setState] = useState({ x: 0, y: 0, clicking: false, typing: false, visible: false, spotlightRect: null as any })

	useEffect(() => {
		const driver = getGhostDriver(driverName)
		const unsubscribe = driver.subscribe(setState as any)
		return () => { unsubscribe() }
	}, [driverName])

	if (!state.visible) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					pointerEvents: 'none',
					zIndex: 9999999,
				}}
			>
				{/* The Spotlight Overlay */}
				{state.spotlightRect && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						style={{
							position: 'fixed',
							inset: 0,
							background: 'rgba(0,0,0,0.7)',
							maskImage: `radial-gradient(circle at ${state.spotlightRect.x + state.spotlightRect.w/2}px ${state.spotlightRect.y + state.spotlightRect.h/2}px, transparent ${Math.max(state.spotlightRect.w, state.spotlightRect.h)/2 + 20}px, black ${Math.max(state.spotlightRect.w, state.spotlightRect.h)/2 + 60}px)`,
							WebkitMaskImage: `radial-gradient(circle at ${state.spotlightRect.x + state.spotlightRect.w/2}px ${state.spotlightRect.y + state.spotlightRect.h/2}px, transparent ${Math.max(state.spotlightRect.w, state.spotlightRect.h)/2 + 20}px, black ${Math.max(state.spotlightRect.w, state.spotlightRect.h)/2 + 60}px)`,
							pointerEvents: 'none',
							zIndex: -1,
						}}
					/>
				)}

				<motion.div
					animate={{
						x: state.x,
						y: state.y,
						scale: state.clicking ? 0.8 : 1,
					}}
					transition={{
						type: 'spring',
						stiffness: 150,
						damping: 20,
						mass: 0.5,
					}}
					style={{
						position: 'absolute',
						top: -4, // offset hot spot
						left: -4,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{/* Fake Mouse Pointer SVG */}
					<svg 
						width="24" 
						height="24" 
						viewBox="0 0 24 24" 
						fill="none" 
						xmlns="http://www.w3.org/2000/svg"
						style={{
							filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${color}66)`
						}}
					>
						<path 
							d="M5.5 2.5L20 12.5L12 14.5L9.5 21L5.5 2.5Z" 
							fill={color} 
							stroke="#ffffff" 
							strokeWidth="1.5"
							strokeLinejoin="round"
						/>
					</svg>

					{/* Clicking Ripple */}
					{state.clicking && (
						<motion.div
							initial={{ scale: 0.5, opacity: 0.8 }}
							animate={{ scale: 3, opacity: 0 }}
							transition={{ duration: 0.4 }}
							style={{
								position: 'absolute',
								width: 16,
								height: 16,
								borderRadius: '50%',
								border: `2px solid ${color}`,
								left: 4,
								top: 4,
							}}
						/>
					)}

					{/* Typing Indicator */}
					{state.typing && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: -20 }}
							style={{
								position: 'absolute',
								background: color,
								border: '1px solid #ffffff',
								padding: '4px 8px',
								borderRadius: 6,
								color: '#ffffff',
								fontSize: 10,
								fontWeight: 600,
								boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
								whiteSpace: 'nowrap',
							}}
						>
							typing...
						</motion.div>
					)}
				</motion.div>
			</motion.div>
		</AnimatePresence>
	)
}
