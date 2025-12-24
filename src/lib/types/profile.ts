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
	// Additional fields per spec 02-profile.txt
	recipesCooked?: number // Distinct recipes user has cooked
	recipesMastered?: number // Recipes cooked 5+ times (mastery threshold)
	longestStreak?: number // Historical best streak
}

// Instagram model: Follow only, mutual follow = implicit friends
export type RelationshipStatus =
	| 'SELF' // Viewing own profile
	| 'FOLLOWING' // I follow them
	| 'FOLLOWED_BY' // They follow me
	| 'MUTUAL' // We follow each other (= "friends")
	| 'NONE' // No relationship
	// Legacy alias for backward compat during migration
	| 'FRIENDS' // Alias for MUTUAL
	| 'NOT_FRIENDS' // Alias for NONE

import type { Badge } from './gamification'

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
	// Gamification fields per spec 02-profile.txt
	badges?: Badge[] // Earned badges
	recipesCooked?: number // Distinct recipes completed
	totalCookingSessions?: number // Total sessions (includes repeats)
	lastCookDate?: string // ISO8601, for streak calculation
	longestStreak?: number // Historical best
	// AI Quota per spec
	aiGenerationsRemaining?: number // Resets daily, default 30
	aiQuotaResetAt?: string // ISO8601, next reset timestamp
}
