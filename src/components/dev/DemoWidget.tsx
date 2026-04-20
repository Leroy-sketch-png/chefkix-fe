'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

// Only render in development
const IS_DEV = process.env.NODE_ENV === 'development'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'

interface QuickRoute {
	label: string
	path: string
	icon: string
	description: string
}

const DEMO_ROUTES: QuickRoute[] = [
	{
		label: 'Dashboard',
		path: '/dashboard',
		icon: '🏠',
		description: 'Home feed & activity',
	},
	{
		label: 'Explore',
		path: '/explore',
		icon: '🔍',
		description: 'Discover recipes & creators',
	},
	{
		label: 'Create Recipe',
		path: '/create',
		icon: '✏️',
		description: 'Recipe editor',
	},
	{
		label: 'Challenges',
		path: '/challenges',
		icon: '🏆',
		description: 'Daily & seasonal',
	},
	{
		label: 'Messages',
		path: '/messages',
		icon: '💬',
		description: 'Chat conversations',
	},
	{
		label: 'Profile',
		path: '/profile',
		icon: '👤',
		description: 'User profile & stats',
	},
	{
		label: 'Leaderboard',
		path: '/leaderboard',
		icon: '📊',
		description: 'Rankings & XP',
	},
	{
		label: 'Pantry',
		path: '/pantry',
		icon: '🥫',
		description: 'Ingredient tracking',
	},
	{
		label: 'Settings',
		path: '/settings',
		icon: '⚙️',
		description: 'Preferences',
	},
	{
		label: 'Creator Studio',
		path: '/creator',
		icon: '🎬',
		description: 'Analytics & tools',
	},
	{
		label: 'Meal Planner',
		path: '/meal-planner',
		icon: '📅',
		description: 'Weekly meals',
	},
]

const TEST_ACCOUNTS = [
	{ label: 'Test User', username: 'testuser', password: 'test123' },
]

export function DemoWidget() {
	const [isOpen, setIsOpen] = useState(false)
	const [isMinimized, setIsMinimized] = useState(false)
	const [backendStatus, setBackendStatus] = useState<
		'checking' | 'up' | 'down'
	>('checking')
	const [isLoggingIn, setIsLoggingIn] = useState(false)
	const [flashMessage, setFlashMessage] = useState<string | null>(null)
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

	const flash = useCallback((msg: string) => {
		setFlashMessage(msg)
		setTimeout(() => setFlashMessage(null), 2000)
	}, [])

	const quickLogin = useCallback(
		async (username: string, password: string) => {
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
				flash('Logged in! Refreshing...')
				setTimeout(() => window.location.reload(), 500)
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

	// Only render in dev mode, hide on /_dev page
	if (!IS_DEV || pathname === '/_dev') return null

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
									{TEST_ACCOUNTS.map(acc => (
										<button
											key={acc.username}
											onClick={() => quickLogin(acc.username, acc.password)}
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

						{/* Quick Actions */}
						<div
							style={{
								padding: '8px 16px 12px',
								borderTop: '1px solid #21262d',
							}}
						>
							<div style={{ display: 'flex', gap: 6 }}>
								<button
									onClick={() => navigateTo('/_dev')}
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
