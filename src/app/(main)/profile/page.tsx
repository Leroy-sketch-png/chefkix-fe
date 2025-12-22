import { redirect } from 'next/navigation'
import { getMyProfile } from '@/services/profile'
import { PATHS } from '@/constants'

/**
 * /profile route - Redirects to the current user's profile page
 *
 * Since profiles are at /{userId}, this page fetches the current user's ID
 * and redirects to their profile. If not authenticated, redirects to dashboard.
 */
const ProfilePage = async () => {
	const { success, data: profile } = await getMyProfile()

	if (success && profile?.userId) {
		redirect(`/${profile.userId}`)
	}

	// Not authenticated or failed to get profile - redirect to dashboard
	redirect(PATHS.DASHBOARD)
}

export default ProfilePage
