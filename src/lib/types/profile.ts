export interface Statistics {
	followerCount: number
	followingCount: number
	friendCount: number
	friendRequestCount: number
	recipeCount: number
	postCount: number
	favouriteCount: number
	currentLevel: number
	currentXP: number
	currentXPGoal: number
	title: 'BEGINNER' | 'AMATEUR' | 'SEMIPRO' | 'PRO'
	streakCount: number
	reputation: number
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
}
