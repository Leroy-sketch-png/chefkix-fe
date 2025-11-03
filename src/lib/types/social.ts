import { Profile, RelationshipStatus, Statistics } from './profile'

export type ToggleFollowResponse = Profile
export type ToggleFriendRequestResponse = Profile
export type AcceptFriendResponse = Profile

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
	statistics: Pick<
		Statistics,
		'followerCount' | 'friendCount' | 'friendRequestCount'
	>
	relationshipStatus: 'NOT_FRIENDS'
	isFollowing: boolean
}
