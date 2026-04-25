'use client'

import { useEffect, useState, useCallback } from 'react'
import { notFound } from 'next/navigation'

// ─── Types ──────────────────────────────────────────────────────────────────
interface ServiceStatus {
	name: string
	port: number
	status: 'up' | 'down' | 'checking'
	latency?: number
	detail?: string
}

interface ApiTestResult {
	name: string
	path: string
	status: 'pass' | 'fail' | 'pending'
	code?: number
	detail?: string
	latency?: number
}

interface TestAccount {
	label: string
	username: string
	password: string
	email: string
	description: string
}

// ─── Constants ──────────────────────────────────────────────────────────────
const SERVICES: Omit<ServiceStatus, 'status'>[] = [
	{ name: 'Frontend (Next.js)', port: 3000 },
	{ name: 'Monolith (Spring Boot)', port: 8080 },
	{ name: 'AI Service (FastAPI)', port: 8000 },
	{ name: 'Keycloak (Identity)', port: 8180 },
	{ name: 'MongoDB', port: 27017 },
	{ name: 'Redis', port: 6379 },
	{ name: 'Kafka', port: 9094 },
	{ name: 'Typesense (Search)', port: 8108 },
]

const TEST_ACCOUNTS: TestAccount[] = [
	{
		label: 'Default Test User',
		username: 'testuser',
		password: 'test123',
		email: 'test@chefkix.com',
		description: 'Primary test account with seed data',
	},
]

const HEALTH_ENDPOINTS = [
	{ name: 'Monolith Health', url: '/api/v1/actuator/health' },
	{ name: 'AI Service', url: 'http://localhost:8000/health', direct: true },
	{
		name: 'Keycloak Realm',
		url: 'http://localhost:8180/realms/nottisn',
		direct: true,
	},
]

const API_TESTS = [
	{
		name: 'Login',
		path: '/api/v1/auth/login',
		method: 'POST',
		body: { emailOrUsername: 'testuser', password: 'test123' },
	},
	{ name: 'Auth/Me', path: '/api/v1/auth/me', auth: true },
	{ name: 'Settings', path: '/api/v1/auth/settings', auth: true },
	{ name: 'Creator Stats', path: '/api/v1/auth/me/creator-stats', auth: true },
	{
		name: 'Leaderboard',
		path: '/api/v1/auth/leaderboard?type=GLOBAL&timeframe=WEEKLY&limit=10',
		auth: true,
	},
	{ name: 'Followers', path: '/api/v1/social/followers', auth: true },
	{ name: 'Following', path: '/api/v1/social/following', auth: true },
	{ name: 'Friends', path: '/api/v1/social/friends', auth: true },
	{ name: 'Recipes', path: '/api/v1/recipes?page=0&size=3', auth: true },
	{ name: 'Drafts', path: '/api/v1/recipes/drafts', auth: true },
	{
		name: 'Trending',
		path: '/api/v1/recipes/trending?page=0&size=3',
		auth: true,
	},
	{ name: 'Tonight Pick', path: '/api/v1/recipes/tonight-pick', auth: true },
	{
		name: 'Cooking Session',
		path: '/api/v1/cooking-sessions/current',
		auth: true,
	},
	{ name: 'Challenge Today', path: '/api/v1/challenges/today', auth: true },
	{ name: 'Challenge Weekly', path: '/api/v1/challenges/weekly', auth: true },
	{ name: 'Pantry', path: '/api/v1/pantry', auth: true },
	{ name: 'Posts/All', path: '/api/v1/posts/all?page=0&size=3', auth: true },
	{
		name: 'Posts/Following',
		path: '/api/v1/posts/following?page=0&size=3',
		auth: true,
	},
	{
		name: 'Posts/Saved',
		path: '/api/v1/posts/saved?page=0&size=3',
		auth: true,
	},
	{ name: 'Notifications', path: '/api/v1/notification', auth: true },
	{
		name: 'Unread Count',
		path: '/api/v1/notification/unread-count',
		auth: true,
	},
	{
		name: 'Conversations',
		path: '/api/v1/chat/conversations/my-conversations',
		auth: true,
	},
	{
		name: 'Search',
		path: '/api/v1/search?q=pasta&type=ALL&limit=5',
		auth: true,
	},
	{ name: 'Achievements', path: '/api/v1/achievements', auth: true },
	{
		name: 'Skill Tree',
		path: '/api/v1/achievements/my-skill-tree',
		auth: true,
	},
	{ name: 'Referral Code', path: '/api/v1/referrals/my-code', auth: true },
	{ name: 'Subscription', path: '/api/v1/subscription/my', auth: true },
	{ name: 'Ban Status', path: '/api/v1/moderation/ban-status', auth: true },
	{ name: 'Presence', path: '/api/v1/presence/friends', auth: true },
	{
		name: 'Ingredients',
		path: '/api/v1/knowledge/ingredients?q=salt',
		auth: true,
	},
]

