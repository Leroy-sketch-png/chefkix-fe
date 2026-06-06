'use client'

import { useEffect, useState } from 'react'

export function DemoQROverlay() {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return
		const channel = new BroadcastChannel('chefkix-demo-bus')
		
		channel.onmessage = (e) => {
			if (e.data?.type === 'TOGGLE_QR_OVERLAY') {
				setIsVisible(v => !v)
			}
		}
		
		return () => channel.close()
	}, [])

	if (!isVisible) return null

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 99999,
				backgroundColor: 'rgba(13, 17, 23, 0.95)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backdropFilter: 'blur(10px)',
				animation: 'fadeIn 0.3s ease-out'
			}}
			onClick={() => setIsVisible(false)}
		>
			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: scale(0.98); }
					to { opacity: 1; transform: scale(1); }
				}
			`}</style>
			<div style={{ textAlign: 'center', color: '#e6edf3' }}>
				<h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Scan to Follow Along</h2>
				<div 
					style={{ 
						background: '#fff', 
						padding: 32, 
						borderRadius: 16,
						display: 'inline-block',
						boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
					}}
				>
					{/* Placeholder for QR Code, visually high-contrast */}
					<div style={{ width: 300, height: 300, background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><path d="M10 10h20v20H10zM15 15h10v10H15zM70 10h20v20H70zM75 15h10v10H75zM10 70h20v20H10zM15 75h10v10H15zM40 10h20v10H40zM40 30h10v20H40zM60 40h30v10H60zM10 40h20v10H10zM30 60h40v10H30zM70 70h10v10H70zM80 80h10v10H80z" fill="black"/></svg>') center/contain no-repeat` }} />
				</div>
				<p style={{ marginTop: 24, fontSize: 18, color: '#8b949e', maxWidth: 400 }}>
					Join the live session as a spectator. No app download required.
				</p>
			</div>
		</div>
	)
}
