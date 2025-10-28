import { Profile, RelationshipStatus, Statistics } from './profile'

export interface ToggleFollowResponse extends Partial<Profile> {
	profileId: string
	userId: string
	statistics: Statistics
	isFollowing: boolean
}

export interface ToggleFriendRequestResponse extends Partial<Profile> {
	profileId: string
	userId: string
	statistics: Statistics
	relationshipStatus: RelationshipStatus
}

export interface AcceptFriendResponse extends Partial<Profile> {
	profileId: string
	userId: string
	statistics: Statistics
	relationshipStatus: 'FRIENDS'
}

export interface DeclineFriendResponse {
	profileId: string
	userId: string
	displayName: string
	statistics: Pick<
		Statistics,
		'followerCount' | 'friendCount' | 'friendRequestCount'
	>
	relationshipStatus: 'NOT_FRIENDS'
	isFollowing: boolean
}

export interface UnfriendResponse {
	profileId: string
	userId: string
	displayName: string
	statistics: Pick<Statistics, 'followerCount' | 'friendCount'>
	relationshipStatus: 'NOT_FRIENDS'
	isFollowing: boolean
}
