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

const BASE_URL = 'http://localhost:3000'
const API_URL = 'http://localhost:8080/api/v1'
const RAW_CAPTURES_DIR = path.join(__dirname, 'raw-captures')
const RAW_ARCHIVE_DIR = path.join(__dirname, 'raw-archive')
const RUN_STATE_PATH = path.join(__dirname, '.run-state.json')

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
	/** Optional: query params to append */
	queryParams?: Record<string, string>
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
		path: '/auth/forgot-password',
		name: 'auth-forgot-password',
		requiresAuth: false,
		states: ['guest'],
		waitForSelector: 'form',
	},
	{
		path: '/explore',
		name: 'explore',
		requiresAuth: false,
		states: ['guest', 'default'],
		waitForSelector: '[data-testid="explore-page"], main',
	},
	{
		path: '/search',
		name: 'search',
		requiresAuth: false,
		states: ['guest', 'default'],
		waitForSelector: 'input, main',
	},
	{
		path: '/community',
		name: 'community',
		requiresAuth: false,
		states: ['guest', 'default'],
	},
]

// ---- PROTECTED ROUTES (default + empty + error states) ---------------------

const PROTECTED_ROUTES: RouteConfig[] = [
	{
		path: '/dashboard',
		name: 'dashboard',
		requiresAuth: true,
		states: ['default', 'empty', 'loading', 'error'],
		waitForSelector: 'main',
		skipScroll: true,
	},
	{
		path: '/feed',
		name: 'feed',
		requiresAuth: true,
		states: ['default', 'empty'],
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
		path: '/friends',
		name: 'friends',
		requiresAuth: true,
		states: ['default', 'empty'],
	},
	{
		path: '/cook-together',
		name: 'cook-together',
		requiresAuth: true,
		states: ['default'],
	},
	{
		path: '/admin',
		name: 'admin',
		requiresAuth: true,
		states: ['default'],
	},
	{
		path: '/discover',
		name: 'discover',
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

/**
 * Unlock the h-screen overflow-hidden layout so Playwright's fullPage: true
 * captures the entire scrollable content. Call AFTER autoScroll but BEFORE screenshot.
 */
async function unlockFullPageCapture(page: Page): Promise<void> {
	await page.evaluate(() => {
		const main = document.querySelector('main')
		if (!main) return

		// Find the h-screen overflow-hidden root container (direct parent of main in the app layout)
		const root = main.parentElement
		if (!root) return

		const style = window.getComputedStyle(root)
		if (
			style.overflow === 'hidden' &&
			(style.height === `${window.innerHeight}px` ||
				root.classList.contains('h-screen'))
		) {
			// Remove height constraint and overflow hidden
			root.style.height = 'auto'
			root.style.overflow = 'visible'
			// Let main expand naturally instead of being its own scroll container
			main.style.overflow = 'visible'
			main.style.height = 'auto'
		}
	})
}

/** Wait for the page to stabilize: network idle + optional selector */
async function waitForStable(
	page: Page,
	selector?: string,
	state: VisualState = 'default',
): Promise<void> {
	if (state === 'loading') {
		if (selector) {
			await page.waitForSelector(selector, { timeout: 5_000 }).catch(() => {
				// Some loading states render only generic skeletons.
			})
		}

		await page.waitForTimeout(1_500)
		return
	}

	// Wait for network to settle
	await page.waitForLoadState('networkidle').catch(() => {
		// networkidle can timeout on pages with persistent connections (WebSocket)
	})

	// Wait for specific content if requested
	if (selector) {
		await page.waitForSelector(selector, { timeout: 10_000 }).catch(() => {
			// Selector might not exist in empty/error states — that's OK
		})
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
	userId: string
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

	return {
		accessToken: data.data.accessToken,
		userId: data.data.user?.id || 'unknown',
	}
}

/** Inject auth state into the browser context (localStorage + Zustand) */
async function injectAuth(page: Page, tokens: AuthTokens): Promise<void> {
	await page.evaluate(({ accessToken, userId }) => {
		// Set the Zustand auth store in localStorage (persisted store)
		const authState = {
			state: {
				isAuthenticated: true,
				accessToken,
				user: null, // Will be populated by AuthProvider on mount
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

/** Clear all auth state */
async function clearAuth(page: Page): Promise<void> {
	await page.evaluate(() => {
		localStorage.clear()
		sessionStorage.clear()
		// Dismiss first-visit hints so they don't block screenshots
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
		const manifestPath = writeManifest(currentDevice, currentRunId)
		console.log(`\n📸 Archived capture manifest written: ${manifestPath}`)
		console.log(`   Latest screenshots recorded: ${manifest.length}`)

		if (process.env.VISUAL_BUILD_AI_REVIEW === '0') {
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
					// Navigate to the app first to set localStorage on the right domain
					await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
					await injectAuth(page, authTokens)
				} else if (state === 'guest') {
					await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
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

				await page.goto(url.toString(), {
					waitUntil: 'domcontentloaded',
					timeout: 30_000,
				})

				// ---- 5. Wait for stability --------------------------------------
				await waitForStable(page, route.waitForSelector, state)

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
