import { render, waitFor } from '@testing-library/react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { AuthProvider } from '../AuthProvider'

jest.mock('next/navigation', () => ({
	usePathname: jest.fn(),
	useRouter: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
	useAuth: jest.fn(),
}))

jest.mock('@/components/auth/AuthLoader', () => ({
	AuthLoader: () => null,
}))

jest.mock('../TokenRefreshProvider', () => ({
	waitForVisibilityRefresh: jest.fn().mockResolvedValue(undefined),
}))

const mockUsePathname = jest.mocked(usePathname)
const mockUseRouter = jest.mocked(useRouter)
const mockUseAuth = jest.mocked(useAuth)
const router = {
	back: jest.fn(),
	forward: jest.fn(),
	refresh: jest.fn(),
	prefetch: jest.fn(),
	push: jest.fn(),
	replace: jest.fn(),
}

describe('AuthProvider post-auth navigation', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockUsePathname.mockReturnValue(PATHS.AUTH.SIGN_IN)
		mockUseRouter.mockReturnValue(
			router as unknown as ReturnType<typeof useRouter>,
		)
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			isLoggingOut: false,
			isLoading: false,
			isHydrated: true,
			accessToken: '',
			token: '',
			user: null,
			login: jest.fn(),
			logout: jest.fn(),
			setLoading: jest.fn(),
			setUser: jest.fn(),
			setHydrated: jest.fn(),
		} as unknown as ReturnType<typeof useAuth>)
	})

	it('replaces the auth route with the intended internal destination once', async () => {
		window.history.replaceState(
			{},
			'',
			`${PATHS.AUTH.SIGN_IN}?returnTo=%2Fpost%2Fnew%3Fsession%3Dsession-1`,
		)

		render(
			<AuthProvider>
				<div>Protected app</div>
			</AuthProvider>,
		)

		await waitFor(() =>
			expect(router.replace).toHaveBeenCalledWith(
				'/post/new?session=session-1',
			),
		)
		expect(router.replace).toHaveBeenCalledTimes(1)
		expect(router.push).not.toHaveBeenCalled()
	})

	it('uses the dashboard for an unsafe auth return target', async () => {
		window.history.replaceState(
			{},
			'',
			`${PATHS.AUTH.SIGN_IN}?returnTo=%2F%2Foutside.example`,
		)

		render(
			<AuthProvider>
				<div>Protected app</div>
			</AuthProvider>,
		)

		await waitFor(() =>
			expect(router.replace).toHaveBeenCalledWith(PATHS.DASHBOARD),
		)
	})

	it('redirects an unauthenticated My Groups visit back after sign-in', async () => {
		mockUsePathname.mockReturnValue(PATHS.GROUPS.MY_GROUPS)
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			isLoggingOut: false,
			isLoading: false,
			isHydrated: true,
			accessToken: '',
			token: '',
			user: null,
			login: jest.fn(),
			logout: jest.fn(),
			setLoading: jest.fn(),
			setUser: jest.fn(),
			setHydrated: jest.fn(),
		} as unknown as ReturnType<typeof useAuth>)

		render(
			<AuthProvider>
				<div>Protected groups</div>
			</AuthProvider>,
		)

		await waitFor(() =>
			expect(router.push).toHaveBeenCalledWith(
				`${PATHS.AUTH.SIGN_IN}?returnTo=%2Fgroups%2Fmy`,
			),
		)
		expect(router.push).toHaveBeenCalledTimes(1)
	})
})
