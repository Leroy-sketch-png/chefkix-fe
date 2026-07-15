import { getMyProfileWithAccessToken } from '@/services/profile'
import { ApiResponse, Profile } from '@/lib/types'

export interface AuthSessionActions {
	login: (accessToken: string) => void
	setUser: (user: Profile) => void
}

export type ProfileFetcher = (
	accessToken: string,
) => Promise<ApiResponse<Profile>>

export async function finalizeAuthSession(
	accessToken: string,
	actions: AuthSessionActions,
	fetchProfile: ProfileFetcher = getMyProfileWithAccessToken,
): Promise<ApiResponse<Profile>> {
	const token = accessToken.trim()
	if (!token) {
		return {
			success: false,
			statusCode: 401,
			message: 'Missing access token',
		}
	}

	const profileResponse = await fetchProfile(token)
	if (!profileResponse.success || !profileResponse.data) {
		return profileResponse
	}

	actions.login(token)
	actions.setUser(profileResponse.data)
	return profileResponse
}
