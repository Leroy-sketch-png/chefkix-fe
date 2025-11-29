/**
 * Gamification Types
 * Core types for XP, levels, badges, challenges, and cooking sessions
 *
 * XP ARCHITECTURE:
 * - 30% instant on cook completion (immediate dopamine)
 * - 70% locked until post (conversion lever)
 * - 14-day deadline with XP decay
 * - Creator 4% royalty when others cook their recipes
 */

// ============================================
// USER PROGRESSION
// ============================================

export type UserTitle = 'BEGINNER' | 'AMATEUR' | 'SEMIPRO' | 'PRO'

export type LeagueTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'LEGENDARY'

export interface UserStatistics {
	userId: string
	currentLevel: number
	currentXP: number
	currentXPGoal: number // XP needed for next level
	totalXP: number
	title: UserTitle
	streakCount: number // consecutive days cooked
	longestStreak: number
	recipesCooked: number // total distinct recipes cooked
	recipesMastered: number // recipes cooked 5+ times
	recipesCreated: number
	badgeCount: number
	league?: LeagueTier
	leagueRank?: number
}

export interface LevelInfo {
	level: number
	xpRequired: number
	xpTotal: number // cumulative XP at this level
	title: UserTitle
	unlocks?: string[] // features/badges unlocked at this level
}

// ============================================
// XP REWARDS
// ============================================

export interface XPReward {
	amount: number
	source: XPSource
	description?: string
	multiplier?: number
}

// ============================================
// DIFFICULTY
// ============================================

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

// ============================================
// BADGES
// ============================================

export type BadgeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

export type BadgeCategory =
	| 'COOKING' // cooking milestones
	| 'STREAK' // streak achievements
	| 'CHALLENGE' // challenge completions
	| 'CUISINE' // cuisine mastery
	| 'CREATOR' // recipe creation
	| 'SOCIAL' // community engagement
	| 'SPECIAL' // hidden/surprise badges

export interface Badge {
	id: string
	name: string
	description: string
	icon: string // emoji or icon name
	iconEmoji?: string // emoji character for display
	rarity: BadgeRarity
	category: BadgeCategory
	earnedAt?: string // ISO date if earned
	isHidden: boolean // surprise badges
	unlockCriteria: string // human-readable requirement
	progress?: number // 0-100 for progress-based badges
}

// ============================================
// COOKING SESSIONS
// ============================================

export type CookingSessionStatus =
	| 'IN_PROGRESS'
	| 'PAUSED'
	| 'COMPLETED'
	| 'ABANDONED'

export type PendingPostStatus =
	| 'FRESH' // Day 1-3, full XP available
	| 'AGING' // Day 4-10, minor decay warning
	| 'URGENT' // Day 11-13, significant decay
	| 'CRITICAL' // Day 14, expires today
	| 'EXPIRED' // Past deadline, XP lost

export interface Timer {
	id: string
	label: string
	duration: number // seconds
	remaining: number // seconds
	isRunning: boolean
	stepNumber?: number
}

export interface CookingSession {
	id: string
	userId: string
	recipeId: string
	recipe: {
		id: string
		title: string
		imageUrl: string
		totalSteps: number
		estimatedTime: number // minutes
		xpReward: number
	}
	status: CookingSessionStatus
	currentStep: number
	completedSteps: number[]
	startedAt: string
	pausedAt?: string
	completedAt?: string
	timers: Timer[]
	// XP breakdown
	baseXP: number
	bonusXP: number // streak bonus, challenge bonus, etc.
	instantXP: number // 30% unlocked immediately
	pendingXP: number // 70% locked until post
	// Session flags
	isFirstCook: boolean // first time cooking anything
	isFirstCookOfRecipe: boolean // first time cooking THIS recipe
	challengeId?: string // if cooking for a challenge
	pauseCount: number
	idleWarningShown: boolean
}

export interface PendingPost {
	id: string
	sessionId: string
	recipeId: string
	recipe: {
		id: string
		title: string
		imageUrl: string
	}
	completedAt: string
	deadline: string // 14 days from completedAt
	status: PendingPostStatus
	pendingXP: number // original 70%
	currentXP: number // after decay
	decayPercentage: number // 0-100
	daysRemaining: number
	hoursRemaining: number
	isPosted: boolean
	postedAt?: string
}

// ============================================
// XP TRANSACTIONS
// ============================================

export type XPSource =
	| 'COOK_INSTANT' // 30% on completion
	| 'COOK_POST' // 70% on posting
	| 'STREAK_BONUS' // daily streak multiplier
	| 'CHALLENGE_BONUS' // challenge completion
	| 'CREATOR_ROYALTY' // 4% when others cook your recipe
	| 'FIRST_COOK_BONUS' // first ever cook
	| 'MASTERY_BONUS' // recipe mastery milestone
	| 'BADGE_REWARD' // badge unlock XP

