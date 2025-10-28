import { getProfileByUsername } from '@/services/profile'
import { UserProfile } from '@/components/profile/UserProfile'

const ProfilePage = async ({ params }) => {
	const { success, data: profile } = await getProfileByUsername(params.username)

	if (!success || !profile) {
		// TODO: Create a proper not-found page
		return <div>Profile not found</div>
	}

	return <UserProfile profile={profile} />
}

export default ProfilePage
