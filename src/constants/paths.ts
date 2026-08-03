export const PATHS = {
	HOME: '/',
	JOIN: '/join',
	DASHBOARD: '/dashboard',
	EXPLORE: '/explore',
	EXPLORE_SEARCH: (query: string) => {
		const normalizedQuery = query.trim()
		return normalizedQuery
			? `/explore?q=${encodeURIComponent(normalizedQuery)}`
			: '/explore'
	},
	SEARCH: '/search',
	FEED: '/feed',
	DISCOVER: '/community',
	COMMUNITY: '/community',
	LEADERBOARD: '/leaderboard',
	MESSAGES: '/messages',
	CREATE: '/create',
	COOK: '/cook',
	CREATE_POST: '/post/new',
	PROFILE: '/profile',
	SETTINGS: '/settings',
	AUTH: {
		SIGN_IN: '/auth/sign-in',
		SIGN_UP: '/auth/sign-up',
		VERIFY_OTP: '/auth/verify-otp',
		GOOGLE_CALLBACK: '/oauth2/callback/google',
	},
	GROUPS: {
		EXPLORE: '/groups',
		MY_GROUPS: '/groups/my',
		DETAIL: (groupId: string) => `/groups/${groupId}`,
		MEMBERS: (groupId: string) => `/groups/${groupId}/members`,
		CREATE: '/groups/create',
		EDIT: (groupId: string) => `/groups/${groupId}/edit`,
	},
}
