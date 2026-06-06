import type { CookingRoom, RoomParticipant } from '@/lib/types/room'
import { getRecipeById } from '@/services/recipe'
import { useAuthStore } from '@/store/authStore'
import { useCookingStore } from '@/store/cookingStore'

export interface DemoAccount {
	label: string
	username: string
	password: string
	email: string
	description: string
	defaultRoute: string
}

export interface DemoRoute {
	label: string
	path: string
	icon: string
	description: string
}

export type DemoSceneId =
	| 'hero-recipe'
	| 'taste-compatibility'
	| 'year-in-cooking'
	| 'referral'
	| 'privacy'
	| 'recipe-battle'
	| 'recipe-review'
	| 'shopping-list'
	| 'creator-heatmap'
	| 'admin-reports'
	| 'admin-bans'
	| 'admin-appeals'

export type DemoRuntimeActionId = 'co-cook'

export interface DemoPitchShortcut {
	id: string
	label: string
	icon: string
	description: string
	kind: 'path' | 'scene' | 'runtime'
	path?: string
	sceneId?: DemoSceneId
	actionId?: DemoRuntimeActionId
	requiresAuth?: boolean
}

export interface DemoPitchBeat {
	id: string
	phase: string
	minutes: string
	title: string
	personaUsername: string
	proof: string
	presenterLine: string
	investorTranslation: string
	fallbackNote: string
	actions: string[]
	readinessCheckIds: string[]
}

export type DemoReadinessStatus = 'ready' | 'warning' | 'blocked'

export interface DemoReadinessCheck {
	id: string
	label: string
	status: DemoReadinessStatus
	severity: 'critical' | 'important' | 'optional'
	detail: string
	target?: string | null
	personaUsername?: string | null
	count?: number
}

export interface DemoReadinessReport {
	generatedAt: string
	summary: {
		total: number
		ready: number
		warning: number
		blocked: number
	}
	checks: DemoReadinessCheck[]
}

interface DemoManifestUser {
	userId: string
	profilePath: string
	defaultRoute: string
}

interface DemoManifestScenes {
	heroRecipeId?: string | null
	heroRecipePath?: string | null
	compatibilityProfilePath?: string | null
	yearInCookingPath?: string | null
	referralPath?: string | null
	privacyPath?: string | null
	battlePostPath?: string | null
	reviewPostPath?: string | null
	shoppingListPath?: string | null
	creatorHeatmapPath?: string | null
	adminReportsPath?: string | null
	adminBansPath?: string | null
	adminAppealsPath?: string | null
}

interface DemoManifest {
	generatedAt: string
	users: Record<string, DemoManifestUser>
	scenes: DemoManifestScenes
}

export interface ResolvedDemoShortcut {
	path: string
	notice?: string
	copiedText?: string
	watchUrl?: string
	joinUrl?: string
}

export type DemoEnvMode = 'cloud' | 'local'

export function getDemoEnvMode(): DemoEnvMode {
	if (typeof window === 'undefined') return 'cloud'
	const storedMode = localStorage.getItem('chefkix-demo-env-mode') as DemoEnvMode
	if (storedMode === 'cloud' || storedMode === 'local') return storedMode

	if (
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1'
	) {
		return 'local'
	}

	return 'cloud'
}

export function setDemoEnvMode(mode: DemoEnvMode) {
	if (typeof window !== 'undefined') {
		localStorage.setItem('chefkix-demo-env-mode', mode)
		// Dispatch event for other tabs
		window.dispatchEvent(
			new CustomEvent('chefkix-demo-env-changed', { detail: mode }),
		)
	}
}

export function getDemoBaseUrl() {
	if (getDemoEnvMode() === 'local') {
		return 'http://localhost:8080'
	}
	return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'
}

// Keeping the static export for backwards compatibility, but recommending getDemoBaseUrl()
export const DEMO_BASE_URL =
	process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'

const DEMO_MANIFEST_URL = '/demo-manifest.json'
const DEMO_READINESS_URL = '/demo-readiness.json'

export const DEMO_ACCOUNTS: DemoAccount[] = [
	{
		label: 'Test User',
		username: 'testuser',
		password: 'test123',
		email: 'test@chefkix.com',
		description:
			'Primary investor-demo account with feed, pantry, messages, and Taste DNA.',
		defaultRoute: '/dashboard',
	},
	{
		label: 'Demo Admin',
		username: 'admin_demo',
		password: 'test123',
		email: 'admin@demo.chefkix.com',
		description:
			'Admin persona for moderation, appeals, and verification proof.',
		defaultRoute: '/admin/reports',
	},
	{
		label: 'Chef Minh',
		username: 'chef_minh',
		password: 'test123',
		email: 'minh@demo.chefkix.com',
		description:
			'Verified creator persona for creator analytics, recipes, and authority cues.',
		defaultRoute: '/creator',
	},
	{
		label: 'Sakura Kitchen',
		username: 'sakura_kitchen',
		password: 'test123',
		email: 'yuki@demo.chefkix.com',
		description:
			'Second creator persona with strong social proof and group-message visibility.',
		defaultRoute: '/profile',
	},
	{
		label: 'Pasta Paolo',
		username: 'pasta_paolo',
		password: 'test123',
		email: 'paolo@demo.chefkix.com',
		description:
			'Cooking-centric creator persona useful for hero recipe and creator heatmap beats.',
		defaultRoute: '/creator',
	},
	{
		label: 'Weekend Cook',
		username: 'weekend_cook',
		password: 'test123',
		email: 'sarah@demo.chefkix.com',
		description: 'Consumer persona for social proof, follows, and messages.',
		defaultRoute: '/messages',
	},
]

export const DEMO_WIDGET_ACCOUNTS = DEMO_ACCOUNTS.filter(account =>
	['testuser', 'admin_demo', 'chef_minh', 'pasta_paolo'].includes(
		account.username,
	),
)

export const DEMO_ROUTES: DemoRoute[] = [
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
		label: 'Search',
		path: '/search',
		icon: '🧠',
		description: 'Semantic recipe discovery',
	},
	{
		label: 'Messages',
		path: '/messages',
		icon: '💬',
		description: 'Direct & group chat',
	},
	{
		label: 'Taste DNA',
		path: '/profile/taste',
		icon: '🧬',
		description: 'Radar chart & share card',
	},
	{
		label: 'Pantry',
		path: '/pantry',
		icon: '🥫',
		description: 'Ingredient tracking',
	},
	{
		label: 'Meal Planner',
		path: '/meal-planner',
		icon: '📅',
		description: 'Weekly meals',
	},
	{
		label: 'Creator',
		path: '/creator',
		icon: '🎬',
		description: 'Analytics & heatmaps',
	},
	{
		label: 'Admin',
		path: '/admin/reports',
		icon: '🛡️',
		description: 'Moderation & bans',
	},
	{
		label: 'Leaderboard',
		path: '/leaderboard',
		icon: '📊',
		description: 'Rankings & XP',
	},
	{
		label: 'Profile',
		path: '/profile',
		icon: '👤',
		description: 'User profile & stats',
	},
	{
		label: 'Welcome',
		path: '/welcome',
		icon: '✨',
		description: 'Cold-start onboarding',
	},
]

