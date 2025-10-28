export interface Statistics {
	followerCount: number
	followingCount: number
	friendCount: number
	friendRequestCount: number
	currentLevel: number
	currentXP?: number
	currentXPGoal?: number
	title?: string
}

export interface Friend {
	userId: string
	friendedAt: string
}

export type RelationshipStatus =
	| 'SELF'
	| 'FRIENDS'
	| 'PENDING_SENT'
	| 'PENDING_RECEIVED'
	| 'NOT_FRIENDS'

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
	accountType: 'user' | 'chef'
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
