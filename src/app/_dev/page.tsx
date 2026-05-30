'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { notFound, useSearchParams } from 'next/navigation'
import {
	DEMO_ACCOUNTS,
	DEMO_BASE_URL,
	DEMO_PITCH_BEATS,
	DEMO_PITCH_SHORTCUTS,
	DEMO_ROUTES,
	getBeatReadinessChecks,
	getBeatReadinessStatus,
	getDemoAccount,
	getDemoPitchShortcut,
	loadDemoReadinessReport,
	resetDemoReadinessCache,
	resolveDemoShortcut,
	getDemoVault,
	swapPersonaFromVault,
	type DemoReadinessReport,
	type DemoReadinessStatus,
	type DemoPitchShortcut,
} from '@/components/dev/demo-config'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { PremiumSurface } from '@/components/layout/PremiumSurface'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import {
	Terminal,
	RefreshCw,
	Copy,
	Check,
	Key,
	Shield,
	ExternalLink,
	Clock,
	Play,
	AlertCircle,
	SlidersHorizontal,
	ChevronsDown,
	ChevronsUp,
	Zap,
	StopCircle,
	Trash2,
	ShieldAlert,
} from 'lucide-react'

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
		url: `${DEMO_BASE_URL}/api/v1/swagger-ui.html`,
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

const ORCHESTRATOR_PROFILES = [
	{
		id: 'deep-strict',
		label: 'Deep Strict',
		scenario: 'demo-cockpit-deep',
		headless: true,
		strict: true,
		selectorPreflight: true,
		strictSceneFallback: false,
		captureScreenshots: false,
		continueOnError: false,
		checkpointMode: 'off',
		hostFailover: false,
		scenarioTimeoutMs: 660000,
	},
	{
		id: 'smoke-fast',
		label: 'Smoke Fast',
		scenario: 'demo-cockpit-deep',
		headless: true,
		strict: false,
		selectorPreflight: false,
		strictSceneFallback: true,
		captureScreenshots: false,
		continueOnError: true,
		checkpointMode: 'off',
		hostFailover: false,
		scenarioTimeoutMs: 240000,
	},
	{
		id: 'forensics',
		label: 'Forensics',
		scenario: 'demo-cockpit-deep',
		headless: true,
		strict: true,
		selectorPreflight: true,
		strictSceneFallback: true,
		captureScreenshots: true,
		continueOnError: false,
		checkpointMode: 'prompt',
		hostFailover: false,
		scenarioTimeoutMs: 780000,
	},
] as const

const CHEAT_ENGINE_STORAGE_KEY = 'chefkix-dev-cheat-engine-state-v1'

const STRICT_BASELINE = {
	scenario: 'demo-cockpit-deep',
	headless: true,
	strict: true,
	selectorPreflight: true,
	strictSceneFallback: false,
	captureScreenshots: false,
	continueOnError: false,
	checkpointMode: 'off',
	hostFailover: false,
	scenarioTimeoutMs: 660000,
} as const

// ─── Helpers ────────────────────────────────────────────────────────────────
const BASE = DEMO_BASE_URL

function getReadinessTone(status: DemoReadinessStatus | null): {
	label: string
	background: string
	border: string
	color: string
} {
	switch (status) {
		case 'ready':
			return {
				label: 'Ready',
				background: '#23863622',
				border: '#23863666',
				color: '#3fb950',
			}
		case 'warning':
			return {
				label: 'Watch',
				background: '#d299221f',
				border: '#d2992266',
				color: '#d29922',
			}
		case 'blocked':
			return {
				label: 'Blocked',
				background: '#f851491f',
				border: '#f8514966',
				color: '#f85149',
			}
		default:
			return {
				label: 'Unknown',
				background: '#21262d',
				border: '#30363d',
				color: '#8b949e',
			}
	}
}

function formatReadinessTimestamp(value: string | null | undefined): string {
	if (!value) {
		return 'No report yet'
	}

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) {
		return value
	}

	return parsed.toLocaleString()
}

