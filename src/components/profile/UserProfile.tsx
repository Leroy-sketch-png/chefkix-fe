'use client'

import { Profile } from '@/lib/types'

type UserProfileProps = {
	profile: Profile
}

export const UserProfile = ({ profile }: UserProfileProps) => {
	return (
		<div>
			<h1>{profile.displayName}</h1>
			<p>@{profile.username}</p>
			<p>{profile.bio}</p>
			<p>Followers: {profile.statistics.followerCount}</p>
			<p>Following: {profile.statistics.followingCount}</p>
			<p>Friends: {profile.statistics.friendCount}</p>
		</div>
	)
}
