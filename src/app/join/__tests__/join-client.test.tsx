import { render, waitFor } from '@testing-library/react'
import JoinClient from '@/app/join/JoinClient'

const mockReplace = jest.fn()
let mockRef: string | null = 'abcd2345'
let mockAuth = {
	isAuthenticated: false,
	isHydrated: true,
	isLoading: false,
}

jest.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockReplace }),
	useSearchParams: () => ({
		get: (key: string) => (key === 'ref' ? mockRef : null),
	}),
}))

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => mockAuth,
}))

jest.mock('@/components/auth/AuthLoader', () => ({
	AuthLoader: () => <div>auth-loader</div>,
}))

describe('public referral intake', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockRef = 'abcd2345'
		mockAuth = {
			isAuthenticated: false,
			isHydrated: true,
			isLoading: false,
		}
	})

	it('carries a valid invite through signed-out signup', async () => {
		render(<JoinClient />)

		await waitFor(() =>
			expect(mockReplace).toHaveBeenCalledWith(
				'/auth/sign-up?returnTo=%2Fsettings%3Ftab%3Dreferral%26ref%3DABCD2345',
			),
		)
	})

	it('sends an authenticated invitee directly to explicit redemption', async () => {
		mockAuth.isAuthenticated = true

		render(<JoinClient />)

		await waitFor(() =>
			expect(mockReplace).toHaveBeenCalledWith(
				'/settings?tab=referral&ref=ABCD2345',
			),
		)
	})

	it('drops malformed invite input without creating a return target', async () => {
		mockRef = '//attacker.example'

		render(<JoinClient />)

		await waitFor(() =>
			expect(mockReplace).toHaveBeenCalledWith('/auth/sign-up'),
		)
	})

	it('waits for auth hydration before choosing a route', () => {
		mockAuth.isHydrated = false

		render(<JoinClient />)

		expect(mockReplace).not.toHaveBeenCalled()
	})
})