const QUICK_LINKS = [
	{
		label: 'Swagger UI',
		url: 'http://localhost:8080/api/v1/swagger-ui.html',
		icon: '📄',
	},
	{
		label: 'Keycloak Admin',
		url: 'http://localhost:8180/admin/master/console/',
		icon: '🔐',
	},
	{ label: 'AI Service Docs', url: 'http://localhost:8000/docs', icon: '🤖' },
	{ label: 'Mongo Express', url: 'http://localhost:8081', icon: '🗄️' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'

async function checkServiceHealth(
	port: number,
): Promise<{ up: boolean; latency: number; detail?: string }> {
	const start = Date.now()
	try {
		// For HTTP services we can test, use fetch. For TCP-only (Mongo, Redis, Kafka), proxy through monolith health
		if ([3000, 8080, 8000, 8180, 8108].includes(port)) {
			const urlMap: Record<number, string> = {
				3000: '/',
				8080: '/api/v1/actuator/health',
				8000: 'http://localhost:8000/health',
				8180: 'http://localhost:8180/realms/nottisn',
				8108: 'http://localhost:8108/health',
			}
			const url = port === 3000 ? urlMap[port] : urlMap[port]
			const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
			const latency = Date.now() - start
			if (port === 8108 && res.status === 503) {
				return { up: false, latency, detail: 'Raft not ready' }
			}
			return { up: res.ok || res.status === 401, latency }
		}
		// For TCP services, just assume up if monolith is healthy (they're dependencies)
		return { up: true, latency: 0, detail: 'Inferred from monolith health' }
	} catch {
		return { up: false, latency: Date.now() - start }
	}
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function DevDashboard() {
	// Block this page in production builds
	if (process.env.NODE_ENV === 'production') {
		notFound()
	}

	const [services, setServices] = useState<ServiceStatus[]>(
		SERVICES.map(s => ({ ...s, status: 'checking' as const })),
	)
	const [apiResults, setApiResults] = useState<ApiTestResult[]>(
		API_TESTS.map(t => ({
			name: t.name,
			path: t.path,
			status: 'pending' as const,
		})),
	)
	const [token, setToken] = useState<string | null>(null)
	const [copied, setCopied] = useState<string | null>(null)
	const [isRunningApiTests, setIsRunningApiTests] = useState(false)
	const [isLoggingInToApp, setIsLoggingInToApp] = useState(false)
	const [lastCheck, setLastCheck] = useState<Date | null>(null)

	// Copy to clipboard
	const copy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text)
		setCopied(label)
		setTimeout(() => setCopied(null), 2000)
	}, [])

	// Check all service health
	const checkServices = useCallback(async () => {
		setServices(prev => prev.map(s => ({ ...s, status: 'checking' as const })))

		const results = await Promise.all(
			SERVICES.map(async svc => {
				const result = await checkServiceHealth(svc.port)
				return {
					...svc,
					status: result.up ? ('up' as const) : ('down' as const),
					latency: result.latency,
					detail: result.detail,
				}
			}),
		)

		setServices(results)
		setLastCheck(new Date())
	}, [])

	// Login and get token
	const doLogin = useCallback(async (username: string, password: string) => {
		try {
			const res = await fetch(`${BASE}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emailOrUsername: username, password }),
			})
			const data = await res.json()
			if (data.success && data.data?.accessToken) {
				setToken(data.data.accessToken)
				return data.data.accessToken
			}
			return null
		} catch {
			return null
		}
	}, [])

	// Login and inject session directly into the app
	const loginToApp = useCallback(async (username: string, password: string) => {
		setIsLoggingInToApp(true)
		try {
			const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ emailOrUsername: username, password }),
			})
			const loginData = await loginRes.json()
			if (!loginData.success || !loginData.data?.accessToken) {
				console.error('Login failed:', loginData.message || 'Check credentials')
				return
			}
			const accessToken = loginData.data.accessToken
			const meRes = await fetch(`${BASE}/api/v1/auth/me`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			})
			const meData = await meRes.json()
			if (!meData.success || !meData.data) {
				console.error('Could not fetch user profile')
				return
			}
			localStorage.setItem(
				'auth-storage',
				JSON.stringify({
					state: { isAuthenticated: true, accessToken, user: meData.data },
					version: 0,
				}),
			)
			window.location.href = '/dashboard'
		} catch (err) {
			console.error(
				'Dev login error:',
				err instanceof Error ? err.message : 'Unknown',
			)
		} finally {
			setIsLoggingInToApp(false)
		}
	}, [])

	// Run all API tests
	const runApiTests = useCallback(async () => {
		setIsRunningApiTests(true)
		setApiResults(
			API_TESTS.map(t => ({
				name: t.name,
				path: t.path,
				status: 'pending' as const,
			})),
		)

		// Get token first
		let authToken = token
		if (!authToken) {
			authToken = await doLogin('testuser', 'test123')
			if (!authToken) {
				setApiResults(
					API_TESTS.map(t => ({
						name: t.name,
						path: t.path,
						status: 'fail' as const,
						detail: 'Could not obtain auth token',
					})),
				)
				setIsRunningApiTests(false)
				return
			}
		}

		const results: ApiTestResult[] = []
		for (const test of API_TESTS) {
			const start = Date.now()
			try {
				const headers: Record<string, string> = {}
				if (test.auth) headers['Authorization'] = `Bearer ${authToken}`
				if (test.method === 'POST') headers['Content-Type'] = 'application/json'

				const url = test.path.startsWith('http')
					? test.path
					: `${BASE}${test.path}`
				const res = await fetch(url, {
					method: test.method || 'GET',
					headers,
					body: test.body ? JSON.stringify(test.body) : undefined,
					signal: AbortSignal.timeout(10000),
				})

				const latency = Date.now() - start
				const body = await res.json().catch(() => null)
				const success = res.ok && body?.success !== false

				results.push({
					name: test.name,
					path: test.path,
					status: success ? 'pass' : 'fail',
					code: res.status,
					latency,
					detail: success ? undefined : body?.message || `HTTP ${res.status}`,
				})
			} catch (err) {
				results.push({
					name: test.name,
					path: test.path,
					status: 'fail',
					latency: Date.now() - start,
					detail: err instanceof Error ? err.message : 'Unknown error',
				})
			}

			// Update incrementally
			setApiResults([
				...results,
				...API_TESTS.slice(results.length).map(t => ({
					name: t.name,
					path: t.path,
					status: 'pending' as const,
				})),
			])
		}

		setApiResults(results)
		setIsRunningApiTests(false)
	}, [token, doLogin])

	// Auto-check on mount
	useEffect(() => {
		checkServices()
	}, [checkServices])

	const upCount = services.filter(s => s.status === 'up').length
	const passCount = apiResults.filter(r => r.status === 'pass').length
	const failCount = apiResults.filter(r => r.status === 'fail').length

	return (
		<div
			style={{
				minHeight: '100vh',
				background: '#0d1117',
				color: '#e6edf3',
				fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
			}}
		>
			{/* Header */}
			<div
				style={{
					borderBottom: '1px solid #30363d',
					padding: '16px 24px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<span style={{ fontSize: 24 }}>🔧</span>
					<h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
						ChefKix Dev Dashboard
					</h1>
					<span
						style={{
							background:
								upCount === SERVICES.length
									? '#238636'
									: upCount > 0
										? '#d29922'
										: '#f85149',
							color: '#fff',
							padding: '2px 8px',
							borderRadius: 12,
							fontSize: 11,
							fontWeight: 600,
						}}
					>
						{upCount}/{SERVICES.length} services
					</span>
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						fontSize: 12,
						color: '#8b949e',
					}}
				>
					{lastCheck && (
						<span>Last check: {lastCheck.toLocaleTimeString()}</span>
					)}
					<button
						onClick={checkServices}
						style={{
							background: '#21262d',
							border: '1px solid #30363d',
							color: '#e6edf3',
							padding: '4px 12px',
							borderRadius: 6,
							cursor: 'pointer',
							fontSize: 12,
						}}
					>
						↻ Refresh
					</button>
				</div>
			</div>

			<div
				style={{
					padding: '24px',
					maxWidth: 1400,
					margin: '0 auto',
					display: 'grid',
					gap: 24,
				}}
			>
				{/* Row 1: Service Status + Test Accounts */}
				<div
					style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
				>
					{/* Service Status */}
					<div
						style={{
							background: '#161b22',
							border: '1px solid #30363d',
							borderRadius: 8,
							padding: 16,
						}}
					>
						<h2
							style={{
								fontSize: 14,
								fontWeight: 600,
								marginBottom: 12,
								color: '#8b949e',
								textTransform: 'uppercase',
								letterSpacing: 1,
							}}
						>
							Infrastructure Status
						</h2>
						<div style={{ display: 'grid', gap: 6 }}>
							{services.map(svc => (
								<div
									key={svc.name}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '8px 12px',
										background: '#0d1117',
										borderRadius: 6,
										border: `1px solid ${svc.status === 'up' ? '#238636' : svc.status === 'down' ? '#f85149' : '#30363d'}`,
									}}
								>
									<div
										style={{ display: 'flex', alignItems: 'center', gap: 8 }}
									>
										<span
											style={{
												width: 8,
												height: 8,
												borderRadius: '50%',
												background:
													svc.status === 'up'
														? '#3fb950'
														: svc.status === 'down'
															? '#f85149'
															: '#d29922',
												display: 'inline-block',
												animation:
													svc.status === 'checking'
														? 'pulse 1s infinite'
														: undefined,
											}}
										/>
										<span style={{ fontSize: 13 }}>{svc.name}</span>
									</div>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 8,
											fontSize: 12,
											color: '#8b949e',
										}}
									>
										<span>:{svc.port}</span>
										{svc.latency !== undefined && svc.latency > 0 && (
											<span
												style={{
													color:
														svc.latency < 100
															? '#3fb950'
															: svc.latency < 500
																? '#d29922'
																: '#f85149',
												}}
											>
												{svc.latency}ms
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Test Accounts + Quick Login */}
					<div
						style={{
							background: '#161b22',
							border: '1px solid #30363d',
							borderRadius: 8,
							padding: 16,
						}}
					>
						<h2
							style={{
								fontSize: 14,
								fontWeight: 600,
								marginBottom: 12,
								color: '#8b949e',
								textTransform: 'uppercase',
								letterSpacing: 1,
							}}
						>
							Test Accounts
						</h2>
						{TEST_ACCOUNTS.map(account => (
							<div
								key={account.username}
								style={{
									background: '#0d1117',
									border: '1px solid #30363d',
									borderRadius: 8,
									padding: 12,
									marginBottom: 8,
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: 8,
									}}
								>
									<span style={{ fontWeight: 600, fontSize: 14 }}>
										{account.label}
									</span>
									<div style={{ display: 'flex', gap: 6 }}>
										<button
											onClick={() =>
												loginToApp(account.username, account.password)
											}
											disabled={isLoggingInToApp}
											style={{
												background: isLoggingInToApp ? '#21262d' : '#1f6feb',
												border: 'none',
												color: '#fff',
												padding: '4px 12px',
												borderRadius: 6,
												cursor: isLoggingInToApp ? 'not-allowed' : 'pointer',
												fontSize: 11,
												fontWeight: 600,
											}}
										>
											{isLoggingInToApp ? 'Logging in...' : 'Open App →'}
										</button>
										<button
											onClick={() =>
												doLogin(account.username, account.password).then(t => {
													if (t) copy(t, 'token')
												})
											}
											style={{
												background: '#238636',
												border: 'none',
												color: '#fff',
												padding: '4px 12px',
												borderRadius: 6,
												cursor: 'pointer',
												fontSize: 11,
												fontWeight: 600,
											}}
										>
											Copy Token
										</button>
									</div>
								</div>
								<div style={{ display: 'grid', gap: 4, fontSize: 12 }}>
									{[
										{ label: 'Username', value: account.username },
										{ label: 'Password', value: account.password },
										{ label: 'Email', value: account.email },
									].map(field => (
										<div
											key={field.label}
											style={{ display: 'flex', alignItems: 'center', gap: 8 }}
										>
											<span style={{ color: '#8b949e', width: 70 }}>
												{field.label}:
											</span>
											<code
												style={{
													background: '#21262d',
													padding: '2px 6px',
													borderRadius: 4,
													flex: 1,
												}}
											>
												{field.value}
											</code>
											<button
												onClick={() => copy(field.value, field.label)}
												style={{
													background: 'transparent',
													border: '1px solid #30363d',
													color: copied === field.label ? '#3fb950' : '#8b949e',
													padding: '2px 6px',
													borderRadius: 4,
													cursor: 'pointer',
													fontSize: 11,
												}}
											>
												{copied === field.label ? '✓' : '⎘'}
											</button>
										</div>
									))}
								</div>
								<p
									style={{ margin: '6px 0 0', fontSize: 11, color: '#8b949e' }}
								>
									{account.description}
								</p>
							</div>
						))}

						{/* Current Token */}
						{token && (
							<div
								style={{
									background: '#0d1117',
									border: '1px solid #238636',
									borderRadius: 8,
									padding: 12,
									marginTop: 8,
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: 6,
									}}
								>
									<span
										style={{ fontSize: 12, fontWeight: 600, color: '#3fb950' }}
									>
										Active Token
									</span>
									<button
										onClick={() => copy(token, 'token')}
										style={{
											background: copied === 'token' ? '#238636' : '#21262d',
											border: '1px solid #30363d',
											color: '#e6edf3',
											padding: '4px 10px',
											borderRadius: 4,
											cursor: 'pointer',
											fontSize: 11,
										}}
									>
										{copied === 'token' ? '✓ Copied' : 'Copy Token'}
									</button>
								</div>
								<code
									style={{
										fontSize: 10,
										color: '#8b949e',
										wordBreak: 'break-all',
										display: 'block',
									}}
								>
									{token.substring(0, 80)}...
								</code>
							</div>
						)}

						{/* Keycloak Admin */}
						<div
							style={{
								background: '#0d1117',
								border: '1px solid #30363d',
								borderRadius: 8,
								padding: 12,
								marginTop: 8,
							}}
						>
							<span style={{ fontSize: 12, fontWeight: 600, color: '#d29922' }}>
								Keycloak Admin Console
							</span>
							<div
								style={{ display: 'grid', gap: 4, fontSize: 12, marginTop: 6 }}
							>
								{[
									{ label: 'URL', value: 'http://localhost:8180/admin' },
									{ label: 'User', value: 'admin' },
									{ label: 'Pass', value: 'admin' },
								].map(field => (
									<div
										key={field.label}
										style={{ display: 'flex', alignItems: 'center', gap: 8 }}
									>
										<span style={{ color: '#8b949e', width: 40 }}>
											{field.label}:
										</span>
										<code
											style={{
												background: '#21262d',
												padding: '2px 6px',
												borderRadius: 4,
												flex: 1,
											}}
										>
											{field.value}
										</code>
										<button
											onClick={() => copy(field.value, `kc-${field.label}`)}
											style={{
												background: 'transparent',
												border: '1px solid #30363d',
												color:
													copied === `kc-${field.label}`
														? '#3fb950'
														: '#8b949e',
												padding: '2px 6px',
												borderRadius: 4,
												cursor: 'pointer',
												fontSize: 11,
											}}
										>
											{copied === `kc-${field.label}` ? '✓' : '⎘'}
										</button>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Row 2: API Health Tests */}
				<div
					style={{
						background: '#161b22',
						border: '1px solid #30363d',
						borderRadius: 8,
						padding: 16,
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 12,
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
							<h2
								style={{
									fontSize: 14,
									fontWeight: 600,
									color: '#8b949e',
									textTransform: 'uppercase',
									letterSpacing: 1,
									margin: 0,
								}}
							>
								API Endpoint Tests
							</h2>
							{passCount + failCount > 0 && (
								<span
									style={{
										background: failCount === 0 ? '#238636' : '#f85149',
										color: '#fff',
										padding: '2px 8px',
										borderRadius: 12,
										fontSize: 11,
										fontWeight: 600,
									}}
								>
									{passCount}/{API_TESTS.length} passed
								</span>
							)}
						</div>
						<button
							onClick={runApiTests}
							disabled={isRunningApiTests}
							style={{
								background: isRunningApiTests ? '#21262d' : '#238636',
								border: 'none',
								color: '#fff',
								padding: '6px 16px',
								borderRadius: 6,
								cursor: isRunningApiTests ? 'not-allowed' : 'pointer',
								fontSize: 12,
								fontWeight: 600,
							}}
						>
							{isRunningApiTests ? 'Running...' : '▶ Run All Tests'}
						</button>
					</div>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
							gap: 6,
						}}
					>
						{apiResults.map(result => (
							<div
								key={result.name}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '6px 10px',
									background: '#0d1117',
									borderRadius: 6,
									border: `1px solid ${result.status === 'pass' ? '#238636' : result.status === 'fail' ? '#f85149' : '#30363d'}`,
									fontSize: 12,
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 6,
										flex: 1,
										minWidth: 0,
									}}
								>
									<span>
										{result.status === 'pass'
											? '✅'
											: result.status === 'fail'
												? '❌'
												: '⏳'}
									</span>
									<span style={{ fontWeight: 500 }}>{result.name}</span>
								</div>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 6,
										color: '#8b949e',
										flexShrink: 0,
									}}
								>
									{result.code && <span>{result.code}</span>}
									{result.latency && (
										<span
											style={{
												color:
													result.latency < 200
														? '#3fb950'
														: result.latency < 1000
															? '#d29922'
															: '#f85149',
											}}
										>
											{result.latency}ms
										</span>
									)}
								</div>
							</div>
						))}
					</div>
					{failCount > 0 && (
						<div
							style={{
								marginTop: 12,
								padding: 12,
								background: '#1c0d12',
								border: '1px solid #f85149',
								borderRadius: 6,
							}}
						>
							<h3
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: '#f85149',
									marginBottom: 8,
								}}
							>
								Failures
							</h3>
							{apiResults
								.filter(r => r.status === 'fail')
								.map(r => (
									<div key={r.name} style={{ fontSize: 11, marginBottom: 4 }}>
										<span style={{ color: '#f85149', fontWeight: 600 }}>
											{r.name}
										</span>
										<span style={{ color: '#8b949e' }}>
											{' '}
											— {r.detail || `HTTP ${r.code}`}
										</span>
										<code
											style={{
												display: 'block',
												color: '#8b949e',
												fontSize: 10,
												marginTop: 2,
											}}
										>
											{r.path}
										</code>
									</div>
								))}
						</div>
					)}
				</div>

				{/* OTP Dev Mode Banner */}
				<div
					style={{
						background: '#161b22',
						border: '1px solid #d29922',
						borderRadius: 8,
						padding: 16,
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: 24,
					}}
				>
					<div>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								marginBottom: 10,
							}}
						>
							<h2
								style={{
									fontSize: 14,
									fontWeight: 600,
									color: '#d29922',
									textTransform: 'uppercase',
									letterSpacing: 1,
									margin: 0,
								}}
							>
								Dev Email / OTP
							</h2>
						</div>
						<p
							style={{
								margin: '0 0 8px',
								fontSize: 12,
								color: '#e6edf3',
								lineHeight: 1.6,
							}}
						>
							Brevo is not configured for local dev. When you register or resend
							OTP, the code is{' '}
							<strong style={{ color: '#d29922' }}>
								printed to the monolith window
							</strong>{' '}
							instead of your email inbox.
						</p>
						<div
							style={{
								background: '#0d1117',
								border: '1px solid #30363d',
								borderRadius: 6,
								padding: 10,
								marginBottom: 8,
							}}
						>
							<div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>
								Look for this line in the monolith window:
							</div>
							<code
								style={{ fontSize: 12, color: '#3fb950', display: 'block' }}
							>
								[DEV EMAIL BYPASS] *** OTP CODE: 123456 ***
							</code>
						</div>
						<p style={{ margin: 0, fontSize: 11, color: '#8b949e' }}>
							To enable real emails: get a key at{' '}
							<a
								href='https://app.brevo.com/settings/keys/api'
								target='_blank'
								rel='noopener noreferrer'
								style={{ color: '#58a6ff' }}
							>
								app.brevo.com
							</a>{' '}
							and set{' '}
							<code
								style={{
									background: '#21262d',
									padding: '1px 4px',
									borderRadius: 3,
								}}
							>
								BREVO_API_KEY
							</code>{' '}
							in{' '}
							<code
								style={{
									background: '#21262d',
									padding: '1px 4px',
									borderRadius: 3,
								}}
							>
								chefkix-monolith/.env
							</code>
						</p>
					</div>
					<div>
						<div
							style={{
								fontSize: 12,
								fontWeight: 600,
								color: '#8b949e',
								textTransform: 'uppercase',
								letterSpacing: 1,
								marginBottom: 10,
							}}
						>
							Registration Flow (Dev)
						</div>
						{[
							{ step: '1', text: 'Register at /register with any email' },
							{
								step: '2',
								text: 'Watch the monolith window for [DEV EMAIL BYPASS]',
							},
							{ step: '3', text: 'Copy the OTP CODE from the log line' },
							{
								step: '4',
								text: 'Enter OTP at /verify-otp to complete signup',
							},
						].map(item => (
							<div
								key={item.step}
								style={{
									display: 'flex',
									alignItems: 'flex-start',
									gap: 10,
									padding: '6px 0',
									borderBottom: '1px solid #21262d',
									fontSize: 12,
								}}
							>
								<span
									style={{
										background: '#d29922',
										color: '#000',
										width: 18,
										height: 18,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 10,
										fontWeight: 700,
										flexShrink: 0,
									}}
								>
									{item.step}
								</span>
								<span style={{ color: '#e6edf3' }}>{item.text}</span>
							</div>
						))}
					</div>
				</div>

				{/* Row 3: Quick Links + cURL Generator */}
				<div
					style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
				>
					{/* Quick Links */}
					<div
						style={{
							background: '#161b22',
							border: '1px solid #30363d',
							borderRadius: 8,
							padding: 16,
						}}
					>
						<h2
							style={{
								fontSize: 14,
								fontWeight: 600,
								marginBottom: 12,
								color: '#8b949e',
								textTransform: 'uppercase',
								letterSpacing: 1,
							}}
						>
							Quick Links
						</h2>
						<div style={{ display: 'grid', gap: 6 }}>
							{QUICK_LINKS.map(link => (
								<a
									key={link.label}
									href={link.url}
									target='_blank'
									rel='noopener noreferrer'
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 8,
										padding: '8px 12px',
										background: '#0d1117',
										border: '1px solid #30363d',
										borderRadius: 6,
										color: '#58a6ff',
										textDecoration: 'none',
										fontSize: 13,
										transition: 'border-color 0.2s',
									}}
								>
									<span>{link.icon}</span>
									<span>{link.label}</span>
									<span
										style={{
											color: '#8b949e',
											fontSize: 11,
											marginLeft: 'auto',
										}}
									>
										{link.url.replace('http://', '')}
									</span>
								</a>
							))}
						</div>
					</div>

					{/* Port Reference + cURL */}
					<div
						style={{
							background: '#161b22',
							border: '1px solid #30363d',
							borderRadius: 8,
							padding: 16,
						}}
					>
						<h2
							style={{
								fontSize: 14,
								fontWeight: 600,
								marginBottom: 12,
								color: '#8b949e',
								textTransform: 'uppercase',
								letterSpacing: 1,
							}}
						>
							Dev Commands
						</h2>
						<div style={{ display: 'grid', gap: 6 }}>
							{[
								{
									label: 'Boot everything',
									cmd: 'dev.bat',
									dir: 'chefkix-infrastructure/',
								},
								{
									label: 'Boot backend only',
									cmd: 'dev.bat -BackendOnly',
									dir: 'chefkix-infrastructure/',
								},
								{
									label: 'Service status',
									cmd: 'dev.bat -Status',
									dir: 'chefkix-infrastructure/',
								},
								{
									label: 'Kill all services',
									cmd: 'dev.bat -Kill',
									dir: 'chefkix-infrastructure/',
								},
								{
									label: 'Reset & seed data',
									cmd: 'rinse-and-seed.bat',
									dir: 'chefkix-infrastructure/seed/',
								},
								{
									label: 'Fix Keycloak',
									cmd: 'dev.bat -FixKeycloak',
									dir: 'chefkix-infrastructure/',
								},
								{ label: 'Run FE', cmd: 'npm run dev', dir: 'chefkix-fe/' },
								{ label: 'Run AI', cmd: 'run.bat', dir: 'chefkix-ai-service/' },
							].map(item => (
								<div
									key={item.label}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '6px 10px',
										background: '#0d1117',
										border: '1px solid #30363d',
										borderRadius: 6,
										fontSize: 12,
									}}
								>
									<span style={{ color: '#8b949e' }}>{item.label}</span>
									<div
										style={{ display: 'flex', alignItems: 'center', gap: 6 }}
									>
										<code
											style={{
												background: '#21262d',
												padding: '2px 8px',
												borderRadius: 4,
												color: '#79c0ff',
											}}
										>
											{item.cmd}
										</code>
										<button
											onClick={() =>
												copy(`cd ${item.dir} && ${item.cmd}`, item.cmd)
											}
											style={{
												background: 'transparent',
												border: '1px solid #30363d',
												color: copied === item.cmd ? '#3fb950' : '#8b949e',
												padding: '2px 6px',
												borderRadius: 4,
												cursor: 'pointer',
												fontSize: 10,
											}}
										>
											{copied === item.cmd ? '✓' : '⎘'}
										</button>
									</div>
								</div>
							))}
						</div>

						{/* cURL with token */}
						{token && (
							<div style={{ marginTop: 12 }}>
								<span style={{ fontSize: 11, color: '#8b949e' }}>
									Quick cURL (with active token):
								</span>
								<div
									style={{
										background: '#0d1117',
										border: '1px solid #30363d',
										borderRadius: 6,
										padding: 8,
										marginTop: 4,
										cursor: 'pointer',
									}}
									onClick={() =>
										copy(
											`curl -H "Authorization: Bearer ${token}" http://localhost:8080/api/v1/auth/me`,
											'curl',
										)
									}
								>
									<code
										style={{
											fontSize: 10,
											color: '#79c0ff',
											wordBreak: 'break-all',
										}}
									>
										curl -H &quot;Authorization: Bearer {token.substring(0, 30)}
										...&quot; http://localhost:8080/api/v1/auth/me
									</code>
									{copied === 'curl' && (
										<span
											style={{ color: '#3fb950', fontSize: 10, marginLeft: 8 }}
										>
											✓ Copied
										</span>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div
					style={{
						textAlign: 'center',
						fontSize: 11,
						color: '#484f58',
						padding: '8px 0',
					}}
				>
					ChefKix Dev Dashboard — Only visible in development mode — Not shipped
					to production
				</div>
			</div>

			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.3; }
				}
				button:hover {
					opacity: 0.85;
				}
				a:hover {
					border-color: #58a6ff !important;
				}
			`}</style>
		</div>
	)
}
