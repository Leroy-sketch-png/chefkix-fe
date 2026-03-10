/**
 * Types for Stream 2: Social Heartbeat features.
 * Friends Cooking Now, Community Proof, Welcome Back.
 */

// ============================================================
// FRIENDS COOKING NOW (GET /cooking-sessions/friends-active)
// ============================================================

export interface ActiveFriend {
	userId: string
	username: string | null
	displayName: string | null
	avatarUrl: string | null
	recipeId: string
	recipeTitle: string
	coverImageUrl: string[]
	currentStep: number
	totalSteps: number
	startedAt: string // ISO8601
	roomCode: string | null
}

export interface FriendCookingActivityResponse {
	friends: ActiveFriend[]
	totalActive: number
}

// ============================================================
// COMMUNITY PROOF (GET /recipes/{id}/social-proof)
// ============================================================

export interface RecentCooker {
	userId: string
	username: string | null
	displayName: string | null
	avatarUrl: string | null
	completedAt: string // ISO8601
}

export interface RecipeSocialProofResponse {
	cookCount: number
	postCount: number
	averageRating: number | null
	recentCookers: RecentCooker[]
}

// ============================================================
// WELCOME BACK (GET /notification/summary-since)
// ============================================================

export interface NotificationSummaryResponse {
	newLikes: number
	newFollowers: number
	newComments: number
	newMentions: number
	challengesAvailable: number
	xpAwarded: number
	levelsGained: number
	badgesEarned: number
	roomInvites: number
	totalNotifications: number
	since: string // ISO8601
}
