import { getProfileByUsername, getMyProfile } from '@/services/profile'
import { UserProfile } from '@/components/profile/UserProfile'
import { ProfileNotFound } from '@/components/profile/ProfileNotFound'

interface ProfilePageProps {
	params: Promise<{
		username: string
	}>
}

const ProfilePage = async ({ params }: ProfilePageProps) => {
	const { username } = await params
	const { success, data: profile } = await getProfileByUsername(username)
	const { data: currentUserProfile } = await getMyProfile()

	if (!success || !profile) {
		return <ProfileNotFound username={username} />
	}

	return (
		<UserProfile profile={profile} currentUserId={currentUserProfile?.userId} />
	)
}

export default ProfilePage