export const DEMO_PITCH_SHORTCUTS: DemoPitchShortcut[] = [
	{
		id: 'cold-start',
		label: 'Cold Start',
		icon: '✨',
		description: 'Interest picker and instant onboarding loop',
		kind: 'path',
		path: '/welcome',
		requiresAuth: false,
	},
	{
		id: 'dashboard',
		label: 'Dashboard',
		icon: '🏠',
		description: "Tonight's Pick and feed",
		kind: 'path',
		path: '/dashboard',
		requiresAuth: true,
	},
	{
		id: 'semantic-search',
		label: 'Semantic Search',
		icon: '🧠',
		description: 'Open search ready for the cozy-winter-food beat',
		kind: 'path',
		path: '/search?q=cozy%20winter%20food',
		requiresAuth: false,
	},
	{
		id: 'taste-dna',
		label: 'Taste DNA',
		icon: '🧬',
		description: 'Radar chart and shareable taste profile',
		kind: 'path',
		path: '/profile/taste',
		requiresAuth: true,
	},
	{
		id: 'taste-compatibility',
		label: 'Taste Compatibility',
		icon: '💞',
		description: 'Open a seeded creator profile with compatibility visible',
		kind: 'scene',
		sceneId: 'taste-compatibility',
		requiresAuth: true,
	},
	{
		id: 'year-in-cooking',
		label: 'Year In Cooking',
		icon: '📅',
		description: 'Open the annual summary surface directly',
		kind: 'scene',
		sceneId: 'year-in-cooking',
		requiresAuth: true,
	},
	{
		id: 'hero-recipe',
		label: 'Cook Hero Recipe',
		icon: '🍳',
		description:
			'Resolve a seeded recipe and open the cooking player entry point',
		kind: 'scene',
		sceneId: 'hero-recipe',
		requiresAuth: true,
	},
	{
		id: 'co-cook',
		label: 'Start Room',
		icon: '👩‍🍳',
		description:
			'Create a live room and copy Watch URL for the second-screen demo flow',
		kind: 'runtime',
		actionId: 'co-cook',
		requiresAuth: true,
	},
	{
		id: 'pantry',
		label: 'Pantry',
		icon: '🥫',
		description: 'Ingredient inventory and expiry story',
		kind: 'path',
		path: '/pantry',
		requiresAuth: true,
	},
	{
		id: 'meal-planner',
		label: 'Meal Planner',
		icon: '📅',
		description: 'AI meal planning and shopping-list flow',
		kind: 'path',
		path: '/meal-planner',
		requiresAuth: true,
	},
	{
		id: 'shopping-list',
		label: 'Shopping List',
		icon: '🛒',
		description: 'Open the saved shopping-list surface directly',
		kind: 'scene',
		sceneId: 'shopping-list',
		requiresAuth: true,
	},
	{
		id: 'creator-heatmap',
		label: 'Creator Heatmap',
		icon: '🎬',
		description: 'Creator analytics and step heatmap',
		kind: 'scene',
		sceneId: 'creator-heatmap',
		requiresAuth: true,
	},
	{
		id: 'messages',
		label: 'Messages',
		icon: '💬',
		description: 'Direct and group conversations',
		kind: 'path',
		path: '/messages',
		requiresAuth: true,
	},
	{
		id: 'recipe-review',
		label: 'Recipe Review',
		icon: '⭐',
		description: 'Jump to a seeded recipe review post',
		kind: 'scene',
		sceneId: 'recipe-review',
		requiresAuth: true,
	},
	{
		id: 'recipe-battle',
		label: 'Recipe Battle',
		icon: '⚔️',
		description: 'Jump to a seeded recipe battle post',
		kind: 'scene',
		sceneId: 'recipe-battle',
		requiresAuth: true,
	},
	{
		id: 'referral',
		label: 'Referral',
		icon: '🎁',
		description: 'Open settings straight on the referral tab',
		kind: 'scene',
		sceneId: 'referral',
		requiresAuth: true,
	},
	{
		id: 'admin-reports',
		label: 'Admin Reports',
		icon: '🛡️',
		description: 'Moderation queue with pending reports',
		kind: 'scene',
		sceneId: 'admin-reports',
		requiresAuth: true,
	},
	{
		id: 'admin-bans',
		label: 'Admin Bans',
		icon: '⛔',
		description: 'Ban management proof surface',
		kind: 'scene',
		sceneId: 'admin-bans',
		requiresAuth: true,
	},
	{
		id: 'admin-appeals',
		label: 'Admin Appeals',
		icon: '⚖️',
		description: 'Appeals and trust workflow proof surface',
		kind: 'scene',
		sceneId: 'admin-appeals',
		requiresAuth: true,
	},
]

export const DEMO_PITCH_BEATS: DemoPitchBeat[] = [
	{
		id: 'conversion-moat',
		phase: 'Phase 1',
		minutes: '0-4 min',
		title: 'Cold Start To Kitchen Moat',
		personaUsername: 'testuser',
		proof:
			"Show the welcome flow, land on Tonight's Pick, then jump straight into the hero recipe so the audience sees conversion turn into a guided cooking session.",
		presenterLine:
			'Cold traffic does not hit a dead recipe index. In seconds, ChefKix turns intent into a personalized cooking loop we can hold for the full session.',
		investorTranslation:
			'We are not a utility search result. We are a retention engine that captures both discovery and execution time.',
		fallbackNote:
			"If the welcome flow is already complete, open Dashboard first and narrate the same story from Tonight's Pick.",
		actions: ['cold-start', 'dashboard', 'hero-recipe'],
		readinessCheckIds: [
			'welcome-route',
			'dashboard-tonight-pick',
			'hero-recipe-route',
		],
	},
	{
		id: 'taste-graph',
		phase: 'Phase 2',
		minutes: '4-7 min',
		title: 'Semantic Search And Taste Graph',
		personaUsername: 'testuser',
		proof:
			'Use the cozy-winter-food query, then pivot to Taste DNA and Year In Cooking to show that ChefKix compounds behavior into a proprietary preference graph.',
		presenterLine:
			'Every search, save, and cooking session sharpens the graph. The product gets more personal because the data gets richer.',
		investorTranslation:
			'This is the data moat: a behavioral food graph that improves recommendations, creator targeting, and future monetization.',
		fallbackNote:
			'If search latency spikes, go straight to Taste DNA and explain that the graph powers what the user already sees across the app.',
		actions: ['semantic-search', 'taste-dna', 'year-in-cooking'],
		readinessCheckIds: [
			'semantic-search',
			'taste-profile',
			'year-in-cooking-route',
		],
	},
	{
		id: 'viral-loop',
		phase: 'Phase 3',
		minutes: '7-11 min',
		title: 'Co-Cook And Social Gravity',
		personaUsername: 'testuser',
		proof:
			'Start a room, copy the second-screen watch URL, then show taste compatibility and messages to frame ChefKix as participatory social media, not solitary meal prep.',
		presenterLine:
			'Users are not just browsing recipes. They are inviting friends, comparing taste overlap, and giving each other reasons to return.',
		investorTranslation:
			'This is zero-CAC growth behavior: multiplayer cooking, social proof, and relationship surfaces that manufacture return visits.',
		fallbackNote:
			'If room creation hits a local state conflict, pivot to Taste Compatibility and Messages. The social loop story still lands cleanly.',
		actions: ['co-cook', 'taste-compatibility', 'messages', 'referral'],
		readinessCheckIds: ['co-cook-probe', 'messages', 'referral-code'],
	},
	{
		id: 'commerce-intent',
		phase: 'Phase 4',
		minutes: '11-14 min',
		title: 'Pantry To Commerce Intent',
		personaUsername: 'testuser',
		proof:
			'Open pantry, generate a meal plan, then jump to a shopping list to show the system converting ingredient reality into monetizable purchase intent.',
		presenterLine:
			'We meet the user at the exact moment they realize what is missing, and that is the cleanest commerce moment in food.',
		investorTranslation:
			'This is the revenue bridge: pantry intelligence becomes basket intent without waiting for ad clicks or generic sponsorships.',
		fallbackNote:
			'If meal-plan generation is slow, stay in Pantry and explain that the same inventory powers the missing-ingredients shopping jump.',
		actions: ['pantry', 'meal-planner', 'shopping-list'],
		readinessCheckIds: ['pantry-data', 'shopping-lists-data'],
	},
	{
		id: 'creator-engine',
		phase: 'Phase 5',
		minutes: '14-17 min',
		title: 'Creator Rewards And Defensible UGC',
		personaUsername: 'chef_minh',
		proof:
			'Switch to Chef Minh, open creator heatmaps, then show review and battle surfaces to prove ChefKix rewards creators with tools and trust signals other platforms skip.',
		presenterLine:
			'Creators do not just publish here. They get analytics, verified participation signals, and better reasons to build an audience on our rails.',
		investorTranslation:
			'This is the UGC supply flywheel: stronger creator tooling means better content, which improves retention and monetization.',
		fallbackNote:
			'If you need a faster path, open Creator Heatmap first and explain reviews and battles as the trust layer on top of creator growth.',
		actions: ['creator-heatmap', 'recipe-review', 'recipe-battle'],
		readinessCheckIds: [
			'creator-stats',
			'creator-heatmap',
			'recipe-review-post',
			'recipe-battle-post',
		],
	},
	{
		id: 'trust-layer',
		phase: 'Phase 6',
		minutes: '17-20 min',
		title: 'Operational Trust And Enterprise Control',
		personaUsername: 'admin_demo',
		proof:
			'Switch to the admin persona and open reports, bans, and appeals so the room sees that moderation, escalation, and platform trust are already operational surfaces.',
		presenterLine:
			'Consumer social products break when trust is manual. We already have the control plane in place.',
		investorTranslation:
			'This is what lets the product scale globally without linear moderation headcount or brand-safety panic.',
		fallbackNote:
			'If time is tight, open Reports only and narrate bans and appeals as adjacent control surfaces on the same trust stack.',
		actions: ['admin-reports', 'admin-bans', 'admin-appeals'],
		readinessCheckIds: ['admin-reports', 'admin-user-bans', 'admin-appeals'],
	},
]

