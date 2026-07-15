import { finalizeAuthSession } from '@/lib/auth-session'
import { Profile } from '@/lib/types'

const profile: Profile = {
	profileId: 'profile-1',
	userId: 'user-1',
	email: 'cook@example.com',
	username: 'cook',
	firstName: 'Test',
	lastName: 'Cook',
	dob: '1990-01-01',
	displayName: 'Test Cook',
	phoneNumber: null,
	avatarUrl: '',
	bio: '',
	accountType: 'normal',
	location: '',
	preferences: [],
	statistics: {
		followerCount: 0,
		followingCount: 0,
		recipeCount: 0,
		postCount: 0,
		favouriteCount: 0,
		currentLevel: 1,
		currentXP: 0,
		currentXPGoal: 25,
		title: 'BEGINNER',
		streakCount: 0,
		challengeStreak: 0,
		completionCount: 0,
		reputation: 0,
	},
	createdAt: '2026-01-01T00:00:00Z',
	updatedAt: '2026-01-01T00:00:00Z',
}

describe('finalizeAuthSession', () => {
	it('commits auth state only after profile validation succeeds', async () => {
		const login = jest.fn()
		const setUser = jest.fn()
		const fetchProfile = jest.fn().mockResolvedValue({
			success: true,
			statusCode: 200,
			message: 'ok',
			data: profile,
		})

		const result = await finalizeAuthSession(
			' token-123 ',
			{ login, setUser },
			fetchProfile,
		)

		expect(fetchProfile).toHaveBeenCalledWith('token-123')
		expect(login).toHaveBeenCalledWith('token-123')
		expect(setUser).toHaveBeenCalledWith(profile)
		expect(result.success).toBe(true)
	})

	it('does not commit auth state when profile validation fails', async () => {
		const login = jest.fn()
		const setUser = jest.fn()
		const fetchProfile = jest.fn().mockResolvedValue({
			success: false,
			statusCode: 401,
			message: 'Profile fetch failed',
		})

		const result = await finalizeAuthSession(
			'token-123',
			{ login, setUser },
			fetchProfile,
		)

		expect(login).not.toHaveBeenCalled()
		expect(setUser).not.toHaveBeenCalled()
		expect(result.success).toBe(false)
	})

	it('rejects blank tokens before profile validation', async () => {
		const login = jest.fn()
		const setUser = jest.fn()
		const fetchProfile = jest.fn()

		const result = await finalizeAuthSession(
			'   ',
			{ login, setUser },
			fetchProfile,
		)

		expect(fetchProfile).not.toHaveBeenCalled()
		expect(login).not.toHaveBeenCalled()
		expect(setUser).not.toHaveBeenCalled()
		expect(result).toMatchObject({
			success: false,
			statusCode: 401,
		})
	})
})
