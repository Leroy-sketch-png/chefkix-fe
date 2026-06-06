/**
 * ChefKix Visual Truth Machine
 *
 * A single-file Playwright visual runner that crawls every route in every
 * visual state, captures deterministic full-page screenshots, and optionally
 * asserts against accepted baselines.
 *
 * Usage:
 *   npx playwright test visual-runner          # Capture + compare baselines
 *   npx playwright test visual-runner --update-snapshots  # Accept new baselines
 *
 * Architecture:
 *   - State forcing via localStorage, cookies, query params, route interception
 *   - Stable waiting (networkidle + selector checks + animation disable)
 *   - Auto-scroll for lazy-loaded content
 *   - JSON manifest output for CI/tooling integration
 *   - Percy-compatible naming for future integration
 *   - Chromatic-compatible structure for future Storybook pairing
 */

import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'
import { gzipSync } from 'zlib'

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100'
const API_URL = 'http://localhost:8080/api/v1'
const RAW_CAPTURES_DIR = path.join(__dirname, 'raw-captures')
const RAW_ARCHIVE_DIR = path.join(__dirname, 'raw-archive')
const RUN_STATE_PATH = path.join(__dirname, '.run-state.json')
const WARMED_ROUTE_URLS = new Set<string>()

const AUTH_CREDS = {
	emailOrUsername: 'testuser',
	password: 'test123',
}

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

/**
 * Visual state that can be forced on any route.
 *
 * 'default'  — whatever the page renders with real data
 * 'empty'    — force empty/no-data states (clear stores, mock empty responses)
 * 'loading'  — capture the loading/skeleton state (intercept API to hang)
 * 'error'    — force API error states (intercept API with 500s)
 * 'guest'    — unauthenticated view (skip login)
 */
type VisualState = 'default' | 'empty' | 'loading' | 'error' | 'guest'

interface RouteConfig {
	/** The URL path to visit */
	path: string
	/** Human-readable name for file naming */
	name: string
	/** Whether this route requires authentication */
	requiresAuth: boolean
	/** Which states to capture for this route */
	states: VisualState[]
	/** Optional: CSS selector to wait for before screenshot */
	waitForSelector?: string
	/** Optional: settled-state selector for non-loading captures */
	readySelector?: string
	/** Optional: require the readySelector to appear before capture */
	requireReadySelector?: boolean
	/** Optional: query params to append */
	queryParams?: Record<string, string>
	/** Optional: alternate route match for canonical redirects */
	expectedPathRegex?: RegExp
	/** Optional: skip auto-scroll (for modals/fixed layouts) */
	skipScroll?: boolean
	/** Optional: extra setup before screenshot */
	setup?: (page: Page) => Promise<void>
}

// ---- PUBLIC ROUTES (guest + default states) --------------------------------

const PUBLIC_ROUTES: RouteConfig[] = [
	{
		path: '/',
		name: 'landing',
		requiresAuth: false,
		states: ['guest'],
		waitForSelector: 'nav',
	},
	{
		path: '/auth/sign-in',
		name: 'auth-sign-in',
		requiresAuth: false,
		states: ['guest'],
		waitForSelector: 'form',
	},
	{
		path: '/auth/sign-up',
		name: 'auth-sign-up',
		requiresAuth: false,
		states: ['guest'],
		waitForSelector: 'form',
	},
	{
		path: '/explore',
		name: 'explore',
		requiresAuth: false,
		states: ['guest', 'default'],
		waitForSelector: '[data-testid="explore-page"]',
		readySelector: '[data-testid="explore-page"][data-visual-ready="true"]',
	},
	{
		path: '/search',
		name: 'search',
		requiresAuth: false,
		states: ['guest', 'default'],
		waitForSelector: '[data-testid="search-page"]',
		readySelector: '[data-testid="search-page"][data-visual-ready="true"]',
	},
	{
		path: '/community',
		name: 'community',
		requiresAuth: false,
		states: ['guest', 'default'],
		waitForSelector: '[data-testid="community-page"]',
		readySelector: '[data-testid="community-page"][data-visual-ready="true"]',
	},
]

