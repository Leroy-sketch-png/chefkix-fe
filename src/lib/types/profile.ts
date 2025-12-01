export interface Statistics {
	followerCount: number
	followingCount: number
	friendCount: number
	friendRequestCount: number
	recipeCount: number // Recipes created (recipesCreated)
	postCount: number
	favouriteCount: number
	currentLevel: number
	currentXP: number
	currentXPGoal: number // Formula: 25 * level * level (per spec)
	title: 'BEGINNER' | 'AMATEUR' | 'SEMIPRO' | 'PRO'
	streakCount: number
	reputation: number
	// Additional fields per spec 02-profile.txt
	recipesCooked?: number // Distinct recipes user has cooked
	longestStreak?: number // Historical best streak
}

export interface Friend {
	friendId: string
	friendedAt: string
}

export type RelationshipStatus =
	| 'SELF'
	| 'FRIENDS'
	| 'REQUEST_SENT'
	| 'REQUEST_RECEIVED'
	| 'NOT_FRIENDS'
	// Legacy names for backward compatibility
	| 'PENDING_SENT'
	| 'PENDING_RECEIVED'

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
	bio: string
	accountType: 'normal' | 'chef' | 'admin'
	location: string
	preferences: string[]
	statistics: Statistics
	friends: Friend[]
	createdAt: string
	updatedAt: string
	// Dynamic fields
	isFollowing?: boolean
	relationshipStatus?: RelationshipStatus
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