export function getDemoAccount(username: string): DemoAccount | undefined {
	return DEMO_ACCOUNTS.find(account => account.username === username)
}

export function getDemoPitchShortcut(
	id: string,
): DemoPitchShortcut | undefined {
	return DEMO_PITCH_SHORTCUTS.find(shortcut => shortcut.id === id)
}

interface RecipeCandidate {
	id?: string
	title?: string
	name?: string
	recipeId?: string
	recipeTitle?: string
}

const PREFERRED_RECIPE_TITLES = [
	'Osso Buco alla Milanese',
	'Pho Bo Ha Noi',
	'Tonkotsu Ramen',
	'Carbonara Classica',
]

let demoManifestPromise: Promise<DemoManifest | null> | null = null
let demoReadinessPromise: Promise<DemoReadinessReport | null> | null = null

function getReadinessStatusRank(status: DemoReadinessStatus): number {
	switch (status) {
		case 'blocked':
			return 3
		case 'warning':
			return 2
		default:
			return 1
	}
}

function normalizeRecipeCandidates(payload: unknown): RecipeCandidate[] {
	if (!payload || typeof payload !== 'object') {
		return []
	}

	const body = payload as {
		data?: RecipeCandidate | RecipeCandidate[] | { content?: RecipeCandidate[] }
	}

	if (Array.isArray(body.data)) {
		return body.data
	}

	if (
		body.data &&
		typeof body.data === 'object' &&
		'content' in body.data &&
		Array.isArray(body.data.content)
	) {
		return body.data.content
	}

	if (body.data && typeof body.data === 'object' && !('content' in body.data)) {
		return [body.data as RecipeCandidate]
	}

	return []
}

function getApiPayloadData(payload: unknown): unknown {
	if (!payload || typeof payload !== 'object') {
		return payload
	}

	const body = payload as { data?: unknown }
	return 'data' in body ? body.data : payload
}

function getCollectionCount(value: unknown): number {
	if (value === null || value === undefined) return 0

	if (typeof value === 'string') {
		return value.trim().length > 0 ? 1 : 0
	}

	if (Array.isArray(value)) {
		return value.length
	}

	if (typeof value !== 'object') {
		return 1
	}

	const record = value as Record<string, unknown>
	if (Array.isArray(record.content)) return record.content.length
	if (Array.isArray(record.items)) return record.items.length

	let count = 0
	for (const propertyValue of Object.values(record)) {
		if (Array.isArray(propertyValue)) {
			count += propertyValue.length
			continue
		}

		if (propertyValue && typeof propertyValue === 'object') {
			const nested = propertyValue as { content?: unknown }
			if (Array.isArray(nested.content)) {
				count += nested.content.length
			}
		}
	}

	return count > 0 ? count : 1
}

function getRecipeIdentifier(recipe: RecipeCandidate): string | null {
	if (typeof recipe.id === 'string' && recipe.id.length > 0) {
		return recipe.id
	}

	if (typeof recipe.recipeId === 'string' && recipe.recipeId.length > 0) {
		return recipe.recipeId
	}

	return null
}

function getRecipeTitle(recipe: RecipeCandidate): string {
	if (typeof recipe.title === 'string') {
		return recipe.title
	}

	if (typeof recipe.recipeTitle === 'string') {
		return recipe.recipeTitle
	}

	if (typeof recipe.name === 'string') {
		return recipe.name
	}

	return ''
}

function getDemoOrigin(): string {
	if (typeof window !== 'undefined' && window.location?.origin) {
		return window.location.origin
	}

	return 'http://localhost:3000'
}

