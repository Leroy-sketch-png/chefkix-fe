import { Profile, RelationshipStatus, Statistics } from './profile'

export type ToggleFollowResponse = Profile
export type ToggleFriendRequestResponse = Profile

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
