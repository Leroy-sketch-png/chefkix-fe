import { PATHS } from './paths'

// These are routes that do not require authentication.
// Guest users can browse content without signing in.
// Use exact paths for static routes and prefix patterns for dynamic ones.
export const PUBLIC_ROUTES = [
	PATHS.HOME,
	PATHS.AUTH.SIGN_IN,
	PATHS.AUTH.SIGN_UP,
	PATHS.AUTH.VERIFY_OTP,
	PATHS.AUTH.FORGOT_PASSWORD,
	PATHS.AUTH.RESET_PASSWORD,
	PATHS.AUTH.GOOGLE_CALLBACK, // OAuth callback must be public
	PATHS.EXPLORE, // Browse recipes without auth
	PATHS.SEARCH, // Search recipes/users without auth
	PATHS.COMMUNITY, // Community / discover feed
	PATHS.LEADERBOARD, // Leaderboard (backend allows guest GET)
]

// Dynamic route prefixes that don't require authentication (matched with startsWith)
export const PUBLIC_ROUTE_PREFIXES = [
	'/recipes/', // Recipe detail pages: /recipes/[id]
	'/post/', // Single post pages: /post/[id]
	'/shopping-lists/shared/', // Shared shopping list viewer: /shopping-lists/shared/[token]
]

// Routes under public prefixes that MUST still require authentication
const PROTECTED_UNDER_PUBLIC_PREFIX = [
	'/post/new', // Post creation — must be authenticated
]

// These are routes that require authentication
export const PROTECTED_ROUTES = [PATHS.DASHBOARD]

// These are routes that are used for authentication
// Users will be redirected to the dashboard if they are already authenticated
export const AUTH_ROUTES = [PATHS.AUTH.SIGN_IN, PATHS.AUTH.SIGN_UP]

/**
 * Known top-level route segments that are NOT user profile pages.
 * Any single-segment path not in this set is treated as a public /{userId} profile.
 */
const KNOWN_ROUTE_SEGMENTS = new Set([
	'admin',
	'challenges',
	'collections',
	'community',
	'cook-card',
	'cook-together',
	'create',
	'creator',
	'dashboard',
	'discover',
	'explore',
	'feed',
	'friends',
	'groups',
	'leaderboard',
	'meal-planner',
	'messages',
	'notifications',
	'pantry',
	'post',
	'profile',
	'recipes',
	'search',
	'settings',
	'shopping-lists',
	'auth',
	'_dev',
])

/**
 * Check if a given pathname is a public route (exact match or prefix match).
 * Also treats /{userId} dynamic profile pages as public.
 */
export function isPublicRoutePath(pathname: string): boolean {
	if (PUBLIC_ROUTES.includes(pathname)) return true
	// Check prefix matches, but exclude explicitly protected sub-routes
	if (PUBLIC_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
		if (
			PROTECTED_UNDER_PUBLIC_PREFIX.some(
				p => pathname === p || pathname.startsWith(p + '/'),
			)
		) {
			return false
		}
		return true
	}

	// Treat /{userId} as public — any single-segment path that isn't a known route
	const segments = pathname.split('/').filter(Boolean)
	if (segments.length === 1 && !KNOWN_ROUTE_SEGMENTS.has(segments[0])) {
		return true
	}

	return false
}
