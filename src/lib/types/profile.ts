export interface Statistics {
	followerCount: number
	followingCount: number
	// Instagram model: mutual follows = friends (computed, not stored separately)
	recipeCount: number // Recipes created (recipesCreated)
	postCount: number
	favouriteCount: number
	currentLevel: number
	currentXP: number
	currentXPGoal: number // Formula: 25 * level * level (per spec)
	title: 'BEGINNER' | 'AMATEUR' | 'SEMIPRO' | 'PRO'
	streakCount: number // 72-hour cooking streak
	challengeStreak: number // Daily challenge streak
	completionCount: number // Total cooking completions
	reputation: number
	badges?: string[] // Earned badge IDs
	/** Badge name → ISO timestamp when earned. Null for badges earned before tracking was added. */
	badgeTimestamps?: Record<string, string>
	// Social depth
	friendCount?: number // Mutual follow count
	friendRequestCount?: number // Pending friend requests
	// Cooking depth metrics (from BE StatisticResponse)
	recipesCooked?: number // Distinct recipes user has cooked
	recipesMastered?: number // Recipes cooked 5+ times (mastery threshold)
	longestStreak?: number // Historical best streak
	// Temporal XP (leaderboard context)
	xpWeekly?: number // XP earned this week (resets Monday)
	xpMonthly?: number // XP earned this month (resets 1st)
	// Creator stats
	totalCooksOfYourRecipes?: number // Times others cooked your recipes
	xpEarnedAsCreator?: number // XP earned from others cooking your recipes
	weeklyCreatorCooks?: number // Cooks of your recipes this week
	weeklyCreatorXp?: number // Creator XP this week
	// Streak status fields (computed from lastCookAt by backend)
	cookedToday?: boolean // Whether user has cooked within streak window (72h)
	lastCookAt?: string // ISO timestamp of last cooking session completion
	hoursUntilStreakBreaks?: number // Hours remaining until streak breaks (0 if broken)
}

// RelationshipStatus: MUST match BE enum exactly (RelationshipStatus.java)
// Follow relationships are tracked via isFollowing/isFollowedBy booleans, NOT this enum
export type RelationshipStatus =
	| 'SELF' // Viewing own profile
	| 'FRIENDS' // Legacy friendship (mutual follows computed from booleans)
	| 'REQUEST_SENT' // Friend request sent to this user
	| 'REQUEST_RECEIVED' // Friend request received from this user
	| 'NOT_FRIENDS' // No relationship

export interface Profile {
	profileId: string
	userId: string
	email: string
	username: string
	firstName: string
	lastName: string
	dob: string
	displayName: string
	phoneNumber: string | null
	avatarUrl: string
	coverImageUrl?: string
	bio: string
	accountType: 'normal' | 'chef' | 'admin'
	location: string
	preferences: string[]
	statistics: Statistics
	createdAt: string
	updatedAt: string
	// Dynamic fields
	isFollowing?: boolean
	isFollowedBy?: boolean // They follow me (for mutual detection)
	relationshipStatus?: RelationshipStatus
	isBlocked?: boolean // Block status from API
	/** Verified creator badge — from W5.9 */
	isVerified?: boolean
	// ── AI Quota (per spec 15-ai-integration.txt) — NOT in BE yet ──
	/** @notImplemented — requires UserAiQuota entity + daily reset logic */
	aiGenerationsRemaining?: number // Resets daily, default 30
	/** @notImplemented — requires UserAiQuota entity */
	aiQuotaResetAt?: string // ISO8601, next reset timestamp
}

/**
 * Get a human-readable display name for a profile.
 * Uses displayName, falls back to firstName + lastName, then username, then "Unknown User".
 *
 * CRITICAL: Per signup flow, users have firstName, lastName, username, email.
 * displayName is OPTIONAL and often empty. Always use this helper in toasts/messages.
 */
export const getProfileDisplayName = (
	profile: Profile | null | undefined,
): string => {
	if (!profile) return 'Unknown User'

	// 1. Try displayName if it exists and is non-empty
	if (profile.displayName?.trim()) {
		return profile.displayName.trim()
	}

	// 2. Try firstName + lastName
	const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
	if (fullName) {
		return fullName
	}

	// 3. Fall back to username
	if (profile.username?.trim()) {
		return profile.username.trim()
	}

	// 4. Last resort
	return 'Unknown User'
}