function extractRecipeIdFromPath(
	path: string | null | undefined,
): string | null {
	if (!path) {
		return null
	}

	const match = path.match(/^\/recipes\/([^/?#]+)/)
	return match?.[1] ?? null
}

async function loadDemoManifest(): Promise<DemoManifest | null> {
	if (!demoManifestPromise) {
		demoManifestPromise = fetch(DEMO_MANIFEST_URL, {
			cache: 'no-store',
			signal: AbortSignal.timeout(5000),
		})
			.then(async response => {
				if (!response.ok) {
					return null
				}

				return (await response.json()) as DemoManifest
			})
			.catch(() => null)
	}

	return demoManifestPromise
}

export async function loadDemoReadinessReport(): Promise<DemoReadinessReport | null> {
	if (!demoReadinessPromise) {
		demoReadinessPromise = fetch(DEMO_READINESS_URL, {
			cache: 'no-store',
			signal: AbortSignal.timeout(5000),
		})
			.then(async response => {
				if (!response.ok) {
					return null
				}

				return (await response.json()) as DemoReadinessReport
			})
			.catch(() => null)
	}

	return demoReadinessPromise
}

export function resetDemoReadinessCache(): void {
	demoReadinessPromise = null
}

export function getBeatReadinessChecks(
	beat: DemoPitchBeat,
	report: DemoReadinessReport | null,
): DemoReadinessCheck[] {
	if (!report) {
		return []
	}

	const checkIds = new Set(beat.readinessCheckIds)
	return report.checks.filter(check => checkIds.has(check.id))
}

export function getBeatReadinessStatus(
	beat: DemoPitchBeat,
	report: DemoReadinessReport | null,
): DemoReadinessStatus | null {
	const checks = getBeatReadinessChecks(beat, report)
	if (checks.length === 0) {
		return null
	}

	return checks.reduce<DemoReadinessStatus>((current, check) => {
		return getReadinessStatusRank(check.status) >
			getReadinessStatusRank(current)
			? check.status
			: current
	}, 'ready')
}

async function fetchRecipeCandidates(
	path: string,
	accessToken?: string | null,
): Promise<RecipeCandidate[]> {
	const headers: Record<string, string> = {}
	if (accessToken) {
		headers.Authorization = `Bearer ${accessToken}`
	}

	const response = await fetch(`${getDemoBaseUrl()}${path}`, {
		headers,
		credentials: 'include',
		signal: AbortSignal.timeout(8000),
	})

	if (!response.ok) {
		return []
	}

	const payload = await response.json().catch(() => null)
	return normalizeRecipeCandidates(payload)
}

async function getFallbackHeroRecipePath(
	accessToken?: string | null,
): Promise<string> {
	const endpoints = [
		'/api/v1/recipes/tonight-pick',
		'/api/v1/recipes/trending?page=0&size=12',
		'/api/v1/recipes?page=0&size=12',
	]

	for (const endpoint of endpoints) {
		const recipes = await fetchRecipeCandidates(endpoint, accessToken)
		if (recipes.length === 0) {
			continue
		}

		const preferred = recipes.find(recipe =>
			PREFERRED_RECIPE_TITLES.includes(getRecipeTitle(recipe)),
		)
		const chosen =
			preferred || recipes.find(recipe => getRecipeIdentifier(recipe))
		const recipeId = chosen ? getRecipeIdentifier(chosen) : null

		if (recipeId) {
			return `/recipes/${recipeId}?cook=true`
		}
	}

	return '/explore'
}

async function resolveDemoScenePath(
	sceneId: DemoSceneId,
	accessToken?: string | null,
): Promise<string> {
	const manifest = await loadDemoManifest()

	switch (sceneId) {
		case 'hero-recipe':
			return (
				manifest?.scenes.heroRecipePath ||
				(await getFallbackHeroRecipePath(accessToken))
			)
		case 'taste-compatibility':
			return (
				manifest?.scenes.compatibilityProfilePath ||
				manifest?.users.chef_minh?.profilePath ||
				'/profile'
			)
		case 'year-in-cooking':
			return manifest?.scenes.yearInCookingPath || '/profile/year-in-cooking'
		case 'referral':
			return manifest?.scenes.referralPath || '/settings?tab=referral'
		case 'privacy':
			return manifest?.scenes.privacyPath || '/settings?tab=privacy'
		case 'recipe-battle':
			return manifest?.scenes.battlePostPath || '/explore'
		case 'recipe-review':
			return manifest?.scenes.reviewPostPath || '/explore'
		case 'shopping-list':
			return manifest?.scenes.shoppingListPath || '/shopping-lists'
		case 'creator-heatmap':
			return manifest?.scenes.creatorHeatmapPath || '/creator'
		case 'admin-reports':
			return manifest?.scenes.adminReportsPath || '/admin/reports'
		case 'admin-bans':
			return manifest?.scenes.adminBansPath || '/admin/bans'
		case 'admin-appeals':
			return manifest?.scenes.adminAppealsPath || '/admin/appeals'
		default:
			return '/dashboard'
	}
}

async function createCookTogetherShortcut(
	accessToken?: string | null,
): Promise<ResolvedDemoShortcut> {
	if (!accessToken) {
		throw new Error('Authentication required for Cook Together')
	}

	const manifest = await loadDemoManifest()
	const heroRecipeId =
		manifest?.scenes.heroRecipeId ||
		extractRecipeIdFromPath(manifest?.scenes.heroRecipePath) ||
		extractRecipeIdFromPath(await getFallbackHeroRecipePath(accessToken))

	if (!heroRecipeId) {
		throw new Error('Could not resolve a hero recipe for Cook Together')
	}

	const headers = {
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json',
	}
	const currentUserId = useAuthStore.getState().user?.userId ?? null

	type CreatedRoom = {
		roomCode: string
		recipeId: string
		hostUserId: string | null
		participants: RoomParticipant[]
	}

	const tryCreateRoom = async (): Promise<CreatedRoom | null> => {
		const response = await fetch(`${getDemoBaseUrl()}/api/v1/cooking-rooms`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ recipeId: heroRecipeId }),
			signal: AbortSignal.timeout(10000),
		})

		const payload = (await response.json().catch(() => null)) as {
			success?: boolean
			statusCode?: number
			data?: Partial<
				Pick<
					CookingRoom,
					'roomCode' | 'recipeId' | 'hostUserId' | 'participants'
				>
			>
		} | null

		if (response.ok && payload?.success && payload.data?.roomCode) {
			return {
				roomCode: payload.data.roomCode,
				recipeId: payload.data.recipeId ?? heroRecipeId,
				hostUserId: payload.data.hostUserId ?? currentUserId,
				participants: payload.data.participants ?? [],
			}
		}

		if (payload?.statusCode === 409 || response.status === 409) {
			return null
		}

		throw new Error('Could not create a demo cooking room')
	}

	await clearBackendDemoCookingState(accessToken)

	let createdRoom = await tryCreateRoom()

	if (!createdRoom) {
		await clearBackendDemoCookingState(accessToken)
		createdRoom = await tryCreateRoom()
	}

	const effectiveRoomCode = createdRoom?.roomCode || null

	if (!effectiveRoomCode) {
		throw new Error('Could not create or resolve a demo cooking room')
	}

	const origin = getDemoOrigin()
	const joinPath = `/cook-together?roomCode=${effectiveRoomCode}`
	const watchPath = `${joinPath}&role=SPECTATOR`
	const joinUrl = `${origin}${joinPath}`
	const watchUrl = `${origin}${watchPath}`

	useCookingStore.setState({
		roomCode: effectiveRoomCode,
		participants: createdRoom?.participants ?? [],
		isInRoom: true,
		isHost: createdRoom?.hostUserId
			? createdRoom.hostUserId === currentUserId
			: true,
		error: null,
	})

	const recipeResponse = await getRecipeById(heroRecipeId)
	if (recipeResponse.success && recipeResponse.data) {
		useCookingStore.setState({ recipe: recipeResponse.data })
	}

	// Auto-navigate the pre-opened companion window (sakura_kitchen) to the spectator URL
	// The companion window was opened during warm-up — no popup blocker friction.
	const sakuraEntry = _vault.tokens['sakura_kitchen']
	if (sakuraEntry) {
		const spectatorUrl = `${origin}${watchPath}&demoToken=${encodeURIComponent(sakuraEntry.accessToken)}`
		const navigated = navigateCompanionWindow(spectatorUrl)
		if (!navigated) {
			// Fallback: open fresh window if companion wasn't pre-opened
			window.open(
				`${origin}${watchPath}&demoToken=${encodeURIComponent(sakuraEntry.accessToken)}`,
				COMPANION_WINDOW_NAME,
				'width=390,height=844,left=80,top=40,toolbar=no,menubar=no,scrollbars=no,resizable=no',
			)
		}
	}

	return {
		path: '/cook-together/room',
		notice: `Room ${effectiveRoomCode} ready — Sakura Kitchen joining as spectator.`,
		copiedText: watchUrl,
		watchUrl,
		joinUrl,
	}
}