// ---- PROTECTED ROUTES (default + empty + error states) ---------------------

const PROTECTED_ROUTES: RouteConfig[] = [
	{
		path: '/dashboard',
		name: 'dashboard',
		requiresAuth: true,
		states: ['default', 'empty', 'loading', 'error'],
		waitForSelector: '[data-testid="dashboard-page"]',
		readySelector: '[data-testid="dashboard-page"][data-visual-ready="true"]',
		requireReadySelector: true,
		skipScroll: false,
	},
	{
		path: '/feed',
		name: 'feed',
		requiresAuth: true,
		states: ['default', 'empty'],
		waitForSelector: '[data-testid="feed-page"]',
		readySelector: '[data-testid="feed-page"][data-visual-ready="true"]',
	},
	{
		path: '/create',
		name: 'create-recipe',
		requiresAuth: true,
		states: ['default'],
		waitForSelector: 'form, main',
	},
	{
		path: '/profile',
		name: 'profile',
		requiresAuth: true,
		states: ['default'],
		waitForSelector: '[data-testid="user-profile"]',
		expectedPathRegex: /^\/[0-9a-fA-F-]{36}$/,
	},
	{
		path: '/profile/badges',
		name: 'profile-badges',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/profile/taste',
		name: 'profile-taste',
		requiresAuth: true,
		states: ['default'],
	},
	{
		path: '/challenges',
		name: 'challenges',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/collections',
		name: 'collections',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/messages',
		name: 'messages',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/notifications',
		name: 'notifications',
		requiresAuth: true,
		states: ['default', 'empty'],
		waitForSelector: '[data-testid="notifications-page"]',
		readySelector:
			'[data-testid="notifications-page"][data-visual-ready="true"]',
	},
	{
		path: '/pantry',
		name: 'pantry',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/meal-planner',
		name: 'meal-planner',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/shopping-lists',
		name: 'shopping-lists',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/leaderboard',
		name: 'leaderboard',
		requiresAuth: true,
		states: ['default'],
	},
	{
		path: '/settings',
		name: 'settings',
		requiresAuth: true,
		states: ['default'],
		waitForSelector: 'input[name="displayName"]',
	},
	{
		path: '/creator',
		name: 'creator-studio',
		requiresAuth: true,
		states: ['default'],
	},
	{
		path: '/groups',
		name: 'groups',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/cook-together',
		name: 'cook-together',
		requiresAuth: true,
		states: ['default'],
	},
]

const ALL_ROUTES: RouteConfig[] = [...PUBLIC_ROUTES, ...PROTECTED_ROUTES]

// ============================================================================
// HELPERS
// ============================================================================

/** Deterministic archived screenshot filename: <route-name>/<state>.png.gz */
function archivePath(routeName: string, state: string, device: string): string {
	return path.join(RAW_ARCHIVE_DIR, device, routeName, `${state}.png.gz`)
}

function deviceManifestPath(device: string): string {
	return path.join(RAW_CAPTURES_DIR, device, 'manifest.json')
}

function getRunState(): { runId: string } {
	if (!fs.existsSync(RUN_STATE_PATH)) {
		return {
			runId: `adhoc-${new Date().toISOString().replace(/[:.]/g, '-')}`,
		}
	}

	try {
		const parsed = JSON.parse(fs.readFileSync(RUN_STATE_PATH, 'utf8')) as {
			runId?: string
		}
		if (typeof parsed.runId === 'string' && parsed.runId.trim()) {
			return { runId: parsed.runId }
		}
	} catch {
		// Ignore invalid run state and fall back to ad hoc mode.
	}

	return {
		runId: `adhoc-${new Date().toISOString().replace(/[:.]/g, '-')}`,
	}
}

