import { abandonSession, getCurrentSession } from '@/services/cookingSession'
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

export const DEMO_BASE_URL =
	process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'

const DEMO_MANIFEST_URL = '/demo-manifest.json'

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

async function fetchRecipeCandidates(
	path: string,
	accessToken?: string | null,
): Promise<RecipeCandidate[]> {
	const headers: Record<string, string> = {}
	if (accessToken) {
		headers.Authorization = `Bearer ${accessToken}`
	}

	const response = await fetch(`${DEMO_BASE_URL}${path}`, {
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
		const response = await fetch(`${DEMO_BASE_URL}/api/v1/cooking-rooms`, {
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

	let createdRoom = await tryCreateRoom()

	if (!createdRoom) {
		const currentSessionResponse = await getCurrentSession()
		const currentSessionId = currentSessionResponse.data?.sessionId

		if (currentSessionResponse.success && currentSessionId) {
			await abandonSession(currentSessionId)
			createdRoom = await tryCreateRoom()
		}
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

	return {
		path: '/cook-together/room',
		notice: `Room ${effectiveRoomCode} created. Watch URL copied for second screen.`,
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
