import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/(main)/dashboard/DashboardClient'

const mockGetPendingSessions = jest.fn()
const mockGetFeedPosts = jest.fn()

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({
		user: {
			userId: 'user-1',
			statistics: {
				streakCount: 3,
				hoursUntilStreakBreaks: 12,
			},
		},
	}),
}))

jest.mock('@/services/cookingSession', () => ({
	getPendingSessions: (...args: unknown[]) => mockGetPendingSessions(...args),
}))

jest.mock('@/services/post', () => ({
	getFeedPosts: (...args: unknown[]) => mockGetFeedPosts(...args),
}))

jest.mock('@/components/dashboard', () => ({
	DashboardCommandDeck: ({
		hasStreakAtRisk,
		pendingSessionCount,
	}: {
		hasStreakAtRisk: boolean
		pendingSessionCount?: number
	}) => (
		<div>
			<span data-testid='streak-risk'>{String(hasStreakAtRisk)}</span>
			<span data-testid='pending-count'>
				{pendingSessionCount === undefined
					? 'unknown'
					: String(pendingSessionCount)}
			</span>
		</div>
	),
	SeasonalBanner: () => null,
	SinceLastVisitCard: () => null,
	ActiveChallengesWidget: () => null,
	TonightsPick: () => null,
}))

jest.mock('@/components/cooking', () => ({
	ResumeCookingBanner: () => null,
}))

jest.mock('@/components/layout/PageContainer', () => ({
	PageContainer: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/layout/PageTransition', () => ({
	PageTransition: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/layout/PremiumSurface', () => ({
	PremiumSurface: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/ui/mesh-gradient', () => ({
	MeshGradient: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/i18n/hooks', () => ({
	useTranslations: () => (key: string) => key,
}))

beforeEach(() => {
	jest.clearAllMocks()
	mockGetFeedPosts.mockResolvedValue({
		success: true,
		statusCode: 200,
		data: [],
	})
})

describe('dashboard signal truth', () => {
	it('passes completed sessions and backend streak urgency to the command deck', async () => {
		mockGetPendingSessions.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: [{ id: 'session-1' }, { id: 'session-2' }],
		})

		render(<DashboardPage />)

		expect(screen.getByTestId('streak-risk').textContent).toBe('true')
		await waitFor(() => {
			expect(screen.getByTestId('pending-count').textContent).toBe('2')
		})
		expect(mockGetPendingSessions).toHaveBeenCalledWith({ timeoutMs: 5000 })
	})

	it('keeps pending state unknown when the API rejects the request', async () => {
		mockGetPendingSessions.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'unavailable',
		})

		render(<DashboardPage />)

		await waitFor(() => {
			expect(mockGetPendingSessions).toHaveBeenCalledTimes(1)
		})
		expect(screen.getByTestId('pending-count').textContent).toBe('unknown')
	})
})