/** Disable CSS animations and transitions for stable screenshots.
 *  Wrapped in try-catch because some routes (collections, pantry) trigger
 *  client-side redirects that destroy the execution context mid-call. */
async function disableAnimations(page: Page): Promise<void> {
	const css = `
		*, *::before, *::after {
			animation-duration: 0s !important;
			animation-delay: 0s !important;
			transition-duration: 0s !important;
			transition-delay: 0s !important;
			scroll-behavior: auto !important;
		}
		/* Framer Motion: force all motion values to final state */
		[style*="opacity: 0"] { opacity: 1 !important; }
		[style*="transform: translateY"] { transform: none !important; }
		nextjs-portal,
		#__next-build-watcher,
		[data-next-badge-root],
		[data-nextjs-toast],
		button[title="Demo Control Widget"],
		button[title="Show demo widget"] {
			display: none !important;
		}
	`
	try {
		await page.addStyleTag({ content: css })
	} catch {
		// Context destroyed by navigation — wait for the new page then retry once
		await page.waitForLoadState('domcontentloaded').catch(() => {})
		await page.waitForTimeout(500)
		try {
			await page.addStyleTag({ content: css })
		} catch {
			// Still failing — the page likely navigated again. Proceed without
			// animation disabling; Playwright's screenshot({ animations: 'disabled' })
			// provides a fallback.
		}
	}
}

/** Auto-scroll to bottom to trigger lazy-loaded content, then back to top.
 *  Handles the app's h-screen overflow-hidden root container by scrolling
 *  the internal <main> element instead of document body. */
async function autoScroll(page: Page): Promise<void> {
	const target = await page.evaluate(() => {
		const main = document.querySelector('main')
		return main && main.scrollHeight > main.clientHeight ? 'main' : 'window'
	})

	const getScrollHeight = async () => {
		return page.evaluate(scrollTarget => {
			if (scrollTarget === 'main') {
				return document.querySelector('main')?.scrollHeight ?? 0
			}

			return document.body.scrollHeight
		}, target)
	}

	for (let pass = 0; pass < 20; pass += 1) {
		const currentHeight = await getScrollHeight()

		await page.evaluate(
			({ scrollTarget, offset }) => {
				if (scrollTarget === 'main') {
					document.querySelector('main')?.scrollTo(0, offset)
					return
				}

				window.scrollTo(0, offset)
			},
			{ scrollTarget: target, offset: currentHeight },
		)

		await page.waitForTimeout(300)

		const nextHeight = await getScrollHeight()
		if (nextHeight === currentHeight) {
			break
		}
	}

	await page.evaluate(scrollTarget => {
		if (scrollTarget === 'main') {
			document.querySelector('main')?.scrollTo(0, 0)
			return
		}

		window.scrollTo(0, 0)
	}, target)

	await page.waitForTimeout(200)
}

async function unlockFullPageCapture(page: Page): Promise<void> {
	await page.evaluate(() => {
		// Clear viewport restrictions on top level elements
		document.documentElement.style.height = 'auto'
		document.documentElement.style.overflow = 'visible'
		document.body.style.height = 'auto'
		document.body.style.overflow = 'visible'

		const main = document.querySelector('main')
		if (!main) return

		main.style.overflow = 'visible'
		main.style.height = 'auto'
		main.style.maxHeight = 'none'

		let el = main.parentElement
		while (el) {
			const style = window.getComputedStyle(el)
			if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
				el.style.overflow = 'visible'
				el.style.overflowY = 'visible'
			}
			if (
				style.height !== 'auto' ||
				el.classList.contains('h-screen') ||
				el.classList.contains('min-h-screen')
			) {
				el.style.height = 'auto'
				el.style.maxHeight = 'none'
			}
			el = el.parentElement
		}
	})
}