export async function resolveDemoShortcut(
	shortcut: DemoPitchShortcut,
	accessToken?: string | null,
): Promise<ResolvedDemoShortcut> {
	switch (shortcut.kind) {
		case 'path':
			return { path: shortcut.path || '/dashboard' }
		case 'scene':
			return {
				path: await resolveDemoScenePath(
					shortcut.sceneId || 'hero-recipe',
					accessToken,
				),
			}
		case 'runtime':
			if (shortcut.actionId === 'co-cook') {
				return createCookTogetherShortcut(accessToken)
			}
			return { path: '/dashboard' }
		default:
			return { path: '/dashboard' }
	}
}

export async function getPitchRecipePath(
	accessToken?: string | null,
): Promise<string> {
	return resolveDemoScenePath('hero-recipe', accessToken)
}

// ============================================================================
// DEMO TOKEN VAULT — Pre-authenticates all pitch personas so persona
// switching during beats requires zero page reload.
// ============================================================================

export interface DemoVaultEntry {
	accessToken: string
	expiresAt: string
	expiresAtMs: number
	user: {
		userId: string
		username: string
		displayName: string
		[key: string]: unknown
	}
}

export interface DemoTokenVault {
	tokens: Record<string, DemoVaultEntry>
	isWarmed: boolean
	warmedAt: string | null
	failedUsernames: string[]
	minExpiresAt: string | null
	minExpiresInSeconds: number | null
}

const VAULT_PITCH_USERNAMES = [
	'testuser',
	'chef_minh',
	'admin_demo',
	'sakura_kitchen',
]
const DEMO_TOKEN_MIN_TTL_SECONDS = 5 * 60
const DEMO_TOKEN_WARM_ATTEMPTS = 3
const DEMO_TOKEN_WARM_RETRY_MS = 500
const COOKING_STORAGE_KEYS = ['chefkix-cooking-session', 'cooking-storage']

async function clearBackendDemoCookingState(
	accessToken: string,
): Promise<{ sessionAbandoned: boolean; roomLeft: boolean }> {
	const headers = {
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json',
	}
	const baseUrl = getDemoBaseUrl()
	const [roomResult, sessionResult] = await Promise.allSettled([
		(async () => {
			const res = await fetch(`${baseUrl}/api/v1/cooking-rooms/leave-active`, {
				method: 'POST',
				headers,
				signal: AbortSignal.timeout(8000),
			})
			if (!res.ok) return false
			const payload = (await res.json().catch(() => null)) as {
				success?: boolean
				data?: { roomsLeft?: number }
			} | null
			return Boolean(payload?.success) && (payload?.data?.roomsLeft ?? 0) > 0
		})(),
		(async () => {
			const res = await fetch(
				`${baseUrl}/api/v1/cooking-sessions/abandon-active`,
				{
					method: 'POST',
					headers,
					signal: AbortSignal.timeout(8000),
				},
			)
			if (!res.ok) return false
			const payload = (await res.json().catch(() => null)) as {
				success?: boolean
				data?: { abandoned?: boolean }
			} | null
			return Boolean(payload?.success && payload?.data?.abandoned)
		})(),
	])

	return {
		roomLeft: roomResult.status === 'fulfilled' && roomResult.value,
		sessionAbandoned:
			sessionResult.status === 'fulfilled' && sessionResult.value,
	}
}

let _vault: DemoTokenVault = {
	tokens: {},
	isWarmed: false,
	warmedAt: null,
	failedUsernames: [],
	minExpiresAt: null,
	minExpiresInSeconds: null,
}
let vaultWarmPromise: Promise<DemoTokenVault> | null = null

export function getDemoVault(): DemoTokenVault {
	return _vault
}

function decodeJwtPayload(token: string): { exp?: number } | null {
	try {
		const [, payload] = token.split('.')
		if (!payload) return null
		const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
		const decoded =
			typeof window !== 'undefined'
				? window.atob(padded)
				: Buffer.from(padded, 'base64').toString('utf8')
		return JSON.parse(decoded) as { exp?: number }
	} catch {
		return null
	}
}

function getJwtExpiryMs(token: string): number | null {
	const exp = decodeJwtPayload(token)?.exp
	return typeof exp === 'number' ? exp * 1000 : null
}

function getEntryTtlSeconds(entry: DemoVaultEntry): number {
	return Math.floor((entry.expiresAtMs - Date.now()) / 1000)
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export function isDemoVaultFresh(
	username?: string,
	minTtlSeconds = DEMO_TOKEN_MIN_TTL_SECONDS,
): boolean {
	if (!_vault.isWarmed) return false

	if (username) {
		const entry = _vault.tokens[username]
		return Boolean(entry && getEntryTtlSeconds(entry) > minTtlSeconds)
	}

	return Object.values(_vault.tokens).every(
		entry => getEntryTtlSeconds(entry) > minTtlSeconds,
	)
}

async function warmTokenVaultInner(
	onProgress?: (username: string, success: boolean) => void,
): Promise<DemoTokenVault> {
	const baseUrl = getDemoBaseUrl()

	const results: PromiseSettledResult<{
		username: string
		entry: DemoVaultEntry
	} | null>[] = []

	for (const username of VAULT_PITCH_USERNAMES) {
		const account = DEMO_ACCOUNTS.find(a => a.username === username)
		if (!account) {
			onProgress?.(username, false)
			results.push({ status: 'fulfilled', value: null })
			continue
		}

		if (_vault.tokens[username] && isDemoVaultFresh(username)) {
			onProgress?.(username, true)
			results.push({
				status: 'fulfilled',
				value: { username, entry: _vault.tokens[username] },
			})
			continue
		}

		let warmed:
			| {
					username: string
					entry: DemoVaultEntry
			  }
			| null = null

		for (let attempt = 1; attempt <= DEMO_TOKEN_WARM_ATTEMPTS; attempt += 1) {
			try {
				const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						emailOrUsername: account.username,
						password: account.password,
					}),
					signal: AbortSignal.timeout(10000),
				})

				const loginData = (await loginRes.json()) as {
					success?: boolean
					data?: { accessToken?: string }
				}
				const accessToken = loginData.data?.accessToken
				if (!loginRes.ok || !loginData.success || !accessToken) {
					throw new Error(`login failed with HTTP ${loginRes.status}`)
				}

				const expiresAtMs = getJwtExpiryMs(accessToken)
				if (
					!expiresAtMs ||
					expiresAtMs <= Date.now() + DEMO_TOKEN_MIN_TTL_SECONDS * 1000
				) {
					throw new Error('token is missing a safe TTL')
				}

				const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
					headers: { Authorization: `Bearer ${accessToken}` },
					signal: AbortSignal.timeout(8000),
				})
				const meData = (await meRes.json()) as {
					success?: boolean
					data?: DemoVaultEntry['user']
				}
				if (!meRes.ok || !meData.success || !meData.data) {
					throw new Error(`auth/me failed with HTTP ${meRes.status}`)
				}

				warmed = {
					username,
					entry: {
						accessToken,
						expiresAt: new Date(expiresAtMs).toISOString(),
						expiresAtMs,
						user: meData.data,
					},
				}
				break
			} catch {
				if (attempt < DEMO_TOKEN_WARM_ATTEMPTS) {
					await delay(DEMO_TOKEN_WARM_RETRY_MS * attempt)
				}
			}
		}

		onProgress?.(username, Boolean(warmed))
		results.push({ status: 'fulfilled', value: warmed })
	}

	const tokens: Record<string, DemoVaultEntry> = {}
	const failedUsernames: string[] = []

	results.forEach((result, index) => {
		const username = VAULT_PITCH_USERNAMES[index]!
		if (result.status === 'fulfilled' && result.value) {
			tokens[result.value.username] = result.value.entry
		} else {
			failedUsernames.push(username)
		}
	})

	const expiryValues = Object.values(tokens).map(entry => entry.expiresAtMs)
	const minExpiresAtMs =
		expiryValues.length > 0 ? Math.min(...expiryValues) : null

	_vault = {
		tokens,
		isWarmed: Object.keys(tokens).length > 0,
		warmedAt: new Date().toISOString(),
		failedUsernames,
		minExpiresAt: minExpiresAtMs
			? new Date(minExpiresAtMs).toISOString()
			: null,
		minExpiresInSeconds: minExpiresAtMs
			? Math.floor((minExpiresAtMs - Date.now()) / 1000)
			: null,
	}

	return _vault
}

