import { act, render } from '@testing-library/react'
import { TokenRefreshProvider } from '@/components/providers/TokenRefreshProvider'
import { useAuthStore } from '@/store/authStore'
import { scheduleProactiveRefresh } from '@/lib/tokenManager'
import type { User } from '@/lib/types'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/lib/tokenManager', () => ({
	scheduleProactiveRefresh: jest.fn(),
	cancelScheduledRefresh: jest.fn(),
	refreshAccessToken: jest.fn(),
	shouldRefreshToken: jest.fn(() => false),
	isRefreshInProgress: jest.fn(() => false),
	decodeToken: jest.fn((token: string) => {
		const match = token.match(/user-\d+/)
		return match ? { sub: match[0] } : null
	}),
}))

const scheduledRefresh = scheduleProactiveRefresh as jest.Mock

describe('TokenRefreshProvider session ownership', () => {
	afterEach(() => {
		act(() => {
			useAuthStore.setState({
				isAuthenticated: false,
				isLoggingOut: false,
				user: null,
				accessToken: null,
				isLoading: false,
			})
		})
		jest.clearAllMocks()
	})

	it('ignores refresh completion and expiry after logout starts', () => {
		useAuthStore.setState({
			isAuthenticated: true,
			isLoggingOut: false,
			user: { userId: 'user-1' } as User,
			accessToken: 'token-user-1-old',
		})
		render(
			<TokenRefreshProvider>
				<div>Protected content</div>
			</TokenRefreshProvider>,
		)

		const callbacks = scheduledRefresh.mock.calls[0] as [
			string,
			(token: string) => void,
			() => void,
		]

		act(() => useAuthStore.getState().beginLogout())
		act(() => callbacks[1]('token-user-1-new'))
		act(() => callbacks[2]())

		expect(useAuthStore.getState()).toMatchObject({
			isAuthenticated: true,
			isLoggingOut: true,
			accessToken: 'token-user-1-old',
		})
	})

	it('does not apply a refresh token issued to another account', () => {
		useAuthStore.setState({
			isAuthenticated: true,
			isLoggingOut: false,
			user: { userId: 'user-1' } as User,
			accessToken: 'token-user-1-old',
		})
		render(
			<TokenRefreshProvider>
				<div>Protected content</div>
			</TokenRefreshProvider>,
		)

		const callbacks = scheduledRefresh.mock.calls[0] as [
			string,
			(token: string) => void,
			() => void,
		]
		act(() => callbacks[1]('token-user-2-new'))

		expect(useAuthStore.getState()).toMatchObject({
			isAuthenticated: true,
			isLoggingOut: false,
			accessToken: 'token-user-1-old',
		})
	})
})