function isRetryableNavigationError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes('ERR_CONNECTION_REFUSED') ||
		message.includes('ECONNREFUSED') ||
		message.includes('ERR_NETWORK_IO_SUSPENDED') ||
		message.includes('ERR_ABORTED') ||
		message.includes('page.goto: Timeout')
	)
}

async function waitForServerReachable(
	baseUrl: string,
	timeoutMs: number,
): Promise<void> {
	const deadline = Date.now() + timeoutMs

	while (Date.now() < deadline) {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 5_000)

		try {
			const response = await fetch(baseUrl, {
				method: 'GET',
				redirect: 'manual',
				signal: controller.signal,
			})

			if (response.status > 0) {
				return
			}
		} catch {
			// Keep polling until the local server is reachable again.
		} finally {
			clearTimeout(timeout)
		}

		await new Promise(resolve => setTimeout(resolve, 1_500))
	}
}

async function prewarmRoute(url: string): Promise<void> {
	if (process.env.VISUAL_WARM_ROUTES === '0') {
		return
	}

	if (WARMED_ROUTE_URLS.has(url)) {
		return
	}

	WARMED_ROUTE_URLS.add(url)

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 30_000)

	try {
		await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: controller.signal,
			headers: {
				'x-visual-prewarm': '1',
				'cache-control': 'no-cache',
			},
		})
	} catch {
		// Prewarm is best-effort. It should never turn a workable run into a failure.
	} finally {
		clearTimeout(timeout)
	}
}

async function navigateToRoute(
	page: Page,
	url: string,
	gotoTimeout: number,
): Promise<void> {
	const attempts = 2

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			await page.goto(url, {
				waitUntil: 'domcontentloaded',
				timeout: gotoTimeout,
			})
			return
		} catch (error) {
			if (attempt === attempts || !isRetryableNavigationError(error)) {
				throw error
			}

			await waitForServerReachable(BASE_URL, Math.min(20_000, gotoTimeout))
			await page.goto('about:blank').catch(() => {})
			await page.waitForTimeout(1_500)
		}
	}
}

/** Wait for the page to stabilize: network idle + optional selector */
async function waitForStable(
	page: Page,
	route: RouteConfig,
	state: VisualState = 'default',
): Promise<void> {
	const initialSelector = route.waitForSelector
	const settledSelector = route.readySelector ?? route.waitForSelector

	if (state === 'loading') {
		if (initialSelector) {
			await page
				.waitForSelector(initialSelector, { timeout: 5_000 })
				.catch(() => {
					// Some loading states render only generic skeletons.
				})
		}

		await page.waitForTimeout(1_500)
		return
	}

	// Wait for network to settle
	// Cap networkidle at 15s — prevents budget exhaustion on data-heavy pages
	// (e.g. dashboard with story feed + feed posts + pending sessions) where
	// multiple concurrent real API calls push networkidle past the 60s test timeout.
	await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
		// Expected: pages with WebSocket, polling, or multiple concurrent API calls
	})

	// Wait for specific content if requested
	if (settledSelector) {
		if (route.requireReadySelector && state !== 'error') {
			await page.waitForSelector(settledSelector, { timeout: 20_000 })
		} else {
			await page
				.waitForSelector(settledSelector, { timeout: 20_000 })
				.catch(() => {
					// Selector might not exist in empty/error states — that's OK
				})
		}
	}

	// Extra settle time for hydration and client-side rendering.
	// Client components (useTranslations, AuthProvider) need time to hydrate
	// after SSR shell loads. 500ms was insufficient — translations appeared as
	// raw keys (e.g. "settings.tabAccount") in screenshots.
	await page.waitForTimeout(3_000)
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

interface AuthTokens {
	accessToken: string
	refreshTokenCookie: string
	userId: string
	user: {
		userId: string
		username: string
		email: string
		displayName: string
		firstName: string
		lastName: string
		avatarUrl: string
		statistics: {
			currentLevel: number
			currentXP: number
			currentXPGoal: number
			streakCount: number
			recipeCount: number
			postCount: number
		}
	}
}

