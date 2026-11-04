import { render, waitFor } from '@testing-library/react'
import CreatePostPage from '../page'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { PATHS } from '@/constants/paths'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))
jest.mock('@/hooks/useAuth')
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	useSearchParams: jest.fn(),
	usePathname: () => '/post/new',
}))
jest.mock('@/i18n/hooks', () => ({
	useTranslations: () => (key: string) => key,
}))
jest.mock('@/components/providers/CelebrationProvider', () => ({
	useCelebration: () => ({ showPostSuccess: jest.fn() }),
}))
jest.mock('@/services/cookingSession', () => ({
	getSessionById: jest.fn().mockResolvedValue({ success: false }),
	linkPostToSession: jest.fn().mockResolvedValue({ success: false }),
}))
jest.mock('@/services/post', () => ({
	createPost: jest.fn(),
}))
jest.mock('@/services/ml', () => ({
	guardContent: jest.fn(),
}))
jest.mock('@/lib/eventTracker', () => ({
	trackEvent: jest.fn(),
}))
jest.mock('@/hooks/useKeyboardShortcuts', () => ({
	useModifierSymbol: () => 'Ctrl',
	formatShortcutLabel: () => 'Ctrl+Enter',
}))

describe('CreatePostPage Guest Guard', () => {
	const mockReplace = jest.fn()
	const mockUseRouter = useRouter as jest.Mock
	const mockUseSearchParams = useSearchParams as jest.Mock
	const mockUseAuth = useAuth as jest.Mock

	beforeAll(() => {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: jest.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: jest.fn(),
				removeListener: jest.fn(),
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
			})),
		})
	})

	beforeEach(() => {
		jest.clearAllMocks()
		mockUseRouter.mockReturnValue({
			replace: mockReplace,
			push: jest.fn(),
			back: jest.fn(),
		})
		mockUseSearchParams.mockReturnValue(new URLSearchParams())
	})

	it('redirects unauthenticated guest users to sign-in with return URL', async () => {
		mockUseAuth.mockReturnValue({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			isHydrated: true,
		})

		render(<CreatePostPage />)

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(
				`${PATHS.AUTH.SIGN_IN}?redirect=%2Fpost%2Fnew`,
			)
		})
	})

	it('preserves session query parameter when redirecting unauthenticated guest', async () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams({ session: 'session-123' }))
		mockUseAuth.mockReturnValue({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			isHydrated: true,
		})

		render(<CreatePostPage />)

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(
				`${PATHS.AUTH.SIGN_IN}?redirect=%2Fpost%2Fnew%3Fsession%3Dsession-123`,
			)
		})
	})

	it('does not redirect authenticated users', async () => {
		mockUseAuth.mockReturnValue({
			user: { userId: 'user-456', username: 'chef_tester' },
			isAuthenticated: true,
			isLoading: false,
			isHydrated: true,
		})

		render(<CreatePostPage />)

		// Wait briefly to confirm no redirect occurred
		await new Promise(resolve => setTimeout(resolve, 50))
		expect(mockReplace).not.toHaveBeenCalled()
	})
})