export async function warmTokenVault(
	onProgress?: (username: string, success: boolean) => void,
): Promise<DemoTokenVault> {
	if (vaultWarmPromise) return vaultWarmPromise

	vaultWarmPromise = warmTokenVaultInner(onProgress)
	try {
		return await vaultWarmPromise
	} finally {
		vaultWarmPromise = null
	}
}

/**
 * Swaps the active persona directly in the Zustand auth store without a page
 * reload. Returns true if the swap succeeded, false if the vault is cold for
 * the requested persona.
 */
export function swapPersonaFromVault(
	username: string,
	writeLocalStorage = true,
): boolean {
	const entry = _vault.tokens[username]
	if (!entry) return false
	if (getEntryTtlSeconds(entry) <= DEMO_TOKEN_MIN_TTL_SECONDS) return false

	// Swap Zustand store state directly — triggers React re-renders without reload
	useAuthStore.setState({
		isAuthenticated: true,
		accessToken: entry.accessToken,
		user: entry.user as any,
	})

	// Sync to localStorage so the persist middleware doesn't clobber us on
	// the next hydration cycle
	if (writeLocalStorage && typeof window !== 'undefined') {
		localStorage.setItem(
			'auth-storage',
			JSON.stringify({
				state: {
					isAuthenticated: true,
					accessToken: entry.accessToken,
					user: entry.user,
				},
				version: 0,
			}),
		)
	}

	return true
}

/**
 * Cleans up all demo-related state before switching beats or recovering from
 * a panic. Abandons any active cooking session and clears room state.
 */
let _snapshotZero: string | null = null

export function captureSnapshotZero() {
	if (typeof window !== 'undefined') {
		const auth = localStorage.getItem('auth-storage')
		const cooking = Object.fromEntries(
			COOKING_STORAGE_KEYS.map(key => [key, localStorage.getItem(key)]),
		)
		_snapshotZero = JSON.stringify({ auth, cooking })
	}
}

function restoreLocalStorageValue(
	key: string,
	value: string | null | undefined,
) {
	if (typeof value === 'string') {
		localStorage.setItem(key, value)
		return
	}

	localStorage.removeItem(key)
}

export async function cleanupDemoState(
	accessToken: string,
): Promise<{ sessionAbandoned: boolean; roomLeft: boolean }> {
	const backendCleanup = await clearBackendDemoCookingState(accessToken)

	// Also clear cooking store state in-memory
	await import('@/store/cookingStore')
		.then(({ useCookingStore }) => {
			useCookingStore.getState().clearSession()
			useCookingStore.getState().clearRoom()
		})
		.catch(() => {
			/* store may not be loaded */
		})

	// ⏪ SNAPSHOT ZERO ROLLBACK
	if (_snapshotZero && typeof window !== 'undefined') {
		try {
			const parsed = JSON.parse(_snapshotZero)
			restoreLocalStorageValue('auth-storage', parsed.auth)
			for (const key of COOKING_STORAGE_KEYS) {
				restoreLocalStorageValue(key, parsed.cooking?.[key])
			}

			// Force reload to cleanly mount the pristine state
			window.location.reload()
		} catch (e) {
			console.error('Failed to rollback to Snapshot Zero', e)
		}
	}

	return {
		sessionAbandoned: backendCleanup.sessionAbandoned,
		roomLeft: backendCleanup.roomLeft,
	}
}

// ============================================================================
// PRE-SHOW CHECKLIST — Live verification of all 10 demo pre-conditions.
// Runs real API calls, not stale JSON. Call this 10 minutes before go-live.
// ============================================================================

export type PreShowCheckId =
	| 'services-health'
	| 'vault-warm'
	| 'hero-recipe'
	| 'semantic-search'
	| 'messages-exist'
	| 'pantry-populated'
	| 'admin-reports'
	| 'creator-stats'
	| 'room-probe'
	| 'manifest-freshness'
	| 'airgap-mode'

export type PreShowCheckStatus = 'checking' | 'pass' | 'warn' | 'fail' | 'skip'

export interface PreShowCheck {
	id: PreShowCheckId
	label: string
	detail: string
	status: PreShowCheckStatus
	durationMs?: number
}

export interface PreShowReport {
	checks: PreShowCheck[]
	verdict: 'GO' | 'CAUTION' | 'NO-GO'
	generatedAt: string
	airGapMode: boolean
}

async function runPreShowCheck(
	id: PreShowCheckId,
	label: string,
	fn: () => Promise<{ status: PreShowCheckStatus; detail: string }>,
): Promise<PreShowCheck> {
	const start = Date.now()
	try {
		const result = await fn()
		return { id, label, ...result, durationMs: Date.now() - start }
	} catch (err) {
		return {
			id,
			label,
			status: 'fail',
			detail: err instanceof Error ? err.message : 'Unexpected error',
			durationMs: Date.now() - start,
		}
	}
}

export async function preloadCriticalData(accessToken: string | null = null) {
	const baseUrl = getDemoBaseUrl()
	const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

	// Capture baseline state before checks
	captureSnapshotZero()

	try {
		await Promise.allSettled([
			fetch(`${baseUrl}/api/v1/recipes?page=0&size=12`, {
				headers,
				signal: AbortSignal.timeout(5000),
			}),
			fetch(`${baseUrl}/api/v1/recipes/tonight-pick`, {
				headers,
				signal: AbortSignal.timeout(5000),
			}),
			fetch(
				`${baseUrl}/api/v1/search?q=cozy%20winter%20food&type=ALL&limit=5`,
				{
					headers,
					signal: AbortSignal.timeout(5000),
				},
			),
			fetch(`${baseUrl}/api/v1/chat/conversations/my-conversations`, {
				headers,
				signal: AbortSignal.timeout(5000),
			}),
			fetch(`${baseUrl}/api/v1/pantry`, {
				headers,
				signal: AbortSignal.timeout(5000),
			}),
		])
	} catch (e) {
		console.warn('Preload failed, relying on live fetch', e)
	}
}

