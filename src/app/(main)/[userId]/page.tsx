import { getProfileByUserId, getMyProfile } from '@/services/profile'
import { UserProfile } from '@/components/profile/UserProfile'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { ProfileNotFound } from '@/components/profile/ProfileNotFound'

interface ProfilePageProps {
	params: Promise<{
		userId: string
	}>
}

const ProfilePage = async ({ params }: ProfilePageProps) => {
	const { userId } = await params
	const { success, data: profile } = await getProfileByUserId(userId)
	const { data: currentUserProfile } = await getMyProfile()

	if (!success || !profile) {
		return <UserProfileSkeleton />
	}

	return (
		<UserProfile profile={profile} currentUserId={currentUserProfile?.userId} />
	)
}

export default ProfilePage