export interface XPTransaction {
	id: string
	userId: string
	amount: number
	source: XPSource
	description: string
	recipeId?: string
	sessionId?: string
	createdAt: string
}

// ============================================
// CHALLENGES
// ============================================

export type ChallengeType = 'DAILY' | 'WEEKLY' | 'SPECIAL'

export interface Challenge {
	id: string
	type: ChallengeType
	title: string
	description: string
	icon: string // emoji
	bonusXP: number
	bonusMultiplier?: number // e.g., 1.5 for 50% bonus
	startsAt: string
	endsAt: string
	isCompleted: boolean
	completedAt?: string
	completedWithRecipeId?: string
	// Matching criteria
	cuisineFilter?: string[]
	difficultyFilter?: ('EASY' | 'MEDIUM' | 'HARD')[]
	tagFilter?: string[]
	matchingRecipeCount: number
}

export interface ChallengeStreak {
	currentStreak: number
	targetStreak: number // e.g., 7 for weekly champion
	streakDays: {
		date: string
		completed: boolean
		recipeTitle?: string
	}[]
	nextMilestoneReward?: {
		daysRemaining: number
		badgeName: string
		bonusXP: number
	}
}

// ============================================
// LEADERBOARD
// ============================================

export type LeaderboardType = 'GLOBAL' | 'FRIENDS' | 'LEAGUE'
export type LeaderboardTimeframe = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

export interface LeaderboardEntry {
	rank: number
	userId: string
	username: string
	displayName: string
	avatarUrl: string
	level: number
	xpThisWeek: number
	recipesCooked: number
	streak: number
	// League-specific
	zone?: 'PROMOTION' | 'SAFE' | 'DEMOTION'
	trend?: 'UP' | 'DOWN' | 'STABLE'
}

export interface LeaderboardData {
	type: LeaderboardType
	timeframe: LeaderboardTimeframe
	entries: LeaderboardEntry[]
	myRank?: {
		rank: number
		xpThisWeek: number
		xpToNextRank?: number
	}
	resetAt?: string // when leaderboard resets
}

// ============================================
// CREATOR STATS
// ============================================

export interface CreatorStats {
	totalRecipesPublished: number
	totalCooksOfYourRecipes: number
	xpEarnedAsCreator: number
	topRecipe?: {
		id: string
		title: string
		imageUrl: string
		cookCount: number
		xpGenerated: number
		rating: number
	}
	thisWeek: {
		newCooks: number
		xpEarned: number
		trend: number // percentage change
	}
	recentCooks: {
		userId: string
		username: string
		avatarUrl: string
		recipeId: string
		recipeTitle: string
		xpEarned: number
		cookedAt: string
	}[]
	creatorBadges: Badge[]
}

// ============================================
// NOTIFICATIONS (GAMIFICATION)
// ============================================

export type GamificationNotificationType =
	| 'XP_AWARDED'
	| 'XP_UNLOCKED' // when post made
	| 'LEVEL_UP'
	| 'BADGE_UNLOCKED'
	| 'BADGE_SURPRISE' // hidden badge
	| 'CREATOR_BONUS'
	| 'POST_DEADLINE_NORMAL' // day 5-7
	| 'POST_DEADLINE_URGENT' // day 12-14
	| 'STREAK_WARNING'
	| 'STREAK_LOST'
	| 'CHALLENGE_REMINDER'
	| 'CHALLENGE_COMPLETE'

export interface GamificationNotification {
	id: string
	type: GamificationNotificationType
	title: string
	body: string
	data: {
		xpAmount?: number
		newLevel?: number
		badgeId?: string
		badgeName?: string
		recipeId?: string
		recipeTitle?: string
		daysRemaining?: number
		hoursRemaining?: number
		pendingXP?: number
		streakCount?: number
		challengeTitle?: string
	}
	read: boolean
	createdAt: string
}

// ============================================
// MASTERY SYSTEM
// ============================================

export type MasteryLevel =
	| 'NOVICE' // 1 cook
	| 'FAMILIAR' // 2 cooks
	| 'PRACTICED' // 3 cooks
	| 'SKILLED' // 4 cooks
	| 'MASTERED' // 5+ cooks

export interface RecipeMastery {
	recipeId: string
	userId: string
	cookCount: number
	masteryLevel: MasteryLevel
	firstCookedAt: string
	lastCookedAt: string
	totalXPEarned: number
	bestRating?: number
	nextMilestone?: {
		cooksNeeded: number
		masteryLevel: MasteryLevel
		bonusXP: number
	}
}