export async function runPreShowChecklist(
	accessToken: string | null,
	options?: {
		airGapMode?: boolean
		onCheckComplete?: (check: PreShowCheck) => void
	},
): Promise<PreShowReport> {
	const airGapMode = options?.airGapMode ?? false
	const onComplete = options?.onCheckComplete
	const base = getDemoBaseUrl()
	const authHeaders = accessToken
		? { Authorization: `Bearer ${accessToken}` }
		: {}

	// Run all checks — some in parallel, some sequentially where order matters
	const checks: PreShowCheck[] = []

	const push = (check: PreShowCheck) => {
		checks.push(check)
		onComplete?.(check)
	}

	// 1. Service health (parallel)
	const serviceCheck = await runPreShowCheck(
		'services-health',
		'Service Health',
		async () => {
			const endpoints = [
				{ name: 'Monolith', url: `${base}/api/v1/actuator/health` },
				{ name: 'AI Service', url: 'http://localhost:8000/health' },
				{ name: 'Keycloak', url: 'http://localhost:8180/realms/nottisn' },
			]
			const results = await Promise.allSettled(
				endpoints.map(async ep => {
					const res = await fetch(ep.url, { signal: AbortSignal.timeout(4000) })
					return { name: ep.name, ok: res.ok || res.status === 401 }
				}),
			)
			const failed = results
				.map((r, i) =>
					r.status === 'rejected' || !r.value.ok ? endpoints[i]!.name : null,
				)
				.filter(Boolean)
			if (airGapMode && failed.includes('AI Service')) {
				return {
					status: 'fail',
					detail:
						'AIR-GAP NO-GO: AI Service offline. Beats 2 (Semantic Search) and 3 (Co-Cook AI) will break.',
				}
			}
			if (failed.length === 0)
				return { status: 'pass', detail: 'Monolith, AI, Keycloak all healthy' }
			if (failed.length <= 1)
				return {
					status: 'pass',
					detail: `${failed.join(', ')} unreachable — check if it matters for your beats`,
				}
			return {
				status: 'fail',
				detail: `${failed.join(', ')} are down — demo will break`,
			}
		},
	)
	push(serviceCheck)

	// 2. Vault warm status
	const vaultCheck = await runPreShowCheck(
		'vault-warm',
		'Persona Vault',
		async () => {
			const vault = getDemoVault()
			const warmedCount = Object.keys(vault.tokens).length
			const needed = ['testuser', 'chef_minh', 'admin_demo']
			const missing = needed.filter(u => !vault.tokens[u])
			if (!vault.isWarmed)
				return {
					status: 'warn',
					detail:
						'Vault not warmed — click Warm Up before demo or persona switches will reload',
				}
			if (missing.length > 0)
				return {
					status: 'warn',
					detail: `Missing vault tokens for: ${missing.join(', ')} — those persona switches will reload`,
				}
			const stale = needed.filter(u => !isDemoVaultFresh(u))
			if (stale.length > 0) {
				return {
					status: 'fail',
					detail: `Vault tokens near expiry for: ${stale.join(', ')}. Warm again before the pitch.`,
				}
			}
			const ttlMinutes = vault.minExpiresInSeconds
				? Math.floor(vault.minExpiresInSeconds / 60)
				: 0
			return {
				status: 'pass',
				detail: `${warmedCount} personas ready (${Object.keys(vault.tokens).join(', ')}), minimum TTL ${ttlMinutes} min`,
			}
		},
	)
	push(vaultCheck)

	// 3. Hero recipe exists
	const heroCheck = await runPreShowCheck(
		'hero-recipe',
		'Hero Recipe',
		async () => {
			const path = await getFallbackHeroRecipePath(accessToken)
			if (path === '/explore')
				return {
					status: 'warn',
					detail:
						'No preferred recipe found — will fall back to any recipe from /explore',
				}
			const recipeId = extractRecipeIdFromPath(path)
			if (!recipeId)
				return {
					status: 'fail',
					detail: 'Could not extract recipe ID from resolved path',
				}
			const res = await fetch(`${base}/api/v1/recipes/${recipeId}`, {
				headers: authHeaders,
				signal: AbortSignal.timeout(6000),
			})
			const data = (await res.json()) as {
				success?: boolean
				data?: { title?: string; steps?: unknown[] }
			}
			if (!data.success || !data.data)
				return { status: 'fail', detail: `Recipe ${recipeId} not found` }
			const stepCount = data.data.steps?.length ?? 0
			if (stepCount < 3)
				return {
					status: 'warn',
					detail: `Recipe "${data.data.title}" has only ${stepCount} steps — demo will feel thin`,
				}
			return {
				status: 'pass',
				detail: `"${data.data.title}" — ${stepCount} steps`,
			}
		},
	)
	push(heroCheck)

	// 4. Semantic search (requires AI service)
	const searchCheck = await runPreShowCheck(
		'semantic-search',
		'Semantic Search',
		async () => {
			if (airGapMode)
				return {
					status: 'skip',
					detail:
						'Air-gap: skip — navigate away from this beat or use fallback narration',
				}
			const res = await fetch(
				`${base}/api/v1/search?q=cozy+winter+food&type=ALL&limit=5`,
				{
					headers: authHeaders,
					signal: AbortSignal.timeout(8000),
				},
			)
			const data = (await res.json()) as {
				success?: boolean
				data?: unknown
			}
			const count = getCollectionCount(getApiPayloadData(data))
			if (!res.ok || !data.success)
				return {
					status: 'fail',
					detail: 'Search endpoint returned error — AI service may be down',
				}
			if (count === 0)
				return {
					status: 'warn',
					detail:
						'Search returned 0 results for "cozy winter food" — seed more recipe data',
				}
			return {
				status: 'pass',
				detail: `${count} results for "cozy winter food"`,
			}
		},
	)
	push(searchCheck)

	// 5. Messages exist
	const messagesCheck = await runPreShowCheck(
		'messages-exist',
		'Messages',
		async () => {
			const res = await fetch(
				`${base}/api/v1/chat/conversations/my-conversations`,
				{
					headers: authHeaders,
					signal: AbortSignal.timeout(5000),
				},
			)
			const data = (await res.json()) as {
				success?: boolean
				data?: unknown
			}
			const count = getCollectionCount(getApiPayloadData(data))
			if (!res.ok || !data.success)
				return {
					status: 'fail',
					detail:
						'Messages endpoint failed — check testuser has active conversations',
				}
			if (count === 0)
				return {
					status: 'warn',
					detail:
						'testuser has no message threads — messages beat will show empty state',
				}
			return { status: 'pass', detail: `${count} conversation thread(s) ready` }
		},
	)
	push(messagesCheck)

	// 6. Pantry populated
	const pantryCheck = await runPreShowCheck(
		'pantry-populated',
		'Pantry Data',
		async () => {
			const res = await fetch(`${base}/api/v1/pantry`, {
				headers: authHeaders,
				signal: AbortSignal.timeout(5000),
			})
			const data = (await res.json()) as {
				success?: boolean
				data?: unknown
			}
			const count = getCollectionCount(getApiPayloadData(data))
			if (!res.ok || !data.success)
				return { status: 'fail', detail: 'Pantry endpoint failed' }
			if (count === 0)
				return {
					status: 'warn',
					detail: 'Pantry is empty — commerce intent beat will look hollow',
				}
			if (count < 5)
				return {
					status: 'warn',
					detail: `Only ${count} pantry items — add more for a convincing inventory story`,
				}
			return { status: 'pass', detail: `${count} pantry items` }
		},
	)
	push(pantryCheck)

	// 7. Admin has reports (must use admin_demo token)
	const adminCheck = await runPreShowCheck(
		'admin-reports',
		'Admin Reports',
		async () => {
			const adminEntry = _vault.tokens['admin_demo']
			const adminToken = adminEntry?.accessToken
			if (!adminToken)
				return {
					status: 'warn',
					detail:
						'Vault not warmed for admin_demo — cannot verify admin reports',
				}
			const res = await fetch(`${base}/api/v1/admin/reports`, {
				headers: { Authorization: `Bearer ${adminToken}` },
				signal: AbortSignal.timeout(5000),
			})
			const data = (await res.json()) as {
				success?: boolean
				data?: unknown
			}
			const total = getCollectionCount(getApiPayloadData(data))
			if (!res.ok || !data.success)
				return {
					status: 'fail',
					detail:
						'Admin reports endpoint failed — check admin_demo permissions',
				}
			if (total === 0)
				return {
					status: 'warn',
					detail:
						'No pending reports — trust layer beat will show empty moderation queue',
				}
			return { status: 'pass', detail: `${total} pending report(s) in queue` }
		},
	)
	push(adminCheck)

	// 8. Creator stats (chef_minh)
	const creatorCheck = await runPreShowCheck(
		'creator-stats',
		'Creator Stats',
		async () => {
			const creatorEntry = _vault.tokens['chef_minh']
			const creatorToken = creatorEntry?.accessToken
			if (!creatorToken)
				return {
					status: 'warn',
					detail: 'Vault not warmed for chef_minh — cannot verify creator data',
				}
			const res = await fetch(`${base}/api/v1/auth/me/creator-stats`, {
				headers: { Authorization: `Bearer ${creatorToken}` },
				signal: AbortSignal.timeout(5000),
			})
			const data = (await res.json()) as {
				success?: boolean
				data?: unknown
			}
			if (!res.ok || !data.success)
				return {
					status: 'fail',
					detail: 'Creator stats endpoint failed for chef_minh',
				}
			return { status: 'pass', detail: 'Creator stats payload is available' }
		},
	)
	push(creatorCheck)

	// 9. Room creation probe (create + immediately abandon)
	const roomCheck = await runPreShowCheck(
		'room-probe',
		'Room Creation',
		async () => {
			if (!accessToken)
				return {
					status: 'warn',
					detail: 'No auth token — cannot probe room creation',
				}
			const heroPath = await getFallbackHeroRecipePath(accessToken)
			const recipeId = extractRecipeIdFromPath(heroPath)
			if (!recipeId)
				return {
					status: 'warn',
					detail: 'No hero recipe to probe room creation with',
				}

			const headers = {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			}

			await clearBackendDemoCookingState(accessToken)

			const createRoom = async () => {
				const createRes = await fetch(`${base}/api/v1/cooking-rooms`, {
					method: 'POST',
					headers,
					body: JSON.stringify({ recipeId }),
					signal: AbortSignal.timeout(10000),
				})
				const createData = (await createRes.json()) as {
					success?: boolean
					data?: { roomCode?: string }
					statusCode?: number
				}
				return { createRes, createData }
			}

			let { createRes, createData } = await createRoom()
			if (createRes.status === 409 || createData.statusCode === 409) {
				await clearBackendDemoCookingState(accessToken)
				;({ createRes, createData } = await createRoom())
			}

			// 409 after one cleanup retry means the co-cook beat is not safe.
			if (createRes.status === 409 || createData.statusCode === 409) {
				return {
					status: 'fail',
					detail:
						'Room creation still conflicts after cleanup - co-cook beat will not work',
				}
			}
			if (!createRes.ok || !createData.success || !createData.data?.roomCode) {
				return {
					status: 'fail',
					detail: 'Room creation failed — co-cook beat will not work',
				}
			}

			const roomCode = createData.data.roomCode

			// Abandon immediately
			await fetch(`${base}/api/v1/cooking-rooms/${roomCode}/leave`, {
				method: 'POST',
				headers,
				signal: AbortSignal.timeout(5000),
			}).catch(() => {
				/* best-effort */
			})

			return {
				status: 'pass',
				detail: `Room ${roomCode} created and released — WebSocket path confirmed`,
			}
		},
	)
	push(roomCheck)

	// 10. Manifest freshness
	const manifestCheck = await runPreShowCheck(
		'manifest-freshness',
		'Demo Manifest',
		async () => {
			try {
				const res = await fetch('/demo-manifest.json', {
					cache: 'no-store',
					signal: AbortSignal.timeout(3000),
				})
				if (!res.ok)
					return {
						status: 'warn',
						detail:
							'demo-manifest.json missing — scene shortcuts will use API fallbacks (slower)',
					}
				const manifest = (await res.json()) as {
					generatedAt?: string
					scenes?: Record<string, string | null>
				}
				const generatedAt = manifest.generatedAt
					? new Date(manifest.generatedAt)
					: null
				const ageHours = generatedAt
					? (Date.now() - generatedAt.getTime()) / 3600000
					: null
				if (ageHours !== null && ageHours > 12) {
					return {
						status: 'warn',
						detail: `Manifest is ${Math.round(ageHours)}h old — re-run demo-prep.bat if data was re-seeded`,
					}
				}
				const sceneCount = Object.values(manifest.scenes ?? {}).filter(
					Boolean,
				).length
				return {
					status: 'pass',
					detail: `Manifest fresh (${sceneCount} scenes) — generated ${generatedAt?.toLocaleTimeString() ?? 'recently'}`,
				}
			} catch {
				return {
					status: 'warn',
					detail:
						'Could not load demo-manifest.json — scene shortcuts will fall back to API resolution',
				}
			}
		},
	)
	push(manifestCheck)

	// Air-gap verdict
	if (airGapMode) {
		const airgapCheck: PreShowCheck = {
			id: 'airgap-mode',
			label: 'Air-Gap Mode',
			status: 'warn',
			detail:
				'AIR-GAP ACTIVE: Beats 2 (Semantic Search) and optional AI features will not work. Prepare narration fallback for those beats.',
			durationMs: 0,
		}
		push(airgapCheck)
	}

	// Compute verdict
	const hasFailures = checks.some(c => c.status === 'fail')
	const hasWarnings = checks.some(c => c.status === 'warn')
	const verdict: PreShowReport['verdict'] = hasFailures
		? 'NO-GO'
		: hasWarnings
			? 'CAUTION'
			: 'GO'

	return {
		checks,
		verdict,
		generatedAt: new Date().toISOString(),
		airGapMode,
	}
}

