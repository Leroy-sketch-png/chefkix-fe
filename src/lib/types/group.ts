/**
 * Group API Types
 * Based on Social Module Group API Specification
 */

export type PrivacyType = 'PUBLIC' | 'PRIVATE'
export type MemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'BANNED'

export interface GroupMember {
	userId: string
	displayName: string
	avatarUrl: string | null
	role: MemberRole
	status: MemberStatus
	joinedAt: string
}

export interface Group {
	id: string
	name: string
	description: string
	coverImageUrl: string | null
	privacyType: PrivacyType
	creatorId: string
	ownerId: string
	memberCount: number
	tags?: string[]
	rules?: string[] // Group rules - can be managed by admins
	createdAt: string
	updatedAt?: string

	// Contextual fields for frontend rendering
	myRole?: MemberRole
	myStatus?: MemberStatus
	isJoined?: boolean
	isBanned?: boolean
	hasPendingRequest?: boolean
}

export interface CreateGroupRequest {
	name: string
	description: string
	privacyType: PrivacyType
	tags?: string[]
	coverImageUrl?: string
}

export interface UpdateGroupRequest {
	name?: string
	description?: string
	coverImageUrl?: string
	tags?: string[]
}

export interface JoinGroupRequest {
	// Empty body - endpoint handles user context
}

export interface JoinGroupResponse {
	groupId: string
	userId: string
	status: MemberStatus // 'PENDING' for private groups, 'ACTIVE' for public
	message: string
}

export interface ProcessJoinRequest {
	action: 'APPROVE' | 'REJECT'
}

export interface PendingRequest {
	userId: string
	displayName: string
	avatarUrl: string | null
	requestedAt: string
}

export interface GroupExploreQuery {
	searchTerm?: string
	privacyType?: PrivacyType
	sortBy?: 'LATEST' | 'MEMBERS' | 'TRENDING' // Default: LATEST
	tags?: string[]
	currentUserId?: string
}

export interface GroupExploreResponse {
	groups: Group[]
	totalCount: number
	currentPage: number
	pageSize: number
}

export interface TransferOwnershipRequest {
	targetUserId: string
	password: string
}