async function checkServiceHealth(
	port: number,
): Promise<{ up: boolean; latency: number; detail?: string }> {
	const start = Date.now()
	try {
		// For HTTP services we can test, use fetch. For TCP-only (Mongo, Redis, Kafka), proxy through monolith health
		if ([3000, 8080, 8000, 8180, 8108].includes(port)) {
			const urlMap: Record<number, string> = {
				3000: 'http://localhost:3000',
				8080: `${BASE}/api/v1/actuator/health`,
				8000: 'http://localhost:8000/health',
				8180: 'http://localhost:8180/realms/nottisn',
				8108: 'http://localhost:8108/health',
			}
			const url = urlMap[port]
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

	const searchParams = useSearchParams()

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
	const [activeShortcut, setActiveShortcut] = useState<string | null>(null)
	const [lastCheck, setLastCheck] = useState<Date | null>(null)
	const [cheatPanelCollapsed, setCheatPanelCollapsed] = useState(false)
	const [orchestratorScenario, setOrchestratorScenario] = useState(
		'demo-cockpit-deep',
	)
	const [orchestratorHeadless, setOrchestratorHeadless] = useState(true)
	const [orchestratorStrict, setOrchestratorStrict] = useState(true)
	const [orchestratorSelectorPreflight, setOrchestratorSelectorPreflight] =
		useState(true)
	const [orchestratorStrictSceneFallback, setOrchestratorStrictSceneFallback] =
		useState(false)
	const [orchestratorCaptureScreenshots, setOrchestratorCaptureScreenshots] =
		useState(false)
	const [orchestratorContinueOnError, setOrchestratorContinueOnError] =
		useState(false)
	const [orchestratorCheckpointMode, setOrchestratorCheckpointMode] = useState(
		'off',
	)
	const [orchestratorHostFailover, setOrchestratorHostFailover] =
		useState(false)
	const [orchestratorScenarioTimeoutMs, setOrchestratorScenarioTimeoutMs] =
		useState(360000)
	const [selectedCheatBeatId, setSelectedCheatBeatId] = useState(
		DEMO_PITCH_BEATS[0]?.id ?? '',
	)
	const [readinessReport, setReadinessReport] =
		useState<DemoReadinessReport | null>(null)
	const [isLoadingReadiness, setIsLoadingReadiness] = useState(true)
	const [isRefreshingReadiness, setIsRefreshingReadiness] = useState(false)
	const [cheatStateHydrated, setCheatStateHydrated] = useState(false)
	const [orchestratorTask, setOrchestratorTask] =
		useState<OrchestratorTaskSnapshot | null>(null)
	const [orchestratorProgress, setOrchestratorProgress] =
		useState<OrchestratorProgressSnapshot | null>(null)
	const [isLaunchingOrchestrator, setIsLaunchingOrchestrator] = useState(false)
	const [cheatHardBlockMode, setCheatHardBlockMode] = useState(true)
	const [orchestratorTaskList, setOrchestratorTaskList] = useState<
		OrchestratorTaskSnapshot[]
	>([])
	const [orchestratorPreflight, setOrchestratorPreflight] =
		useState<OrchestratorPreflightSnapshot | null>(null)
	const [isRefreshingTaskList, setIsRefreshingTaskList] = useState(false)
	const [isStoppingAllTasks, setIsStoppingAllTasks] = useState(false)
	const [isCleaningTaskHistory, setIsCleaningTaskHistory] = useState(false)
	const autorunShortcutRef = useRef<string | null>(null)
	const accessToken = useAuthStore(state => state.accessToken)
	const authHydrated = useAuthStore(state => state.isHydrated)
	const currentUsername = useAuthStore(state => state.user?.username)

	useEffect(() => {
		if (!authHydrated) {
			return
		}

		if (accessToken && accessToken !== token) {
			setToken(accessToken)
			return
		}

		if (accessToken || typeof window === 'undefined') {
			return
		}

		try {
			const persistedRaw = window.localStorage.getItem('auth-storage')
			if (!persistedRaw) {
				return
			}

			const persisted = JSON.parse(persistedRaw) as {
				state?: { accessToken?: string | null }
			}
			const persistedToken = persisted.state?.accessToken
			if (persistedToken) {
				setToken(persistedToken)
			}
		} catch {
			// Ignore malformed dev auth storage and allow manual login flow.
		}
	}, [accessToken, authHydrated, token])

	useEffect(() => {
		if (typeof window === 'undefined' || cheatStateHydrated) {
			return
		}

		try {
			const raw = window.localStorage.getItem(CHEAT_ENGINE_STORAGE_KEY)
			if (!raw) {
				setCheatStateHydrated(true)
				return
			}

			const parsed = JSON.parse(raw) as Partial<{
				cheatPanelCollapsed: boolean
				cheatHardBlockMode: boolean
				orchestratorScenario: string
				orchestratorHeadless: boolean
				orchestratorStrict: boolean
				orchestratorSelectorPreflight: boolean
				orchestratorStrictSceneFallback: boolean
				orchestratorCaptureScreenshots: boolean
				orchestratorContinueOnError: boolean
				orchestratorCheckpointMode: string
				orchestratorHostFailover: boolean
				orchestratorScenarioTimeoutMs: number
				selectedCheatBeatId: string
			}>

			if (typeof parsed.cheatPanelCollapsed === 'boolean') {
				setCheatPanelCollapsed(parsed.cheatPanelCollapsed)
			}
			if (typeof parsed.cheatHardBlockMode === 'boolean') {
				setCheatHardBlockMode(parsed.cheatHardBlockMode)
			}
			if (typeof parsed.orchestratorScenario === 'string') {
				setOrchestratorScenario(parsed.orchestratorScenario)
			}
			if (typeof parsed.orchestratorHeadless === 'boolean') {
				setOrchestratorHeadless(parsed.orchestratorHeadless)
			}
			if (typeof parsed.orchestratorStrict === 'boolean') {
				setOrchestratorStrict(parsed.orchestratorStrict)
			}
			if (typeof parsed.orchestratorSelectorPreflight === 'boolean') {
				setOrchestratorSelectorPreflight(parsed.orchestratorSelectorPreflight)
			}
			if (typeof parsed.orchestratorStrictSceneFallback === 'boolean') {
				setOrchestratorStrictSceneFallback(parsed.orchestratorStrictSceneFallback)
			}
			if (typeof parsed.orchestratorCaptureScreenshots === 'boolean') {
				setOrchestratorCaptureScreenshots(parsed.orchestratorCaptureScreenshots)
			}
			if (typeof parsed.orchestratorContinueOnError === 'boolean') {
				setOrchestratorContinueOnError(parsed.orchestratorContinueOnError)
			}
			if (typeof parsed.orchestratorCheckpointMode === 'string') {
				setOrchestratorCheckpointMode(parsed.orchestratorCheckpointMode)
			}
			if (typeof parsed.orchestratorHostFailover === 'boolean') {
				setOrchestratorHostFailover(parsed.orchestratorHostFailover)
			}
			if (typeof parsed.orchestratorScenarioTimeoutMs === 'number') {
				setOrchestratorScenarioTimeoutMs(
					Math.max(120000, parsed.orchestratorScenarioTimeoutMs),
				)
			}
			if (typeof parsed.selectedCheatBeatId === 'string') {
				setSelectedCheatBeatId(parsed.selectedCheatBeatId)
			}
		} catch {
			// Ignore malformed stored state and continue with defaults.
		} finally {
			setCheatStateHydrated(true)
		}
	}, [cheatStateHydrated])

	useEffect(() => {
		if (typeof window === 'undefined' || !cheatStateHydrated) {
			return
		}

		const state = {
			cheatPanelCollapsed,
			cheatHardBlockMode,
			orchestratorScenario,
			orchestratorHeadless,
			orchestratorStrict,
			orchestratorSelectorPreflight,
			orchestratorStrictSceneFallback,
			orchestratorCaptureScreenshots,
			orchestratorContinueOnError,
			orchestratorCheckpointMode,
			orchestratorHostFailover,
			orchestratorScenarioTimeoutMs,
			selectedCheatBeatId,
		}

		window.localStorage.setItem(CHEAT_ENGINE_STORAGE_KEY, JSON.stringify(state))
	}, [
		cheatPanelCollapsed,
		cheatHardBlockMode,
		orchestratorScenario,
		orchestratorHeadless,
		orchestratorStrict,
		orchestratorSelectorPreflight,
		orchestratorStrictSceneFallback,
		orchestratorCaptureScreenshots,
		orchestratorContinueOnError,
		orchestratorCheckpointMode,
		orchestratorHostFailover,
		orchestratorScenarioTimeoutMs,
		selectedCheatBeatId,
		cheatStateHydrated,
	])

	// Copy to clipboard
	const copy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text)
		setCopied(label)
		setTimeout(() => setCopied(null), 2000)
	}, [])

	const loadReadiness = useCallback(async (forceRefresh = false) => {
		if (forceRefresh) {
			setIsRefreshingReadiness(true)
			resetDemoReadinessCache()
		} else {
			setIsLoadingReadiness(true)
		}

		try {
			const report = await loadDemoReadinessReport()
			setReadinessReport(report)
		} finally {
			setIsLoadingReadiness(false)
			setIsRefreshingReadiness(false)
		}
	}, [])

	useEffect(() => {
		void loadReadiness(false)
	}, [loadReadiness])

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
	const loginToApp = useCallback(
		async (username: string, password: string, redirectTo = '/dashboard') => {
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
					console.error(
						'Login failed:',
						loginData.message || 'Check credentials',
					)
					return
				}
				const accessToken = loginData.data.accessToken
				setToken(accessToken)
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
				window.location.href = redirectTo
			} catch (err) {
				console.error(
					'Dev login error:',
					err instanceof Error ? err.message : 'Unknown',
				)
			} finally {
				setIsLoggingInToApp(false)
			}
		},
		[],
	)

	const openPitchShortcut = useCallback(
		async (shortcut: DemoPitchShortcut) => {
			setActiveShortcut(shortcut.label)
			try {
				const resolved = await resolveDemoShortcut(shortcut, token)
				if (resolved.copiedText) {
					await navigator.clipboard.writeText(resolved.copiedText)
				}
				if (resolved.watchUrl) {
					toast.success('Watch URL copied for second screen')
				} else if (resolved.notice) {
					toast.success(resolved.notice)
				}
				window.location.href = resolved.path
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Demo shortcut failed')
				console.error(
					'Demo shortcut failed:',
					err instanceof Error ? err.message : 'Unknown error',
				)
			} finally {
				setActiveShortcut(null)
			}
		},
		[token],
	)

	const openPitchShortcutInNewTab = useCallback(
		async (shortcut: DemoPitchShortcut) => {
			setActiveShortcut(`${shortcut.label}-tab`)
			try {
				const resolved = await resolveDemoShortcut(shortcut, token)
				if (resolved.copiedText) {
					await navigator.clipboard.writeText(resolved.copiedText)
				}
				if (resolved.watchUrl) {
					toast.success('Watch URL copied for second screen')
				} else if (resolved.notice) {
					toast.success(resolved.notice)
				}
				window.open(resolved.path, '_blank', 'noopener,noreferrer')
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : 'Demo shortcut failed',
				)
				console.error(
					'Demo shortcut failed:',
					err instanceof Error ? err.message : 'Unknown error',
				)
			} finally {
				setActiveShortcut(null)
			}
		},
		[token],
	)

	const openPitchBeatAction = useCallback(
		async (shortcut: DemoPitchShortcut, personaUsername: string) => {
			if (personaUsername && currentUsername !== personaUsername) {
				const vault = getDemoVault()
				if (vault.isWarmed) {
					const swapped = swapPersonaFromVault(personaUsername, true)
					if (swapped) {
						toast.success(`⚡ Instant vault swap: ${personaUsername}`)
						await openPitchShortcut(shortcut)
						return
					}
				}

				const persona = getDemoAccount(personaUsername)
				if (!persona) {
					toast.error(`Missing demo account for ${personaUsername}`)
					return
				}

				await loginToApp(
					persona.username,
					persona.password,
					`/demo-cockpit?autorun=${shortcut.id}`,
				)
				return
			}

			await openPitchShortcut(shortcut)
		},
		[currentUsername, loginToApp, openPitchShortcut],
	)

	useEffect(() => {
		const autorunShortcutId = searchParams.get('autorun')

		if (!autorunShortcutId) {
			autorunShortcutRef.current = null
			return
		}

		if (autorunShortcutRef.current === autorunShortcutId) {
			return
		}

		const shortcut = getDemoPitchShortcut(autorunShortcutId)
		if (!shortcut) {
			autorunShortcutRef.current = autorunShortcutId
			return
		}

		if (shortcut.requiresAuth && !token) {
			return
		}

		autorunShortcutRef.current = autorunShortcutId
		void openPitchShortcut(shortcut)
	}, [openPitchShortcut, searchParams, token])

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

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.ctrlKey &&
				event.shiftKey &&
				event.key.toLowerCase() === 'm'
			) {
				event.preventDefault()
				setCheatPanelCollapsed(previous => !previous)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const selectedCheatBeat =
		DEMO_PITCH_BEATS.find(beat => beat.id === selectedCheatBeatId) ?? null
	const selectedCheatActionShortcut = selectedCheatBeat
		? getDemoPitchShortcut(selectedCheatBeat.actions[0])
		: null
	const selectedCheatBeatReadinessStatus = selectedCheatBeat
		? getBeatReadinessStatus(selectedCheatBeat, readinessReport)
		: null
	const beatRequiresAuth = selectedCheatActionShortcut?.requiresAuth === true
	const beatBlockedByAuth = beatRequiresAuth && !token
	const beatBlockedByReadiness = selectedCheatBeatReadinessStatus === 'blocked'
	const hardBlockActive =
		cheatHardBlockMode && (beatBlockedByAuth || beatBlockedByReadiness)

	const launchBeatFromCheat = useCallback(
		async (beatId: string) => {
			if (hardBlockActive) {
				toast.error('Hard block active: resolve beat prerequisites first')
				return
			}

			const beat = DEMO_PITCH_BEATS.find(item => item.id === beatId)
			if (!beat || beat.actions.length === 0) {
				toast.error('No actions mapped for selected beat')
				return
			}

			const shortcut = getDemoPitchShortcut(beat.actions[0])
			if (!shortcut) {
				toast.error('Missing shortcut mapping for selected beat')
				return
			}

			await openPitchBeatAction(shortcut, beat.personaUsername)
		},
		[hardBlockActive, openPitchBeatAction],
	)

	const copyBeatAutorunFromCheat = useCallback(
		(beatId: string) => {
			const beat = DEMO_PITCH_BEATS.find(item => item.id === beatId)
			if (!beat || beat.actions.length === 0) {
				toast.error('No autorun action available for selected beat')
				return
			}

			copy(`/demo-cockpit?autorun=${beat.actions[0]}`, `autorun-${beatId}`)
		},
		[copy],
	)

	const launchBeatInNewTabFromCheat = useCallback(
		async (beatId: string) => {
			if (hardBlockActive) {
				toast.error('Hard block active: resolve beat prerequisites first')
				return
			}

			const beat = DEMO_PITCH_BEATS.find(item => item.id === beatId)
			if (!beat || beat.actions.length === 0) {
				toast.error('No actions mapped for selected beat')
				return
			}

			const shortcut = getDemoPitchShortcut(beat.actions[0])
			if (!shortcut) {
				toast.error('Missing shortcut mapping for selected beat')
				return
			}

			await openPitchShortcutInNewTab(shortcut)
		},
		[hardBlockActive, openPitchShortcutInNewTab],
	)

	const applyOrchestratorProfile = useCallback(
		(profileId: (typeof ORCHESTRATOR_PROFILES)[number]['id']) => {
			const profile = ORCHESTRATOR_PROFILES.find(item => item.id === profileId)
			if (!profile) {
				return
			}

			setOrchestratorScenario(profile.scenario)
			setOrchestratorHeadless(profile.headless)
			setOrchestratorStrict(profile.strict)
			setOrchestratorSelectorPreflight(profile.selectorPreflight)
			setOrchestratorStrictSceneFallback(profile.strictSceneFallback)
			setOrchestratorCaptureScreenshots(profile.captureScreenshots)
			setOrchestratorContinueOnError(profile.continueOnError)
			setOrchestratorCheckpointMode(profile.checkpointMode)
			setOrchestratorHostFailover(profile.hostFailover)
			setOrchestratorScenarioTimeoutMs(profile.scenarioTimeoutMs)
		},
		[],
	)

	const applyStrictBaseline = useCallback(() => {
		setOrchestratorScenario(STRICT_BASELINE.scenario)
		setOrchestratorHeadless(STRICT_BASELINE.headless)
		setOrchestratorStrict(STRICT_BASELINE.strict)
		setOrchestratorSelectorPreflight(STRICT_BASELINE.selectorPreflight)
		setOrchestratorStrictSceneFallback(STRICT_BASELINE.strictSceneFallback)
		setOrchestratorCaptureScreenshots(STRICT_BASELINE.captureScreenshots)
		setOrchestratorContinueOnError(STRICT_BASELINE.continueOnError)
		setOrchestratorCheckpointMode(STRICT_BASELINE.checkpointMode)
		setOrchestratorHostFailover(STRICT_BASELINE.hostFailover)
		setOrchestratorScenarioTimeoutMs(STRICT_BASELINE.scenarioTimeoutMs)
	}, [])

	const resetCheatEngineState = useCallback(() => {
		setCheatPanelCollapsed(false)
		setCheatHardBlockMode(true)
		setSelectedCheatBeatId(DEMO_PITCH_BEATS[0]?.id ?? '')
		applyStrictBaseline()
		setOrchestratorTask(null)
		setOrchestratorProgress(null)
		if (typeof window !== 'undefined') {
			window.localStorage.removeItem(CHEAT_ENGINE_STORAGE_KEY)
		}
	}, [applyStrictBaseline])

	const refreshOrchestratorTask = useCallback(async (taskId: string) => {
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
	}, [])

	const refreshOrchestratorTaskList = useCallback(async () => {
		setIsRefreshingTaskList(true)
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
				throw new Error(payload.message || 'Failed to fetch orchestrator task list')
			}

			setOrchestratorTaskList(payload.data.tasks)
		} catch {
			// Keep last known list if polling fails.
		} finally {
			setIsRefreshingTaskList(false)
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
				toast.error(payload.message || 'Orchestrator preflight failed')
			}
		} catch {
			setOrchestratorPreflight(null)
		}
	}, [])

	const stopOrchestratorTask = useCallback(
		async (taskId: string) => {
			try {
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
				void refreshOrchestratorTaskList()
				toast.success('Orchestrator task stopped')
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Failed to stop orchestrator task'
				toast.error(message)
			}
		},
		[orchestratorTask, refreshOrchestratorTaskList],
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
			toast.success(`Stop-all completed (${stoppedCount} task(s) stopped)`)
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Failed to stop all orchestrator tasks'
			toast.error(message)
		} finally {
			setIsStoppingAllTasks(false)
		}
	}, [orchestratorTask, refreshOrchestratorTask, refreshOrchestratorTaskList])

	const cleanupOrchestratorTasks = useCallback(async (keepLatest = 8) => {
		setIsCleaningTaskHistory(true)
		try {
			const response = await fetch('/api/dev/orchestrator/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ keepLatest }),
			})

			const payload = (await response.json()) as {
				success?: boolean
				message?: string
				data?: { removedTaskIds?: string[] }
			}

			if (!response.ok || !payload.success) {
				throw new Error(payload.message || 'Failed to cleanup orchestrator history')
			}

			const removedCount = payload.data?.removedTaskIds?.length ?? 0
			await refreshOrchestratorTaskList()
			toast.success(`Cleanup completed (${removedCount} task(s) removed)`)
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Failed to cleanup orchestrator history'
			toast.error(message)
		} finally {
			setIsCleaningTaskHistory(false)
		}
	}, [refreshOrchestratorTaskList])

	const launchOrchestratorRun = useCallback(
		async (mode: 'single-strict' | 'certify-strict') => {
			const preflightBlocked =
				cheatHardBlockMode &&
				orchestratorPreflight !== null &&
				(!orchestratorPreflight.backendHealthOk ||
					!orchestratorPreflight.authProbeOk ||
					!orchestratorPreflight.launchCapacityAvailable)

			if (cheatHardBlockMode) {
				const launchRiskFlags = [
					!orchestratorStrict ? 'Strict mode disabled' : null,
					orchestratorContinueOnError ? 'Continue-on-error enabled' : null,
					!orchestratorSelectorPreflight ? 'Selector preflight disabled' : null,
					orchestratorStrictSceneFallback ? 'Strict scene fallback enabled' : null,
					orchestratorPreflight && !orchestratorPreflight.launchCapacityAvailable
						? `Capacity full (${orchestratorPreflight.runningTaskCount}/${orchestratorPreflight.maxConcurrentRunningTasks})`
						: null,
				].filter((item): item is string => item !== null)

				if (launchRiskFlags.length > 0) {
					toast.error(`Hard block active: ${launchRiskFlags.join(' • ')}`)
					return
				}
			}

			if (preflightBlocked) {
				toast.error(
					`Hard block active: ${orchestratorPreflight?.errorMessage || 'server preflight failed'}`,
				)
				return
			}

			setIsLaunchingOrchestrator(true)
			try {
				const response = await fetch('/api/dev/orchestrator/launch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						mode,
						hostFailover: orchestratorHostFailover,
					}),
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
				void refreshOrchestratorTaskList()
				toast.success(
					mode === 'certify-strict'
						? 'Strict certify run started'
						: 'Strict run started',
				)
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Failed to launch orchestrator'
				toast.error(message)
			} finally {
				setIsLaunchingOrchestrator(false)
			}
		},
		[
			cheatHardBlockMode,
			orchestratorContinueOnError,
			orchestratorHostFailover,
			orchestratorPreflight,
			orchestratorSelectorPreflight,
			orchestratorStrict,
			orchestratorStrictSceneFallback,
			refreshOrchestratorTaskList,
		],
	)

	useEffect(() => {
		if (!orchestratorTask || orchestratorTask.status !== 'running') {
			return
		}

		let cancelled = false
		const interval = window.setInterval(() => {
			void refreshOrchestratorTask(orchestratorTask.taskId)
				.then(nextTask => {
					if (cancelled || nextTask.status === 'running') {
						return
					}

					if (nextTask.status === 'passed') {
						toast.success('Orchestrator run passed')
					} else {
						toast.error('Orchestrator run failed')
					}
				})
				.catch(() => {
					// Keep polling until the next successful status call.
				})
		}, 2000)

		return () => {
			cancelled = true
			window.clearInterval(interval)
		}
	}, [orchestratorTask, refreshOrchestratorTask])

	useEffect(() => {
		void refreshOrchestratorTaskList()
		void refreshOrchestratorPreflight()
	}, [refreshOrchestratorPreflight, refreshOrchestratorTaskList])

	useEffect(() => {
		const interval = window.setInterval(() => {
			void refreshOrchestratorTaskList()
			void refreshOrchestratorPreflight()
		}, 4000)

		return () => {
			window.clearInterval(interval)
		}
	}, [refreshOrchestratorPreflight, refreshOrchestratorTaskList])

	const orchestratorArgs = [
		`--scenario ${orchestratorScenario}`,
		`--headless ${String(orchestratorHeadless)}`,
		`--strict ${String(orchestratorStrict)}`,
		`--selector-preflight ${String(orchestratorSelectorPreflight)}`,
		`--strict-scene-fallback ${String(orchestratorStrictSceneFallback)}`,
		`--capture-screenshots ${String(orchestratorCaptureScreenshots)}`,
		`--continue-on-error ${String(orchestratorContinueOnError)}`,
		`--checkpoint-mode ${orchestratorCheckpointMode}`,
		`--scenario-timeout-ms ${String(orchestratorScenarioTimeoutMs)}`,
	].join(' ')

	const orchestratorCommand = `${orchestratorHostFailover ? 'set ORCH_ENABLE_HOST_FAILOVER=1 && ' : ''}node scripts/live-demo-orchestrator.mjs ${orchestratorArgs}`
	const strictCertifyCommand = `${orchestratorHostFailover ? 'set ORCH_ENABLE_HOST_FAILOVER=1 && ' : ''}node scripts/live-demo-orchestrator.mjs --scenario demo-cockpit-deep --headless true --strict true --selector-preflight true --strict-scene-fallback false --capture-screenshots false --continue-on-error false --checkpoint-mode off --scenario-timeout-ms 660000 --integrity-threshold 95 --preflight-backend-health-url ${BASE}/api/v1/actuator/health --preflight-auth-probe-url ${BASE}/api/v1/auth/check-username?username=testuser --certify-runs 3 --certify-min-passes 3 --certify-max-strict-failures 0 --certify-max-render-anomalies 0 --certify-max-console-errors 50 --certify-max-page-errors 0 --certify-max-http5xx-responses 2 --certify-max-request-failures 50 --certify-max-beat-fallbacks 2 --certify-max-beat-scene-fallbacks 2 --certify-max-beat-route-fallbacks 0 --certify-min-beat-evidence-rate 100 --certify-min-demo-confidence-score 85`
	const strictSingleRunCommand = `${orchestratorHostFailover ? 'set ORCH_ENABLE_HOST_FAILOVER=1 && ' : ''}node scripts/live-demo-orchestrator.mjs --scenario demo-cockpit-deep --headless true --strict true --selector-preflight true --strict-scene-fallback false --capture-screenshots false --continue-on-error false --checkpoint-mode off --scenario-timeout-ms 660000 --integrity-threshold 95 --preflight-backend-health-url ${BASE}/api/v1/actuator/health --preflight-auth-probe-url ${BASE}/api/v1/auth/check-username?username=testuser`

	const orchestrationRiskFlags = [
		!orchestratorStrict ? 'Strict mode disabled' : null,
		orchestratorContinueOnError ? 'Continue-on-error enabled' : null,
		!orchestratorSelectorPreflight ? 'Selector preflight disabled' : null,
		orchestratorStrictSceneFallback ? 'Strict scene fallback enabled' : null,
	].filter((item): item is string => item !== null)
	const runningOrchestratorTaskCount = orchestratorTaskList.filter(
		task => task.status === 'running',
	).length

	const upCount = services.filter(s => s.status === 'up').length
	const passCount = apiResults.filter(r => r.status === 'pass').length
	const failCount = apiResults.filter(r => r.status === 'fail').length
	const topShortcuts = DEMO_PITCH_SHORTCUTS.slice(0, 6)
	const cheatTeleportRoutes = DEMO_ROUTES.slice(0, 8)
	const orchestratorRunStateTone =
		orchestratorTask?.status === 'passed'
			? 'text-success border-success/30 bg-success/10'
			: orchestratorTask?.status === 'failed'
				? 'text-error border-error/30 bg-error/10'
				: orchestratorTask?.status === 'stopped'
					? 'text-warning border-warning/30 bg-warning/10'
				: 'text-warning border-warning/30 bg-warning/10'

	return (
		<div className='min-h-screen bg-bg text-text-primary font-sans relative overflow-hidden py-8 px-4 sm:px-6 lg:px-8'>
			{/* Drifting HSL Ambient Radial Glow Orbs */}
			<div className='pointer-events-none absolute -left-40 -top-40 size-[500px] rounded-full bg-brand/5 blur-[120px] dark:bg-brand/8' />
			<div className='pointer-events-none absolute -right-40 -bottom-40 size-[500px] rounded-full bg-xp/5 blur-[120px] dark:bg-xp/8' />
			<div className='pointer-events-none absolute left-1/3 top-1/2 size-[300px] rounded-full bg-streak/5 blur-[100px] dark:bg-streak/8' />

			{/* Breathtaking Glassmorphic Header */}
			<header className='relative z-10 max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-border-subtle/60 bg-bg-card/75 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-card'>
				<div className='flex items-center gap-3'>
					<div className='grid size-12 place-items-center rounded-xl bg-brand/10 text-brand shadow-glow'>
						<Terminal className='size-6' />
					</div>
					<div>
						<h1 className='text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-brand via-streak to-xp bg-clip-text text-transparent'>
							ChefKix Dev Cockpit
						</h1>
						<p className='text-xs text-text-muted mt-0.5 font-medium'>
							Unified development command room & live pitch beat conductor
						</p>
					</div>
				</div>
				<div className='flex flex-wrap items-center gap-3'>
					<span
						className={cn(
							'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
							upCount === SERVICES.length
								? 'bg-success/8 border-success/20 text-success'
								: upCount > 0
									? 'bg-warning/8 border-warning/20 text-warning'
									: 'bg-error/8 border-error/20 text-error',
						)}
					>
						<span className='size-2 rounded-full bg-current animate-pulse' />
						{upCount}/{SERVICES.length} Services Online
					</span>
					{lastCheck && (
						<span className='text-xs text-text-muted hidden md:inline'>
							Checked: {lastCheck.toLocaleTimeString()}
						</span>
					)}
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={checkServices}
						className='inline-flex items-center gap-1.5 rounded-xl border border-border-subtle/80 bg-bg-card hover:bg-bg-elevated text-text-primary px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer'
					>
						<RefreshCw className='size-3.5' />
						Refresh
					</motion.button>
				</div>
			</header>

			{/* Main Grid Workspace */}
			<main className='relative z-10 max-w-7xl mx-auto space-y-6'>
				{/* Top Row: Service Health + Persona Sign-In */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Infrastructure Status */}
					<PremiumSurface
						tone='brand'
						showOrbs={true}
						eyebrow='Infrastructure Status'
					>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
							{services.map(svc => {
								const isUp = svc.status === 'up'
								const isDown = svc.status === 'down'
								return (
									<MagicCard
										key={svc.name}
										mode='gradient'
										className={cn(
											'relative overflow-hidden rounded-xl border p-3 flex items-center justify-between transition-colors',
											isUp
												? 'border-success/15 bg-success/4'
												: isDown
													? 'border-error/15 bg-error/4'
													: 'border-border-subtle bg-bg-card/40',
										)}
									>
										<div className='flex items-center gap-2.5 min-w-0'>
											<div
												className={cn(
													'size-2.5 rounded-full shrink-0',
													isUp
														? 'bg-success animate-pulse'
														: isDown
															? 'bg-error animate-pulse'
															: 'bg-warning animate-pulse',
												)}
											/>
											<div className='min-w-0'>
												<span className='text-xs font-bold text-text-primary block truncate'>
													{svc.name}
												</span>
												<span className='text-2xs text-text-muted block mt-0.5 font-mono'>
													Port :{svc.port}
												</span>
											</div>
										</div>
										{svc.latency !== undefined && svc.latency > 0 && (
											<span
												className={cn(
													'text-2xs font-bold px-1.5 py-0.5 rounded bg-bg-elevated font-mono',
													svc.latency < 100
														? 'text-success'
														: svc.latency < 500
															? 'text-warning'
															: 'text-error',
												)}
											>
												{svc.latency}ms
											</span>
										)}
									</MagicCard>
								)
							})}
						</div>
					</PremiumSurface>

					{/* Test Accounts Cockpit */}
					<PremiumSurface
						tone='xp'
						showOrbs={true}
						eyebrow='Test Personas & Quick Sign-In'
					>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
							{DEMO_ACCOUNTS.map(account => (
								<MagicCard
									key={account.username}
									mode='gradient'
									className='relative overflow-hidden rounded-xl border border-border-subtle/80 bg-bg-card/40 p-3.5 flex flex-col justify-between'
								>
									<div className='mb-3'>
										<div className='flex items-center gap-2 mb-1.5'>
											<span className='text-base'>👤</span>
											<span className='text-xs font-black text-text-primary'>
												{account.label}
											</span>
										</div>
										<p className='text-2xs text-text-muted leading-relaxed line-clamp-2'>
											{account.description}
										</p>
									</div>

									<div className='space-y-2'>
										<div className='grid grid-cols-2 gap-1 text-2xs font-mono bg-bg-elevated/50 rounded-lg p-1.5 border border-border-subtle/50'>
											<div className='flex items-center gap-1 min-w-0'>
												<span className='text-text-muted shrink-0'>U:</span>
												<span className='text-text-secondary truncate font-semibold'>
													{account.username}
												</span>
											</div>
											<div className='flex items-center gap-1 min-w-0'>
												<span className='text-text-muted shrink-0'>P:</span>
												<span className='text-text-secondary truncate font-semibold'>
													{account.password}
												</span>
											</div>
										</div>
										<div className='flex gap-2'>
											<motion.button
												whileHover={{ scale: 1.03 }}
												whileTap={{ scale: 0.97 }}
												onClick={() =>
													loginToApp(
														account.username,
														account.password,
														account.defaultRoute,
													)
												}
												disabled={isLoggingInToApp}
												className='flex-1 inline-flex items-center justify-center rounded-lg bg-brand text-white py-1 text-2xs font-bold shadow-warm hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer'
											>
												Sign In →
											</motion.button>
											<motion.button
												whileHover={{ scale: 1.03 }}
												whileTap={{ scale: 0.97 }}
												onClick={() =>
													doLogin(account.username, account.password).then(
														t => {
															if (t) copy(t, account.username)
														},
													)
												}
												className='inline-flex items-center justify-center rounded-lg bg-success/10 border border-success/20 text-success hover:bg-success/20 px-2 py-1 text-2xs font-bold transition-colors cursor-pointer'
												title='Copy Bearer Token'
											>
												{copied === account.username ? '✓' : '🔑'}
											</motion.button>
										</div>
									</div>
								</MagicCard>
							))}
						</div>

						{/* Keycloak Admin Console Box */}
						<div className='mt-4 border border-warning/15 bg-warning/5 rounded-xl p-3.5'>
							<div className='flex items-center justify-between mb-2'>
								<span className='text-xs font-black text-warning flex items-center gap-1.5'>
									<Shield className='size-3.5' />
									Keycloak Admin Console
								</span>
								<a
									href='http://localhost:8180/admin'
									target='_blank'
									rel='noopener noreferrer'
									className='text-2xs text-text-muted hover:text-warning flex items-center gap-0.5'
								>
									Open Console <ExternalLink className='size-2.5' />
								</a>
							</div>
							<div className='grid grid-cols-3 gap-2 font-mono text-2xs'>
								{[
									{ label: 'URL', value: 'http://localhost:8180/admin' },
									{ label: 'User', value: 'admin' },
									{ label: 'Pass', value: 'admin' },
								].map(field => (
									<div
										key={field.label}
										className='bg-bg-elevated/40 border border-border-subtle/50 rounded-lg p-1.5 flex items-center justify-between gap-1'
									>
										<span className='text-text-muted'>CN:</span>
										<span className='text-text-secondary truncate font-semibold flex-1 text-right mr-1'>
											{field.value}
										</span>
										<button
											onClick={() => copy(field.value, `kc-${field.label}`)}
											className='text-2xs text-text-muted hover:text-text-primary shrink-0'
										>
											{copied === `kc-${field.label}` ? '✓' : '⎘'}
										</button>
									</div>
								))}
							</div>
						</div>
					</PremiumSurface>
				</div>

				{/* Active Token Banner */}
				{token && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className='border border-success/20 bg-success/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden backdrop-blur-sm'
					>
						<div className='flex items-center gap-2.5 min-w-0'>
							<div className='size-7 rounded-lg bg-success/10 text-success grid place-items-center shrink-0'>
								<Key className='size-4' />
							</div>
							<div className='min-w-0'>
								<span className='text-xs font-bold text-success block'>
									Active Session Token
								</span>
								<code className='text-2xs text-text-muted truncate block font-mono mt-0.5 max-w-xl'>
									{token}
								</code>
							</div>
						</div>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => copy(token, 'token')}
							className='inline-flex items-center gap-1.5 rounded-xl bg-success text-white px-3.5 py-1.5 text-xs font-bold hover:bg-success/90 transition-colors shrink-0 cursor-pointer'
						>
							{copied === 'token' ? (
								<Check className='size-3.5' />
							) : (
								<Copy className='size-3.5' />
							)}
							{copied === 'token' ? 'Copied' : 'Copy Token'}
						</motion.button>
					</motion.div>
				)}

				{/* Timeline Beat Conductor */}
				<PremiumSurface
					tone='streak'
					showOrbs={true}
					eyebrow='Investor Pitch Beat Conductor'
					chipText='Timeline'
				>
					<div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 mb-6 pb-4 border-b border-border-subtle/50'>
						<p className='text-xs text-text-secondary leading-relaxed'>
							Six interactive live beats mapping our pitch flows. Launch
							credentials, trigger verification screens, and demonstrate visual
							metrics.
						</p>
						<div className='flex items-center gap-3 shrink-0'>
							<div className='bg-bg-elevated/80 border border-border-subtle rounded-xl p-2 flex items-center gap-2 font-mono text-xs'>
								<span className='text-text-muted'>User:</span>
								<span className='text-brand font-bold'>
									{currentUsername || 'Unauthenticated'}
								</span>
							</div>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => void loadReadiness(true)}
								disabled={isRefreshingReadiness}
								className='inline-flex items-center gap-1.5 rounded-xl bg-brand text-white px-3.5 py-2 text-xs font-bold shadow-warm hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer'
							>
								<RefreshCw
									className={cn(
										'size-3.5',
										isRefreshingReadiness && 'animate-spin',
									)}
								/>
								Reload readiness
							</motion.button>
						</div>
					</div>

					{/* Scene Readiness Checks Summary */}
					<div className='bg-bg-card/60 border border-border-subtle/80 rounded-2xl p-4 mb-6'>
						<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4'>
							<div className='space-y-0.5'>
								<span className='text-2xs font-black tracking-wider text-text-muted uppercase'>
									Scene Probes & System Readiness
								</span>
								<span className='text-xs text-text-secondary block'>
									{isLoadingReadiness
										? 'Loading system probes report...'
										: readinessReport
											? `Generated: ${formatReadinessTimestamp(readinessReport.generatedAt)}`
											: 'Execute demo-prep.bat to generate real-time metrics'}
								</span>
							</div>
							{readinessReport && (
								<div className='flex gap-2'>
									{[
										{
											label: 'Ready',
											value: readinessReport.summary.ready,
											color: 'text-success bg-success/8 border-success/20',
										},
										{
											label: 'Warnings',
											value: readinessReport.summary.warning,
											color: 'text-warning bg-warning/8 border-warning/20',
										},
										{
											label: 'Blocked',
											value: readinessReport.summary.blocked,
											color: 'text-error bg-error/8 border-error/20',
										},
									].map(item => (
										<span
											key={item.label}
											className={cn(
												'text-2xs font-black px-2.5 py-1 rounded-full border',
												item.color,
											)}
										>
											{item.label}: {item.value}
										</span>
									))}
								</div>
							)}
						</div>
						{!isLoadingReadiness && !readinessReport && (
							<div className='bg-warning/5 border border-warning/15 rounded-xl p-3 text-xs text-warning flex items-start gap-2 leading-relaxed'>
								<AlertCircle className='size-4 shrink-0 mt-0.5 animate-pulse' />
								No active readiness report found. Execute demo-prep.bat prior to
								the live investor slot to ensure structural failures are caught
								early.
							</div>
						)}
					</div>

					{/* Timeline Timeline Beads */}
					<div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
						{DEMO_PITCH_BEATS.map(beat => {
							const persona = getDemoAccount(beat.personaUsername)
							const readinessStatus = getBeatReadinessStatus(
								beat,
								readinessReport,
							)
							const readinessTone = getReadinessTone(readinessStatus)
							const readinessChecks = getBeatReadinessChecks(
								beat,
								readinessReport,
							)

							return (
								<div
									key={beat.id}
									className='relative overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card/45 p-5 flex flex-col justify-between gap-4 hover:border-border-medium transition-colors'
								>
									{/* Top Header */}
									<div className='space-y-2'>
										<div className='flex flex-wrap items-center gap-2 text-2xs font-black uppercase'>
											<span className='bg-brand/10 border border-brand/20 text-brand px-2.5 py-0.5 rounded-full tracking-wider'>
												{beat.phase}
											</span>
											<span className='text-text-muted tracking-wider flex items-center gap-1'>
												<Clock className='size-3' /> {beat.minutes}
											</span>
											{persona && (
												<span
													className={cn(
														'px-2.5 py-0.5 rounded-full border tracking-wider',
														currentUsername === persona.username
															? 'bg-success/8 border-success/20 text-success'
															: 'bg-warning/8 border-warning/20 text-warning',
													)}
												>
													{persona.label}
												</span>
											)}
											<span
												className={cn(
													'px-2.5 py-0.5 rounded-full border tracking-wider',
													readinessStatus === 'ready'
														? 'bg-success/8 border-success/20 text-success'
														: readinessStatus === 'warning'
															? 'bg-warning/8 border-warning/20 text-warning'
															: 'bg-error/8 border-error/20 text-error',
												)}
											>
												{readinessTone.label}
											</span>
										</div>

										<h3 className='text-lg font-black text-text-primary leading-tight'>
											{beat.title}
										</h3>
									</div>

									{/* Main Narrative Elements */}
									<div className='space-y-3'>
										<div className='bg-bg-elevated/40 border border-border-subtle/40 rounded-xl p-3'>
											<span className='text-2xs font-bold text-text-muted uppercase tracking-wider block mb-1'>
												Narrative Proof
											</span>
											<p className='text-xs text-text-secondary leading-relaxed'>
												{beat.proof}
											</p>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-2xs'>
											<div className='bg-bg-elevated/30 border border-border-subtle/30 rounded-xl p-3 flex flex-col justify-between'>
												<div>
													<span className='text-2xs font-bold text-text-muted uppercase tracking-wider block mb-1'>
														Presenter Narrative
													</span>
													<p className='text-xs text-text-secondary leading-relaxed font-sans'>
														{beat.presenterLine}
													</p>
												</div>
												<button
													onClick={() =>
														copy(beat.presenterLine, `pres-${beat.id}`)
													}
													className='text-2xs text-brand hover:text-brand-hover mt-2 flex items-center gap-1 font-semibold'
												>
													{copied === `pres-${beat.id}`
														? '✓ Copied'
														: 'Copy line →'}
												</button>
											</div>

											<div className='bg-brand/4 border border-brand/10 rounded-xl p-3 flex flex-col justify-between'>
												<div>
													<span className='text-2xs font-bold text-brand uppercase tracking-wider block mb-1'>
														Investor Focus
													</span>
													<p className='text-xs text-text-primary leading-relaxed font-sans font-medium'>
														{beat.investorTranslation}
													</p>
												</div>
												<button
													onClick={() =>
														copy(beat.investorTranslation, `inv-${beat.id}`)
													}
													className='text-2xs text-brand hover:text-brand-hover mt-2 flex items-center gap-1 font-semibold'
												>
													{copied === `inv-${beat.id}`
														? '✓ Copied'
														: 'Copy Focus →'}
												</button>
											</div>
										</div>
									</div>

									{/* Probe Details */}
									<div className='border-t border-border-subtle/50 pt-4 space-y-2'>
										<span className='text-2xs font-bold text-text-muted uppercase tracking-wider block'>
											Pitch Integrity Checkpoints
										</span>
										{readinessChecks.length > 0 ? (
											<div className='space-y-1.5'>
												{readinessChecks.map(check => {
													const isOk = check.status === 'ready'
													const isWarn = check.status === 'warning'
													return (
														<div
															key={check.id}
															className={cn(
																'border rounded-xl p-2.5 flex items-start gap-2.5 text-xs justify-between',
																isOk
																	? 'bg-success/4 border-success/15'
																	: isWarn
																		? 'bg-warning/4 border-warning/15'
																		: 'bg-error/4 border-error/15',
															)}
														>
															<div className='space-y-0.5'>
																<span className='font-bold text-text-primary block'>
																	{check.label}
																</span>
																<span className='text-text-muted text-2xs block leading-relaxed'>
																	{check.detail}
																</span>
																{check.target && (
																	<span className='text-2xs text-brand block mt-0.5 font-mono'>
																		{check.target}
																	</span>
																)}
															</div>
															<span
																className={cn(
																	'text-2xs font-bold px-2 py-0.5 rounded-full shrink-0 border uppercase tracking-wider',
																	isOk
																		? 'bg-success/10 border-success/20 text-success'
																		: isWarn
																			? 'bg-warning/10 border-warning/20 text-warning'
																			: 'bg-error/10 border-error/20 text-error',
																)}
															>
																{check.status}
															</span>
														</div>
													)
												})}
											</div>
										) : (
											<span className='text-xs text-text-muted leading-relaxed italic block'>
												No active probes mapped.
											</span>
										)}
									</div>

									{/* Timeline Action Trigger Bar */}
									<div className='border-t border-border-subtle/50 pt-4 flex flex-wrap items-center gap-2'>
										{beat.actions.map(actionId => {
											const shortcut = getDemoPitchShortcut(actionId)
											if (!shortcut) return null
											const isBusy =
												activeShortcut === shortcut.label || isLoggingInToApp
											return (
												<motion.button
													key={shortcut.id}
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													onClick={() =>
														openPitchBeatAction(shortcut, beat.personaUsername)
													}
													disabled={isBusy}
													className='inline-flex items-center gap-1.5 rounded-xl bg-brand text-white px-3.5 py-2 text-xs font-bold shadow-warm hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer'
												>
													<Play className='size-3 fill-current' />
													<span>{shortcut.label}</span>
												</motion.button>
											)
										})}
									</div>
								</div>
							)
						})}
					</div>
				</PremiumSurface>

				{/* Row 2: API Playgrounds & Endpoint Tests */}
				<PremiumSurface
					tone='success'
					showOrbs={true}
					eyebrow='API Endpoint Tests'
					chipText='Playground'
				>
					<div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 mb-6 pb-4 border-b border-border-subtle/50'>
						<div>
							<p className='text-xs text-text-secondary leading-relaxed'>
								Run clinical testing suites against our Spring Boot backend.
								Verify active models, cache nodes, and social hooks.
							</p>
						</div>
						<div className='flex items-center gap-3 shrink-0'>
							{passCount + failCount > 0 && (
								<span
									className={cn(
										'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm',
										failCount === 0
											? 'bg-success/8 border-success/20 text-success'
											: 'bg-error/8 border-error/20 text-error',
									)}
								>
									<span className='size-2 rounded-full bg-current animate-pulse' />
									{passCount}/{API_TESTS.length} Endpoints Healthy
								</span>
							)}
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={runApiTests}
								disabled={isRunningApiTests}
								className='inline-flex items-center gap-1.5 rounded-xl bg-success text-white px-4 py-2 text-xs font-bold hover:bg-success/90 transition-colors disabled:opacity-50 cursor-pointer'
							>
								{isRunningApiTests ? (
									<RefreshCw className='size-3.5 animate-spin' />
								) : (
									<Play className='size-3.5 fill-current' />
								)}
								Run All Tests
							</motion.button>
						</div>
					</div>

					{/* Test result cards */}
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
						{apiResults.map(result => {
							const isPass = result.status === 'pass'
							const isFail = result.status === 'fail'
							return (
								<MagicCard
									key={result.name}
									mode='gradient'
									className={cn(
										'relative overflow-hidden rounded-xl border p-3 flex items-center justify-between gap-3 text-xs',
										isPass
											? 'bg-success/4 border-success/15'
											: isFail
												? 'bg-error/4 border-error/15'
												: 'bg-bg-card/40 border-border-subtle',
									)}
								>
									<div className='flex items-center gap-2 min-w-0'>
										<span className='text-base shrink-0'>
											{isPass ? '🟢' : isFail ? '🔴' : '🟡'}
										</span>
										<div className='min-w-0'>
											<span className='font-bold text-text-primary block truncate'>
												{result.name}
											</span>
											<span className='text-2xs text-text-muted font-mono block truncate mt-0.5'>
												{result.path}
											</span>
										</div>
									</div>
									<div className='flex items-center gap-2 shrink-0 font-mono text-2xs'>
										{result.code && (
											<span className='bg-bg-elevated px-1.5 py-0.5 rounded text-text-secondary'>
												{result.code}
											</span>
										)}
										{result.latency && (
											<span
												className={cn(
													'font-semibold',
													result.latency < 200
														? 'text-success'
														: result.latency < 1000
															? 'text-warning'
															: 'text-error',
												)}
											>
												{result.latency}ms
											</span>
										)}
									</div>
								</MagicCard>
							)
						})}
					</div>

					{/* failures box */}
					{failCount > 0 && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							className='mt-6 border border-error/20 bg-error/5 rounded-2xl p-4'
						>
							<span className='text-xs font-bold text-error flex items-center gap-1.5 mb-3'>
								<AlertCircle className='size-4 animate-bounce' />
								Active Failure Fingerprints ({failCount})
							</span>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-xs'>
								{apiResults
									.filter(r => r.status === 'fail')
									.map(r => (
										<div
											key={r.name}
											className='bg-bg-card/50 border border-error/15 rounded-xl p-3 space-y-1.5'
										>
											<div className='flex items-center justify-between gap-2'>
												<span className='font-black text-error'>{r.name}</span>
												<span className='text-2xs text-text-muted font-mono bg-bg-elevated px-1.5 py-0.5 rounded'>
													{r.code || 'TIMEOUT'}
												</span>
											</div>
											<p className='text-2xs text-text-secondary italic'>
												{r.detail || 'Connection timed out'}
											</p>
											<code className='text-2xs text-text-muted block font-mono break-all'>
												{r.path}
											</code>
										</div>
									))}
							</div>
						</motion.div>
					)}
				</PremiumSurface>

				{/* Row 3: OTP Dev Mode Banner */}
				<PremiumSurface
					tone='blue'
					showOrbs={true}
					eyebrow='Bypassed Dev Email & OTP Channel'
				>
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4'>
						<div className='space-y-4'>
							<p className='text-xs text-text-secondary leading-relaxed'>
								Brevo email delivery is bypassed in standard local
								configurations. When triggered, the verification OTP code is{' '}
								<strong className='text-brand'>
									printed directly to the monolith standard log stream
								</strong>
								.
							</p>
							<div className='bg-bg-card/60 border border-border-subtle rounded-xl p-3.5 space-y-1.5'>
								<span className='text-2xs font-black text-text-muted uppercase tracking-wider block'>
									Monolith Window Output Sample
								</span>
								<code className='text-xs text-success block font-mono bg-bg-elevated p-2 rounded border border-border-subtle/50'>
									[DEV EMAIL BYPASS] *** OTP CODE: 123456 ***
								</code>
							</div>
							<p className='text-2xs text-text-muted leading-relaxed'>
								To configure full SMTP delivery, set up a Brevo key under{' '}
								<code className='bg-bg-elevated px-1 py-0.5 rounded font-mono'>
									BREVO_API_KEY
								</code>{' '}
								inside{' '}
								<code className='bg-bg-elevated px-1 py-0.5 rounded font-mono'>
									chefkix-monolith/.env
								</code>
								.
							</p>
						</div>

						{/* Registration Guide */}
						<div className='bg-bg-card/40 border border-border-subtle rounded-2xl p-4 space-y-3'>
							<span className='text-xs font-black text-text-primary uppercase tracking-wider block'>
								Registration Flow (Dev Bypass)
							</span>
							<div className='space-y-2'>
								{[
									{
										step: '1',
										title: 'Register Account',
										desc: 'Submit email registration form at /register',
									},
									{
										step: '2',
										title: 'Fetch OTP Log Line',
										desc: 'Extract the numeric verification code from the monolith output stream',
									},
									{
										step: '3',
										title: 'Verify Registration',
										desc: 'Enter the code at /verify-otp to finalize the Keycloak token',
									},
								].map(item => (
									<div
										key={item.step}
										className='flex items-start gap-3 p-2.5 rounded-xl bg-bg-elevated/40 border border-border-subtle/40'
									>
										<div className='size-6 rounded-full bg-brand text-white text-xs font-black grid place-items-center shrink-0'>
											{item.step}
										</div>
										<div className='space-y-0.5'>
											<span className='text-xs font-bold text-text-primary block leading-none'>
												{item.title}
											</span>
											<span className='text-2xs text-text-muted block leading-relaxed'>
												{item.desc}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</PremiumSurface>

				{/* Bottom Row: Commands & Quick Links */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Quick Links */}
					<PremiumSurface tone='brand' showOrbs={true} eyebrow='Quick Links'>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
							{QUICK_LINKS.map(link => (
								<motion.a
									whileHover={{ scale: 1.03 }}
									whileTap={{ scale: 0.97 }}
									key={link.label}
									href={link.url}
									target='_blank'
									rel='noopener noreferrer'
									className='relative overflow-hidden rounded-xl border border-border-subtle bg-bg-card/40 p-3.5 flex items-center gap-3 hover:border-brand/40 transition-colors'
								>
									<span className='text-2xl shrink-0'>{link.icon}</span>
									<div className='min-w-0 flex-1'>
										<span className='text-xs font-bold text-text-primary block truncate'>
											{link.label}
										</span>
										<span className='text-2xs text-text-muted font-mono block truncate mt-0.5'>
											{link.url.replace('http://', '')}
										</span>
									</div>
									<ExternalLink className='size-3.5 text-text-muted shrink-0' />
								</motion.a>
							))}
						</div>
					</PremiumSurface>

					{/* Infrastructure Control Panel */}
					<PremiumSurface
						tone='depth'
						showOrbs={true}
						eyebrow='Dev Commands Reference'
					>
						<div className='grid grid-cols-1 gap-2 mt-4'>
							{[
								{
									label: 'Investor demo prep',
									cmd: 'demo-prep.bat',
									dir: 'chefkix-infrastructure/',
								},
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
									className='bg-bg-card/40 border border-border-subtle/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs'
								>
									<span className='text-text-muted text-2xs font-bold'>
										{item.label}
									</span>
									<div className='flex items-center gap-2 shrink-0'>
										<code className='bg-bg-elevated px-2 py-0.5 rounded font-mono text-2xs text-brand'>
											{item.cmd}
										</code>
										<button
											onClick={() =>
												copy(`cd ${item.dir} && ${item.cmd}`, item.cmd)
											}
											className='text-2xs text-text-muted hover:text-text-primary shrink-0'
											title='Copy Command Line'
										>
											{copied === item.cmd ? '✓' : '⎘'}
										</button>
									</div>
								</div>
							))}
						</div>
					</PremiumSurface>
				</div>

				{/* Breathtaking cURL Command Playground */}
				{token && (
					<PremiumSurface
						tone='xp'
						showOrbs={false}
						eyebrow='cURL Request Generator'
					>
						<div
							onClick={() =>
								copy(
									`curl -H "Authorization: Bearer ${token}" ${BASE}/api/v1/auth/me`,
									'curl',
								)
							}
							className='mt-3 bg-bg-card/75 border border-border-subtle rounded-xl p-4 font-mono text-xs text-text-secondary cursor-pointer hover:border-brand/40 transition-colors flex items-start gap-3 justify-between'
						>
							<code className='text-brand break-all leading-relaxed'>
								curl -H &quot;Authorization: Bearer {token.substring(0, 80)}
								...&quot; {BASE}/api/v1/auth/me
							</code>
							<span className='text-2xs font-bold text-text-muted shrink-0 mt-0.5'>
								{copied === 'curl' ? '✓ Copied' : 'Copy cURL'}
							</span>
						</div>
					</PremiumSurface>
				)}

				{/* footer */}
				<footer className='text-center text-2xs font-mono text-text-muted/60 pt-8 pb-4'>
					ChefKix Dev Dashboard · Visible in Development Mode Only · Not shipped
					to production
				</footer>
			</main>

			{/* Floating Cheat Engine Panel */}
			<div className='fixed bottom-5 right-5 z-notification w-[min(92vw,360px)]'>
				<div className='rounded-2xl border border-border-subtle/80 bg-bg-card/95 shadow-2xl backdrop-blur-md'>
					<div className='flex items-center justify-between gap-2 border-b border-border-subtle/60 px-3 py-2.5'>
						<div className='flex items-center gap-2 text-xs font-black uppercase tracking-wide text-text-primary'>
							<SlidersHorizontal className='size-4 text-brand' />
							Demo Cheat Engine
						</div>
						<button
							type='button'
							onClick={() => setCheatPanelCollapsed(prev => !prev)}
							className='inline-flex items-center rounded-lg border border-border-subtle bg-bg-elevated px-2 py-1 text-2xs font-semibold text-text-secondary hover:text-text-primary'
						>
							{cheatPanelCollapsed ? (
								<ChevronsUp className='size-3.5' />
							) : (
								<ChevronsDown className='size-3.5' />
							)}
						</button>
					</div>

					<AnimatePresence initial={false}>
						{!cheatPanelCollapsed && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 8 }}
								className='space-y-3 p-3'
							>
								<div className='rounded-xl border border-warning/30 bg-warning/10 p-2 text-2xs font-semibold text-warning'>
									Ctrl+Shift+M toggles this panel
								</div>
								<div className='grid grid-cols-2 gap-1.5'>
									<button
										type='button'
										onClick={() => setCheatHardBlockMode(prev => !prev)}
										className={cn(
											'rounded-lg border px-1.5 py-1 text-2xs font-bold',
											cheatHardBlockMode
												? 'border-success/30 bg-success/10 text-success'
												: 'border-warning/30 bg-warning/10 text-warning',
										)}
									>
										Hard Block: {cheatHardBlockMode ? 'ON' : 'OFF'}
									</button>
									<div className='rounded-lg border border-border-subtle bg-bg-card px-1.5 py-1 text-2xs text-text-muted'>
										Beat readiness:{' '}
										{selectedCheatBeatReadinessStatus ?? 'unknown'}
									</div>
								</div>
								{hardBlockActive && (
									<div className='rounded-lg border border-error/30 bg-error/10 px-2 py-1.5 text-2xs text-error'>
										Launch blocked: {beatBlockedByAuth ? 'auth required' : 'readiness blocked'}
									</div>
								)}

								<div className='grid grid-cols-2 gap-2'>
									<button
										type='button'
										onClick={() => void checkServices()}
										className='rounded-xl border border-border-subtle bg-bg-elevated px-2.5 py-2 text-2xs font-bold text-text-primary hover:bg-bg-card'
									>
										Infra Probe
									</button>
									<button
										type='button'
										onClick={() => void runApiTests()}
										disabled={isRunningApiTests}
										className='rounded-xl border border-brand/30 bg-brand/10 px-2.5 py-2 text-2xs font-bold text-brand disabled:opacity-50'
									>
										API Sweep
									</button>
								</div>

								<div className='grid grid-cols-2 gap-2'>
									<div className='rounded-xl border border-success/25 bg-success/10 px-2 py-1.5 text-center'>
										<div className='text-2xs uppercase tracking-wide text-success/80'>
											Services
										</div>
										<div className='text-xs font-black text-success'>
											{upCount}/{SERVICES.length}
										</div>
									</div>
									<div className='rounded-xl border border-brand/25 bg-brand/10 px-2 py-1.5 text-center'>
										<div className='text-2xs uppercase tracking-wide text-brand/80'>
											API Pass
										</div>
										<div className='text-xs font-black text-brand'>
											{passCount}/{API_TESTS.length}
										</div>
									</div>
								</div>

								<div className='space-y-1.5'>
									<span className='text-2xs font-bold uppercase tracking-wide text-text-muted'>
										Persona Hot Swap
									</span>
									<div className='grid grid-cols-2 gap-2'>
										{DEMO_ACCOUNTS.slice(0, 4).map(account => (
											<button
												type='button'
												key={`cheat-${account.username}`}
												onClick={() =>
													void loginToApp(
														account.username,
														account.password,
														account.defaultRoute,
													)
												}
												disabled={isLoggingInToApp}
												className='rounded-xl border border-border-subtle bg-bg-card px-2.5 py-2 text-2xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50'
											>
												{account.username}
											</button>
										))}
									</div>
								</div>

								<div className='space-y-1.5'>
									<span className='text-2xs font-bold uppercase tracking-wide text-text-muted'>
										Route Teleport
									</span>
									<div className='grid grid-cols-2 gap-2'>
										{cheatTeleportRoutes.map(route => (
											<button
												type='button'
												key={`teleport-${route.path}`}
												onClick={() => {
													window.open(route.path, '_blank', 'noopener,noreferrer')
												}}
												className='rounded-xl border border-border-subtle bg-bg-card px-2 py-2 text-2xs font-semibold text-text-secondary hover:text-text-primary'
											>
												{route.icon} {route.label}
											</button>
										))}
									</div>
								</div>

								<div className='space-y-1.5'>
									<span className='text-2xs font-bold uppercase tracking-wide text-text-muted'>
										Beat Control
									</span>
									<select
										value={selectedCheatBeatId}
										onChange={event => setSelectedCheatBeatId(event.target.value)}
										className='w-full rounded-xl border border-border-subtle bg-bg-card px-2.5 py-2 text-2xs font-semibold text-text-primary'
									>
										{DEMO_PITCH_BEATS.map(beat => (
											<option key={`beat-selector-${beat.id}`} value={beat.id}>
												{beat.phase} · {beat.title}
											</option>
										))}
									</select>
									<div className='grid grid-cols-2 gap-2'>
										<button
											type='button'
											onClick={() =>
												selectedCheatBeat &&
												void launchBeatFromCheat(selectedCheatBeat.id)
											}
											disabled={!selectedCheatBeat || hardBlockActive}
											className='rounded-xl border border-brand/30 bg-brand/10 px-2.5 py-2 text-2xs font-bold text-brand disabled:opacity-50'
										>
											Run Beat
										</button>
										<button
											type='button'
											onClick={() =>
												selectedCheatBeat &&
												void launchBeatInNewTabFromCheat(selectedCheatBeat.id)
											}
											disabled={!selectedCheatBeat || hardBlockActive}
											className='rounded-xl border border-xp/30 bg-xp/10 px-2.5 py-2 text-2xs font-bold text-xp disabled:opacity-50'
										>
											Run In Tab
										</button>
									</div>
									<div className='grid grid-cols-2 gap-2'>
										<button
											type='button'
											onClick={() =>
												selectedCheatBeat &&
												copyBeatAutorunFromCheat(selectedCheatBeat.id)
											}
											disabled={!selectedCheatBeat}
											className='rounded-xl border border-border-subtle bg-bg-elevated px-2.5 py-2 text-2xs font-bold text-text-primary disabled:opacity-50'
										>
											Copy Autorun
										</button>
										<button
											type='button'
											onClick={() => {
												window.open('/demo-cockpit', '_blank', 'noopener,noreferrer')
											}}
											className='rounded-xl border border-border-subtle bg-bg-elevated px-2.5 py-2 text-2xs font-bold text-text-primary'
										>
											Open Cockpit
										</button>
									</div>
									{selectedCheatActionShortcut && (
										<div className='rounded-xl border border-border-subtle/70 bg-bg-elevated/50 px-2.5 py-2 text-2xs text-text-muted'>
											Primary action: {selectedCheatActionShortcut.label}
										</div>
									)}
									<div className='grid grid-cols-1 gap-1.5 max-h-40 overflow-auto pr-1'>
										{topShortcuts.map(shortcut => (
											<button
												type='button'
												key={`cheat-shortcut-${shortcut.id}`}
												onClick={() => void openPitchShortcut(shortcut)}
												disabled={activeShortcut === shortcut.label}
												className='inline-flex items-center justify-between rounded-xl border border-border-subtle/80 bg-bg-card px-2.5 py-2 text-2xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50'
											>
												<span className='truncate'>{shortcut.label}</span>
												<Play className='size-3.5 shrink-0 text-brand' />
											</button>
										))}
									</div>
								</div>

								<div className='space-y-1.5 rounded-xl border border-border-subtle/70 bg-bg-elevated/50 p-2.5'>
									<div className='flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-text-muted'>
										<Zap className='size-3.5 text-brand' />
										Orchestrator Profile
									</div>
									<div className='grid grid-cols-2 gap-1.5'>
										<button
											type='button'
											onClick={applyStrictBaseline}
											className='rounded-lg border border-success/30 bg-success/10 px-1.5 py-1 text-2xs font-bold text-success'
										>
											Harden
										</button>
										<button
											type='button'
											onClick={resetCheatEngineState}
											className='rounded-lg border border-warning/30 bg-warning/10 px-1.5 py-1 text-2xs font-bold text-warning'
										>
											Reset
										</button>
									</div>
									<div className='grid grid-cols-2 gap-1.5'>
										<button
											type='button'
											onClick={() => void launchOrchestratorRun('single-strict')}
											disabled={isLaunchingOrchestrator || isStoppingAllTasks}
											className='rounded-lg border border-brand/30 bg-brand/10 px-1.5 py-1 text-2xs font-bold text-brand disabled:opacity-50'
										>
											Run Strict
										</button>
										<button
											type='button'
											onClick={() => void launchOrchestratorRun('certify-strict')}
											disabled={isLaunchingOrchestrator || isStoppingAllTasks}
											className='rounded-lg border border-xp/30 bg-xp/10 px-1.5 py-1 text-2xs font-bold text-xp disabled:opacity-50'
										>
											Run Certify x3
										</button>
									</div>
									<div className='grid grid-cols-2 gap-1.5'>
										<button
											type='button'
											onClick={() => void stopAllOrchestratorTasks()}
											disabled={isStoppingAllTasks || runningOrchestratorTaskCount === 0}
											className='inline-flex items-center justify-center gap-1 rounded-lg border border-error/30 bg-error/10 px-1.5 py-1 text-2xs font-bold text-error disabled:opacity-50'
										>
											<StopCircle className='size-3' />
											Stop All
										</button>
										<button
											type='button'
											onClick={() => void cleanupOrchestratorTasks(8)}
											disabled={isCleaningTaskHistory}
											className='inline-flex items-center justify-center gap-1 rounded-lg border border-warning/30 bg-warning/10 px-1.5 py-1 text-2xs font-bold text-warning disabled:opacity-50'
										>
											<Trash2 className='size-3' />
											Cleanup
										</button>
									</div>
									{orchestrationRiskFlags.length > 0 ? (
										<div className='rounded-lg border border-error/30 bg-error/10 px-2 py-1.5 text-2xs text-error'>
											Risk: {orchestrationRiskFlags.join(' • ')}
										</div>
									) : (
										<div className='rounded-lg border border-success/30 bg-success/10 px-2 py-1.5 text-2xs text-success'>
											Strict profile armed
										</div>
									)}
									{orchestratorPreflight && (
										<div
											className={cn(
												'rounded-lg border px-2 py-1.5 text-2xs',
												orchestratorPreflight.backendHealthOk && orchestratorPreflight.authProbeOk
													? 'border-success/30 bg-success/10 text-success'
													: 'border-error/30 bg-error/10 text-error',
											)}
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
									{cheatHardBlockMode && orchestrationRiskFlags.length > 0 && (
										<div className='inline-flex items-start gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-2 py-1.5 text-2xs text-warning'>
											<ShieldAlert className='mt-0.5 size-3 shrink-0' />
											<span>Hard block prevents orchestrator launch until risks are removed.</span>
										</div>
									)}
									{orchestratorTask && (
										<div
											className={cn(
												'rounded-lg border px-2 py-1.5 text-2xs',
												orchestratorRunStateTone,
											)}
										>
											<div className='font-bold'>
												Task {orchestratorTask.mode} • {orchestratorTask.status}
											</div>
											<div className='font-mono text-2xs opacity-80'>
												{orchestratorTask.taskId}
											</div>
											{orchestratorTask.runId && (
												<div className='font-mono text-2xs opacity-80'>
													{orchestratorTask.runId}
												</div>
											)}
											<div className='mt-1 text-2xs opacity-80'>
												watchdog:{' '}
												{orchestratorTask.watchdogRisk} · runtime:{' '}
												{orchestratorTask.runtimeAgeSec}s/{orchestratorTask.maxRuntimeSec}s · idle:{' '}
												{orchestratorTask.lastOutputAgeSec}s
											</div>
											{orchestratorProgress && (
												<div className='mt-1 text-2xs opacity-80'>
													<div>
														strict:{' '}
														{orchestratorProgress.strictAssertionFailures ?? 'n/a'} ·
														render:{' '}
														{orchestratorProgress.renderAnomalies ?? 'n/a'} · 5xx:{' '}
														{orchestratorProgress.http5xxResponses ?? 'n/a'} · page:{' '}
														{orchestratorProgress.pageErrors ?? 'n/a'}
													</div>
													<div>
														beats e/a/p:{' '}
														{orchestratorProgress.beatsWithEvidence ?? 'n/a'}/
														{orchestratorProgress.beatsWithValueArc ?? 'n/a'}/
														{orchestratorProgress.beatsWithPhaseCoverage ?? 'n/a'} of{' '}
														{orchestratorProgress.expectedBeats ?? 'n/a'}
													</div>
													<div>
														rates e/a/p:{' '}
														{orchestratorProgress.beatEvidenceRate ?? 'n/a'}%/
														{orchestratorProgress.beatValueArcRate ?? 'n/a'}%/
														{orchestratorProgress.beatPhaseCoverageRate ?? 'n/a'}%
													</div>
													<div>
														fallback total/scene/route:{' '}
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
														<div className='mt-1 rounded border border-error/35 bg-error/15 px-1.5 py-1 text-2xs text-error'>
															{orchestratorProgress.criticalFindings.slice(0, 3).join(' | ')}
														</div>
													)}
												</div>
											)}
											{orchestratorTask.recentOutput.length > 0 && (
												<div className='mt-1 rounded border border-border-subtle/70 bg-bg-card/70 px-1.5 py-1 font-mono text-2xs text-text-secondary max-h-20 overflow-auto'>
													{orchestratorTask.recentOutput.slice(-6).join('\n')}
												</div>
											)}
											{orchestratorTask.errorMessage && (
												<div className='mt-1 text-2xs text-error'>
													{orchestratorTask.errorMessage}
												</div>
											)}
										</div>
									)}
									<div className='rounded-lg border border-border-subtle/80 bg-bg-card px-2 py-1.5 text-2xs text-text-secondary'>
										<div className='flex items-center justify-between gap-2'>
											<span className='font-bold uppercase tracking-wide text-text-muted'>
												Task Timeline
											</span>
											<div className='flex items-center gap-1.5'>
												<span className='text-2xs text-text-muted'>run:{runningOrchestratorTaskCount}</span>
												<button
													type='button'
													onClick={() => void refreshOrchestratorTaskList()}
													disabled={isRefreshingTaskList}
													className='rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-2xs font-semibold text-text-secondary disabled:opacity-50'
												>
													Refresh
												</button>
											</div>
										</div>
										<div className='mt-1.5 max-h-28 space-y-1 overflow-auto'>
											{orchestratorTaskList.length === 0 ? (
												<div className='text-2xs text-text-muted'>No tasks yet</div>
											) : (
												orchestratorTaskList.slice(0, 8).map(task => (
													<div
														key={`task-row-${task.taskId}`}
														className='rounded border border-border-subtle/70 bg-bg-elevated/60 px-1.5 py-1'
													>
														<div className='flex items-center justify-between gap-2'>
															<span className='font-mono text-2xs text-text-muted'>
																{task.taskId.slice(0, 8)}
															</span>
															<span
																className={cn(
																	'text-2xs font-bold',
																	task.status === 'passed'
																		? 'text-success'
																		: task.status === 'failed'
																			? 'text-error'
																			: task.status === 'stopped'
																				? 'text-warning'
																				: 'text-brand',
																)}
															>
																{task.status}
															</span>
														</div>
														<div className='mt-0.5 flex items-center justify-between gap-2'>
															<span className='text-2xs text-text-muted'>
																{task.mode}
															</span>
															<span
																className={cn(
																	'text-2xs font-semibold',
																	task.watchdogRisk === 'critical'
																		? 'text-error'
																		: task.watchdogRisk === 'warning'
																			? 'text-warning'
																			: 'text-success',
																)}
															>
																{task.runtimeAgeSec}s/{task.maxRuntimeSec}s
															</span>
															{task.status === 'running' && (
																<button
																	type='button'
																	onClick={() => void stopOrchestratorTask(task.taskId)}
																	className='rounded border border-error/30 bg-error/10 px-1 py-0.5 text-2xs font-bold text-error'
																>
																	Stop
																</button>
															)}
														</div>
													</div>
												))
											)}
										</div>
									</div>
									<div className='grid grid-cols-3 gap-1.5'>
										{ORCHESTRATOR_PROFILES.map(profile => (
											<button
												type='button'
												key={`profile-${profile.id}`}
												onClick={() => applyOrchestratorProfile(profile.id)}
												className='rounded-lg border border-border-subtle bg-bg-card px-1.5 py-1 text-2xs font-bold text-text-primary hover:border-brand/40'
											>
												{profile.label}
											</button>
										))}
									</div>
									<select
										value={orchestratorScenario}
										onChange={event => setOrchestratorScenario(event.target.value)}
										className='w-full rounded-lg border border-border-subtle bg-bg-card px-2 py-1.5 text-2xs font-semibold text-text-primary'
									>
										{['demo-cockpit-deep', 'quick-post', 'route-sweep'].map(item => (
											<option key={`orchestrator-scenario-${item}`} value={item}>
												{item}
											</option>
										))}
									</select>
									<div className='grid grid-cols-2 gap-1.5 text-2xs'>
										{[
											{
												label: 'Headless',
												value: orchestratorHeadless,
												toggle: () => setOrchestratorHeadless(prev => !prev),
											},
											{
												label: 'Strict',
												value: orchestratorStrict,
												toggle: () => setOrchestratorStrict(prev => !prev),
											},
											{
												label: 'Selector Preflight',
												value: orchestratorSelectorPreflight,
												toggle: () =>
													setOrchestratorSelectorPreflight(prev => !prev),
											},
											{
												label: 'Scene Fallback',
												value: orchestratorStrictSceneFallback,
												toggle: () =>
													setOrchestratorStrictSceneFallback(prev => !prev),
											},
											{
												label: 'Screenshots',
												value: orchestratorCaptureScreenshots,
												toggle: () =>
													setOrchestratorCaptureScreenshots(prev => !prev),
											},
											{
												label: 'Host Failover',
												value: orchestratorHostFailover,
												toggle: () => setOrchestratorHostFailover(prev => !prev),
											},
										].map(toggle => (
											<button
												type='button'
												key={`toggle-${toggle.label}`}
												onClick={toggle.toggle}
												className={cn(
													'rounded-lg border px-1.5 py-1 font-semibold transition-colors',
													toggle.value
														? 'border-success/30 bg-success/10 text-success'
														: 'border-border-subtle bg-bg-card text-text-muted',
												)}
											>
												{toggle.label}
											</button>
										))}
									</div>

									<div className='grid grid-cols-2 gap-1.5'>
										<select
											value={orchestratorCheckpointMode}
											onChange={event =>
												setOrchestratorCheckpointMode(event.target.value)
											}
											className='rounded-lg border border-border-subtle bg-bg-card px-2 py-1.5 text-2xs font-semibold text-text-primary'
										>
											{['off', 'prompt'].map(mode => (
												<option key={`checkpoint-${mode}`} value={mode}>
													checkpoint:{mode}
												</option>
											))}
										</select>
										<input
											type='number'
											min={120000}
											step={15000}
											value={orchestratorScenarioTimeoutMs}
											onChange={event =>
												setOrchestratorScenarioTimeoutMs(
													Math.max(120000, Number(event.target.value) || 120000),
												)
											}
											className='rounded-lg border border-border-subtle bg-bg-card px-2 py-1.5 text-2xs font-semibold text-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
										/>
									</div>

									<div className='rounded-lg border border-border-subtle/80 bg-bg-card px-2 py-1.5 text-2xs font-mono text-text-secondary break-all'>
										{orchestratorCommand}
									</div>
									<div className='rounded-lg border border-brand/30 bg-brand/10 px-2 py-1.5 text-2xs font-mono text-brand break-all'>
										{strictSingleRunCommand}
									</div>
									<div className='rounded-lg border border-xp/30 bg-xp/10 px-2 py-1.5 text-2xs font-mono text-xp break-all'>
										{strictCertifyCommand}
									</div>
									<button
										type='button'
										onClick={() =>
											copy(
												`Set-Location d:\\code\\chefkix\\chefkix-fe; ${orchestratorCommand}`,
												'cheat-run-command-windows',
											)
										}
										className='w-full rounded-xl border border-brand/30 bg-brand/10 px-2.5 py-2 text-2xs font-bold text-brand'
									>
										{copied === 'cheat-run-command-windows'
											? 'Windows Command Copied'
											: 'Copy Windows Command'}
									</button>
									<button
										type='button'
										onClick={() =>
											copy(
												`Set-Location d:\\code\\chefkix\\chefkix-fe; ${strictSingleRunCommand}`,
												'cheat-strict-single-command',
											)
										}
										className='w-full rounded-xl border border-brand/30 bg-brand/10 px-2.5 py-2 text-2xs font-bold text-brand'
									>
										{copied === 'cheat-strict-single-command'
											? 'Strict Single Copied'
											: 'Copy Strict Single'}
									</button>
									<button
										type='button'
										onClick={() =>
											copy(
												`Set-Location d:\\code\\chefkix\\chefkix-fe; ${strictCertifyCommand}`,
												'cheat-strict-certify-command',
											)
										}
										className='w-full rounded-xl border border-xp/30 bg-xp/10 px-2.5 py-2 text-2xs font-bold text-xp'
									>
										{copied === 'cheat-strict-certify-command'
											? 'Strict Certify Copied'
											: 'Copy Strict Certify x3'}
									</button>
									<button
										type='button'
										onClick={() => copy(orchestratorCommand, 'cheat-run-command')}
										className='w-full rounded-xl border border-success/30 bg-success/10 px-2.5 py-2 text-2xs font-bold text-success'
									>
										{copied === 'cheat-run-command'
											? 'Command Copied'
											: 'Copy Orchestrator Command'}
									</button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}