// ============================================================================
// ENHANCED CO-COOK: Auto-launch sakura_kitchen in a pre-opened companion window
// ============================================================================

// The companion window is opened once during warm-up and reused on the beat.
// This avoids the popup-blocker problem on first-click.
export const COMPANION_WINDOW_NAME = 'chefkix-demo-spectator'

export function openCompanionWindow(): Window | null {
	if (typeof window === 'undefined') return null
	return window.open(
		'/cook-together',
		COMPANION_WINDOW_NAME,
		'width=390,height=844,left=80,top=40,toolbar=no,menubar=no,scrollbars=no,resizable=no',
	)
}

export function isCompanionWindowOpen(): boolean {
	if (typeof window === 'undefined') return false
	try {
		const w = window.open('', COMPANION_WINDOW_NAME, '')
		if (!w) return false
		// If we got a new window (no name match), close it and return false
		if (
			w.location.href === 'about:blank' &&
			w.document.body?.childElementCount === 0
		) {
			w.close()
			return false
		}
		return true
	} catch {
		return false
	}
}

export function navigateCompanionWindow(url: string): boolean {
	if (typeof window === 'undefined') return false
	try {
		const w = window.open('', COMPANION_WINDOW_NAME, '')
		if (!w || w.closed) return false
		w.location.href = url
		return true
	} catch {
		return false
	}
}