function extractRefreshTokenCookie(response: Response): string | null {
	const headersWithGetSetCookie = response.headers as Headers & {
		getSetCookie?: () => string[]
	}
	const setCookieHeaders =
		typeof headersWithGetSetCookie.getSetCookie === 'function'
			? headersWithGetSetCookie.getSetCookie()
			: [response.headers.get('set-cookie')].filter(
					(header): header is string => Boolean(header),
				)

	for (const header of setCookieHeaders) {
		const match = header.match(/(?:^|,\s*)refresh_token=([^;]+)/)
		if (match) {
			return match[1]
		}
	}

	return null
}

/** Login via API and return tokens */
async function loginViaAPI(): Promise<AuthTokens> {
	const response = await fetch(`${API_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(AUTH_CREDS),
	})

	if (!response.ok) {
		throw new Error(
			`Login failed: ${response.status} ${response.statusText}. ` +
				'Is the backend running? (dev.bat or docker compose up)',
		)
	}

	const data = await response.json()
	if (!data.success || !data.data?.accessToken) {
		throw new Error(`Login response missing token: ${JSON.stringify(data)}`)
	}

	const refreshTokenCookie = extractRefreshTokenCookie(response)
	if (!refreshTokenCookie) {
		throw new Error(
			'Login response missing refresh_token cookie. Visual auth bootstrap would be incomplete.',
		)
	}

	return {
		accessToken: data.data.accessToken,
		refreshTokenCookie,
		userId: data.data.user?.id || 'unknown',
		user: {
			userId: data.data.user?.id || 'unknown',
			username: data.data.user?.username || 'visual-user',
			email: data.data.user?.email || AUTH_CREDS.emailOrUsername,
			displayName: data.data.user?.username || 'Visual User',
			firstName: 'Visual',
			lastName: 'User',
			avatarUrl: '/placeholder-avatar.svg',
			statistics: {
				currentLevel: 1,
				currentXP: 0,
				currentXPGoal: 25,
				streakCount: 0,
				recipeCount: 0,
				postCount: 0,
			},
		},
	}
}

/** Inject auth state into the browser context (localStorage + Zustand) */
async function injectAuth(page: Page, tokens: AuthTokens): Promise<void> {
	await page.context().addCookies([
		{
			name: 'refresh_token',
			value: tokens.refreshTokenCookie,
			url: `${BASE_URL}/`,
			httpOnly: true,
			sameSite: 'Strict',
		},
	])

	await page.addInitScript(({ accessToken, user }) => {
		// Set the Zustand auth store in localStorage (persisted store)
		const authState = {
			state: {
				isAuthenticated: true,
				accessToken,
				user,
				isLoading: false,
			},
			version: 0,
		}
		localStorage.setItem('auth-storage', JSON.stringify(authState))

		// Also set the raw token for axios interceptor
		localStorage.setItem('accessToken', accessToken)

		// Dismiss first-visit hints so they don't block screenshots
		localStorage.setItem('chefkix:hints-dismissed-all', 'true')
	}, tokens)
}

async function assertExpectedRoute(
	page: Page,
	route: RouteConfig,
	state: VisualState,
): Promise<void> {
	if (state === 'guest') {
		return
	}

	const currentUrl = new URL(page.url())
	const currentPath = currentUrl.pathname

	if (route.requiresAuth && currentPath.startsWith('/auth/')) {
		throw new Error(
			`Protected route ${route.path} redirected to ${currentPath}. ` +
				'Visual capture aborted because the page is unauthenticated.',
		)
	}

	const routeMatchesExpectedPath = route.expectedPathRegex
		? route.expectedPathRegex.test(currentPath)
		: route.path === '/' || currentPath.startsWith(route.path)

	if (!routeMatchesExpectedPath) {
		throw new Error(
			`Route ${route.path} resolved to unexpected path ${currentPath}. ` +
				'Visual capture aborted to prevent false-success screenshots.',
		)
	}
}

/** Clear all auth state */
async function clearAuth(page: Page): Promise<void> {
	await page.context().clearCookies()
	await page.addInitScript(() => {
		localStorage.clear()
		sessionStorage.clear()
		localStorage.setItem('chefkix:hints-dismissed-all', 'true')
	})
}

// ============================================================================
// STATE FORCING
// ============================================================================

/**
 * Force a specific visual state on the page via route interception.
 *
 * - 'empty': Intercept API calls and return empty arrays/pages
 * - 'loading': Intercept API calls and never respond (hang)
 * - 'error': Intercept API calls and return 500 errors
 * - 'default': No interception, real data
 * - 'guest': No auth, no interception
 */
async function forceState(page: Page, state: VisualState): Promise<void> {
	if (state === 'default' || state === 'guest') return

	const emptyPage = {
		content: [],
		pageable: { pageNumber: 0, pageSize: 20 },
		totalElements: 0,
		totalPages: 0,
		last: true,
		first: true,
		empty: true,
	}

	const emptyApiResponse = {
		success: true,
		statusCode: 200,
		data: emptyPage,
	}

	const errorApiResponse = {
		success: false,
		statusCode: 500,
		message: 'Internal Server Error',
	}

	await page.route(`${API_URL}/**`, async route => {
		// Skip auth endpoints — we need those to work
		const url = route.request().url()
		if (
			url.includes('/auth/login') ||
			url.includes('/auth/me') ||
			url.includes('/auth/refresh')
		) {
			return route.continue()
		}

		switch (state) {
			case 'empty':
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(emptyApiResponse),
				})

			case 'loading':
				// Never respond — the request hangs, showing loading state
				return // Don't call route.fulfill() or route.continue()

			case 'error':
				return route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify(errorApiResponse),
				})
		}
	})
}

// ============================================================================
// MANIFEST
// ============================================================================

interface ManifestEntry {
	route: string
	name: string
	state: string
	device: string
	file: string
	timestamp: string
	durationMs: number
}

const manifest: ManifestEntry[] = []

function loadDeviceManifestEntries(device: string): ManifestEntry[] {
	const manifestPath = deviceManifestPath(device)
	if (!fs.existsSync(manifestPath)) {
		return []
	}

	try {
		const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
			entries?: ManifestEntry[]
		}
		return Array.isArray(parsed.entries) ? parsed.entries : []
	} catch {
		return []
	}
}

function addToManifest(entry: ManifestEntry, runId: string): void {
	manifest.push(entry)

	const manifestPath = deviceManifestPath(entry.device)
	const mergedEntries = new Map<string, ManifestEntry>()

	for (const existingEntry of [
		...loadDeviceManifestEntries(entry.device),
		...manifest,
	]) {
		mergedEntries.set(existingEntry.file.split(path.sep).join('/'), {
			...existingEntry,
			file: existingEntry.file.split(path.sep).join('/'),
		})
	}

	fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
	fs.writeFileSync(
		manifestPath,
		JSON.stringify(
			{
				runId,
				generatedAt: new Date().toISOString(),
				device: entry.device,
				totalScreenshots: mergedEntries.size,
				entries: [...mergedEntries.values()].sort((left, right) =>
					left.file.localeCompare(right.file),
				),
			},
			null,
			2,
		),
	)
}

function writeManifest(device: string, runId: string): string {
	const manifestPath = deviceManifestPath(device)
	const entries = loadDeviceManifestEntries(device).map(entry => ({
		...entry,
		file: entry.file.split(path.sep).join('/'),
	}))

	fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
	fs.writeFileSync(
		manifestPath,
		JSON.stringify(
			{
				runId,
				generatedAt: new Date().toISOString(),
				device,
				totalScreenshots: entries.length,
				entries,
			},
			null,
			2,
		),
	)

	return manifestPath
}

// ============================================================================
// TEST RUNNER
// ============================================================================

test.describe('Visual Truth Machine', () => {
	let authTokens: AuthTokens | null = null
	let currentDevice = 'default'
	let currentRunId = ''

	test.beforeAll(async () => {
		currentDevice = test.info().project.name || 'default'
		currentRunId = getRunState().runId
		manifest.length = 0

		// Pre-authenticate once for all tests
		try {
			authTokens = await loginViaAPI()
		} catch (e) {
			console.warn(
				'⚠️  Could not login — auth-required routes will be skipped.',
				(e as Error).message,
			)
			authTokens = null
		}
	})

	test.afterAll(async () => {
		test.setTimeout(300_000) // AI review builds images and audit exports can exceed the default hook budget
		const manifestPath = writeManifest(currentDevice, currentRunId)
		console.log(`\n📸 Archived capture manifest written: ${manifestPath}`)
		console.log(`   Latest screenshots recorded: ${manifest.length}`)

		const auditTools = await import(
			pathToFileURL(path.join(__dirname, 'export-audit.mjs')).href
		)

		if (process.env.VISUAL_BUILD_AI_REVIEW === '0') {
			const latestAuditResult = await auditTools.exportLatestAuditAliases({
				device: currentDevice,
				manifestEntries: manifest,
			})
			const sanitizeResult = await auditTools.sanitizeAuditArtifacts({
				deviceFilter: currentDevice,
			})

			console.log(
				`   Safe latest audit aliases: ${latestAuditResult.exported} (${latestAuditResult.jpegFallbacks} JPEG fallbacks)`,
			)
			console.log(
				`   Legacy audit files sanitized: ${sanitizeResult.rewritten}`,
			)
			console.log(
				`   Oversized audit images remaining: ${sanitizeResult.remainingOversized}`,
			)
			return
		}

		const reviewTools = await import(
			pathToFileURL(path.join(__dirname, 'ai-review.mjs')).href
		)
		const reviewResult = await reviewTools.buildAiReviewArtifacts()

		console.log(
			`\n🧠 AI-safe shots manifest written: ${reviewResult.shotsManifestPath}`,
		)
		console.log(`   Review metadata: ${reviewResult.reviewManifestPath}`)
		console.log(`   AI-safe images: ${reviewResult.totalReviewImages}`)
		console.log(`   Review batches: ${reviewResult.totalBatches}`)
		console.log(
			`   Oversized visual images remaining: ${reviewResult.remainingOversizedImages}`,
		)
		console.log(`   Next batch file: ${reviewResult.nextBatchPath}`)

		const auditExportResult = await auditTools.exportAuditArtifacts({
			deviceFilter: currentDevice,
		})
		const latestAuditResult = await auditTools.exportLatestAuditAliases({
			device: currentDevice,
			manifestEntries: manifest,
		})
		console.log(
			`   Audit exports: ${auditExportResult.totalExported} (${auditExportResult.jpegFallbacks} JPEG fallbacks)`,
		)
		console.log(
			`   Safe latest audit aliases: ${latestAuditResult.exported} (${latestAuditResult.jpegFallbacks} JPEG fallbacks)`,
		)

		if (reviewResult.nextBatch) {
			console.log(reviewTools.formatBatchSummary(reviewResult.nextBatch))
		}
	})

	for (const route of ALL_ROUTES) {
		for (const state of route.states) {
			const testName = `${route.name} [${state}]`

			test(testName, async ({ page }, testInfo) => {
				const device = testInfo.project.name || 'default'
				const start = Date.now()
				const pageErrors: string[] = []

				page.on('pageerror', error => {
					pageErrors.push(error.message)
				})

				// Skip auth-required routes if login failed
				if (route.requiresAuth && !authTokens && state !== 'guest') {
					if (process.env.VISUAL_ALLOW_AUTH_SKIP === '1') {
						test.skip(true, 'Backend not available — skipping auth route')
						return
					}

					throw new Error(
						'Protected route screenshot aborted because API login failed. ' +
							'Start the backend or set VISUAL_ALLOW_AUTH_SKIP=1 to intentionally skip auth pages.',
					)
				}

				// ---- 1. Navigate to a blank page first to set up state -----------
				await page.goto('about:blank')

				// ---- 2. Set up auth state ----------------------------------------
				if (route.requiresAuth && state !== 'guest' && authTokens) {
					await injectAuth(page, authTokens)
				} else if (state === 'guest') {
					await clearAuth(page)
				}

				// ---- 3. Set up state forcing (route interception) ----------------
				await forceState(page, state)

				// ---- 4. Navigate to the route ------------------------------------
				const url = new URL(route.path, BASE_URL)
				if (route.queryParams) {
					for (const [k, v] of Object.entries(route.queryParams)) {
						url.searchParams.set(k, v)
					}
				}

				const gotoTimeout = parseInt(
					// Playwright reuses the active 3100 visual dev server in local workflows.
					// When that server is Turbopack, cold route compilation can exceed 30s.
					process.env.VISUAL_GOTO_TIMEOUT || '90000',
					10,
				)
				testInfo.setTimeout(Math.max(testInfo.timeout, gotoTimeout + 120_000))
				await prewarmRoute(url.toString())
				await navigateToRoute(page, url.toString(), gotoTimeout)

				// ---- 5. Wait for stability --------------------------------------
				await waitForStable(page, route, state)
				await assertExpectedRoute(page, route, state)

				// ---- 6. Run custom setup if any ---------------------------------
				if (route.setup) {
					await route.setup(page)
				}

				// ---- 7. Disable animations for deterministic capture ------------
				await disableAnimations(page)

				// ---- 8. Auto-scroll for lazy content ----------------------------
				if (!route.skipScroll && state !== 'loading') {
					await autoScroll(page)
				}

				// ---- 8b. Unlock layout for full-page capture --------------------
				await unlockFullPageCapture(page)

				if (state !== 'error') {
					const errorBoundary = page.locator('[data-error-boundary="active"]')
					const errorBoundaryCount = await errorBoundary.count()

					if (errorBoundaryCount > 0) {
						const boundaryMessage =
							(await errorBoundary
								.first()
								.getAttribute('data-error-boundary-message')) ||
							'Unknown runtime error'

						throw new Error(
							`[${route.name}:${state}] Unexpected error boundary rendered: ${boundaryMessage}`,
						)
					}

					if (pageErrors.length > 0) {
						throw new Error(
							`[${route.name}:${state}] Unexpected page error(s): ${pageErrors.join(' | ')}`,
						)
					}
				}

				// ---- 9. Capture screenshot --------------------------------------
				// Never leave full-size PNGs in the workspace. Capture to memory,
				// then archive the original immediately as .png.gz.
				const archivedFilePath = archivePath(route.name, state, device)
				fs.mkdirSync(path.dirname(archivedFilePath), { recursive: true })

				const screenshotBuffer = await page.screenshot({
					fullPage: true,
					animations: 'disabled',
				})

				fs.writeFileSync(archivedFilePath, gzipSync(screenshotBuffer))

				// ---- 10. Record in manifest -------------------------------------
				addToManifest(
					{
						route: route.path,
						name: route.name,
						state,
						device,
						file: path.relative(__dirname, archivedFilePath),
						timestamp: new Date().toISOString(),
						durationMs: Date.now() - start,
					},
					currentRunId,
				)

				// ---- 11. Optional baseline comparison ---------------------------
				// Using Playwright's built-in visual comparison.
				// Run with --update-snapshots to accept new baselines.
				if (process.env.VISUAL_ASSERT === '1') {
					await expect(page).toHaveScreenshot(`${route.name}-${state}.png`, {
						fullPage: true,
						animations: 'disabled',
						maxDiffPixelRatio: 0.02,
					})
				}
			})
		}
	}
})
