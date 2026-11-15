import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DevQuickLogin } from '@/components/auth/DevQuickLogin'
import { useAuth } from '@/hooks/useAuth'
import { signIn } from '@/services/auth'
import { getMyProfileWithAccessToken } from '@/services/profile'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }))
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }))
jest.mock('@/services/auth', () => ({ signIn: jest.fn() }))
jest.mock('@/services/profile', () => ({
	getMyProfileWithAccessToken: jest.fn(),
}))
jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
	logDevWarn: jest.fn(),
}))
jest.mock('framer-motion', () => {
	const React = require('react')
	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({
						children,
						layout,
						initial,
						animate,
						exit,
						transition,
						...props
					}: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
						React.createElement(tag, props, children),
			},
		),
	}
})

const mockUseRouter = useRouter as jest.Mock
const mockUseAuth = useAuth as jest.Mock
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockGetMyProfile = getMyProfileWithAccessToken as jest.MockedFunction<
	typeof getMyProfileWithAccessToken
>

describe('DevQuickLogin failure routing', () => {
	let login: jest.Mock
	let setUser: jest.Mock
	let push: jest.Mock

	function renderQuickLogin() {
		return render(<DevQuickLogin />)
	}

	function openAccounts() {
		renderQuickLogin()
		fireEvent.click(screen.getByRole('button', { name: /quick login/i }))
		return screen.getByRole('button', { name: /test user/i })
	}

	beforeEach(() => {
		jest.clearAllMocks()
		login = jest.fn()
		setUser = jest.fn()
		push = jest.fn()
		mockUseAuth.mockReturnValue({ login, setUser })
		mockUseRouter.mockReturnValue({ push })
	})

	it('reports a rejected login without claiming the fixture is absent or advising provisioning', async () => {
		mockSignIn.mockResolvedValue({
			success: false,
			statusCode: 401,
			message: 'User not found',
		})
		const button = openAccounts()
		fireEvent.click(button)

		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
		const message = (toast.error as jest.Mock).mock.calls[0][0] as string
		expect(message).toContain('HTTP 401')
		expect(message).toContain('does not establish that the account is absent')
		expect(message).not.toMatch(/provision|seed\.bat/i)
		expect(login).not.toHaveBeenCalled()
		expect(setUser).not.toHaveBeenCalled()
		expect(push).not.toHaveBeenCalled()
		expect(button).not.toBeDisabled()
	})

	it('keeps browser auth state uncommitted when profile validation fails', async () => {
		mockSignIn.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { accessToken: 'test-access-token' },
		})
		mockGetMyProfile.mockResolvedValue({
			success: false,
			statusCode: 404,
			message: 'Profile not found',
		})
		const button = openAccounts()
		fireEvent.click(button)

		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
		expect(toast.error).toHaveBeenCalledWith(
			expect.stringContaining('HTTP 404'),
		)
		expect((toast.error as jest.Mock).mock.calls[0][0]).toContain(
			'no browser session was committed',
		)
		expect((toast.error as jest.Mock).mock.calls[0][0]).not.toMatch(
			/seed\.bat|provision/i,
		)
		expect(mockGetMyProfile).toHaveBeenCalledWith('test-access-token')
		expect(login).not.toHaveBeenCalled()
		expect(setUser).not.toHaveBeenCalled()
		expect(push).not.toHaveBeenCalled()
		expect(button).not.toBeDisabled()
	})

	it('reports missing HTTP response separately and releases the loading state', async () => {
		mockSignIn.mockResolvedValue({
			success: false,
			statusCode: 0,
			message: 'Unable to connect to the server. Please try again later.',
		})
		const button = openAccounts()
		fireEvent.click(button)

		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
		expect(toast.error).toHaveBeenCalledWith(
			expect.stringContaining('no HTTP response'),
		)
		expect(login).not.toHaveBeenCalled()
		expect(setUser).not.toHaveBeenCalled()
		expect(button).not.toBeDisabled()
	})

	it('commits auth state only after a successful profile response', async () => {
		const profile = { userId: 'demo-user-1', username: 'testuser' }
		mockSignIn.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { accessToken: 'test-access-token' },
		})
		mockGetMyProfile.mockResolvedValue({
			success: true,
			statusCode: 200,
			message: 'ok',
			data: profile as never,
		})
		const button = openAccounts()
		fireEvent.click(button)

		await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
		expect(login).toHaveBeenCalledWith('test-access-token')
		expect(setUser).toHaveBeenCalledWith(profile)
		expect(toast.success).toHaveBeenCalledWith('Demo sign-in complete')
	})

	it('does not log an exception payload and always unlocks after a thrown profile check', async () => {
		mockSignIn.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { accessToken: 'test-access-token' },
		})
		mockGetMyProfile.mockRejectedValue(new Error('untrusted-response-detail'))
		const button = openAccounts()
		fireEvent.click(button)

		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
		expect((toast.error as jest.Mock).mock.calls[0][0]).toContain(
			'Profile validation did not complete',
		)
		expect((toast.error as jest.Mock).mock.calls[0][0]).not.toContain(
			'untrusted-response-detail',
		)
		expect(login).not.toHaveBeenCalled()
		expect(setUser).not.toHaveBeenCalled()
		expect(button).not.toBeDisabled()
	})

	it('blocks duplicate attempts while one sign-in request is pending', async () => {
		let finishSignIn!: (response: {
			success: false
			statusCode: number
			message: string
		}) => void
		mockSignIn.mockReturnValue(
			new Promise(resolve => {
				finishSignIn = resolve
			}) as ReturnType<typeof signIn>,
		)
		const button = openAccounts()
		act(() => {
			button.click()
			button.click()
		})
		expect(mockSignIn).toHaveBeenCalledTimes(1)
		await act(async () => {
			finishSignIn({
				success: false,
				statusCode: 503,
				message: 'service unavailable',
			})
		})
		await waitFor(() => expect(button).not.toBeDisabled())
	})
})
