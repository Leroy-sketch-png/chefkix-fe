'use client'

import { useEffect, useState } from 'react'

const DEMO_COCKPIT_SESSION_KEY = 'chefkix-demo-cockpit-enabled'

export default function DemoCockpitPage() {
	const [armedAt, setArmedAt] = useState<string>('')

	useEffect(() => {
		window.sessionStorage.setItem(DEMO_COCKPIT_SESSION_KEY, 'true')
		setArmedAt(new Date().toLocaleTimeString())
	}, [])

	return (
		<main
			style={{
				minHeight: '100vh',
				display: 'grid',
				placeItems: 'center',
				background: '#0d1117',
				color: '#e6edf3',
				fontFamily:
					'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				padding: 24,
			}}
		>
			<section
				aria-label='Demo cockpit armed'
				style={{
					width: 'min(680px, 100%)',
					textAlign: 'center',
					display: 'grid',
					gap: 18,
				}}
			>
				<div
					style={{
						margin: '0 auto',
						width: 12,
						height: 12,
						borderRadius: 999,
						background: '#3fb950',
						boxShadow: '0 0 0 8px rgba(63, 185, 80, 0.14)',
					}}
				/>
				<div style={{ display: 'grid', gap: 8 }}>
					<p
						style={{
							margin: 0,
							color: '#8b949e',
							fontSize: 12,
							fontWeight: 800,
							letterSpacing: 0,
							textTransform: 'uppercase',
						}}
					>
						ChefKix Live Demo Cockpit
					</p>
					<h1
						style={{
							margin: 0,
							fontSize: 40,
							lineHeight: 1.05,
							fontWeight: 850,
							letterSpacing: 0,
						}}
					>
						Armed and waiting for the remote
					</h1>
				</div>
				<p
					style={{
						margin: 0,
						color: '#c9d1d9',
						fontSize: 16,
						lineHeight: 1.6,
					}}
				>
					Command bus online. Presenter control is active.
				</p>
				<div
					style={{
						margin: '8px auto 0',
						color: '#8b949e',
						fontSize: 12,
						fontVariantNumeric: 'tabular-nums',
					}}
				>
					{armedAt ? `Armed at ${armedAt}` : 'Arming...'}
				</div>
			</section>
		</main>
	)
}
