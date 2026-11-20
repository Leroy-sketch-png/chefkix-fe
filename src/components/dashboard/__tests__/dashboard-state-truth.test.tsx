import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FriendsCookingNow } from '@/components/cooking/FriendsCookingNow'
import { TonightsPick } from '@/components/dashboard/TonightsPick'

const mockGetFriendsActiveRooms = jest.fn()
const mockGetFriendsActiveCooking = jest.fn()
const mockGetTonightsPick = jest.fn()

jest.mock('@/services/cookingRoom', () => ({
	getFriendsActiveRooms: (...args: unknown[]) =>
		mockGetFriendsActiveRooms(...args),
}))

jest.mock('@/services/heartbeat', () => ({
	getFriendsActiveCooking: (...args: unknown[]) =>
		mockGetFriendsActiveCooking(...args),
}))

jest.mock('@/services/recipe', () => ({
	getTonightsPick: (...args: unknown[]) => mockGetTonightsPick(...args),
}))

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, params?: Record<string, unknown>) =>
		params ? `${key}:${JSON.stringify(params)}` : key,
}))

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
		...props
	}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a href={typeof href === 'string' ? href : '#'} {...props}>
			{children}
		</a>
	),
}))

jest.mock('framer-motion', () => {
	const React = require('react')
	const createMotionComponent = (component: React.ElementType) => {
		const MotionComponent = ({ children, ...props }: Record<string, unknown>) =>
			React.createElement(component, props, children as React.ReactNode)
		MotionComponent.displayName = 'MockMotionComponent'
		return MotionComponent
	}

	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
		motion: new Proxy(createMotionComponent, {
			get:
				(_target, tag: string) =>
				({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
					React.createElement(tag, props, children),
		}),
	}
})

const emptyRooms = { success: true, statusCode: 200, data: [] }
const emptySolo = {
	success: true,
	statusCode: 200,
	data: { friends: [], totalActive: 0 },
}
const failed = { success: false, statusCode: 503, message: 'unavailable' }
const liveRoom = {
	roomCode: 'PHO42',
	recipeId: 'recipe-pho',
	recipeTitle: 'Weeknight Pho',
	participantCount: 2,
	participantNames: ['Mai', 'Minh'],
	startedMinutesAgo: 3,
}

beforeEach(() => {
	jest.clearAllMocks()
	mockGetFriendsActiveRooms.mockResolvedValue(emptyRooms)
	mockGetFriendsActiveCooking.mockResolvedValue(emptySolo)
})

describe('FriendsCookingNow state truth', () => {
	it('shows a real empty state only when both sources succeed empty', async () => {
		render(<FriendsCookingNow />)

		expect(await screen.findByText('friendsCookingEmptyTitle')).toBeTruthy()
		expect(screen.queryByText('friendsCookingUnavailableTitle')).toBeNull()
	})

	it('shows unavailable instead of zero when initial presence cannot load', async () => {
		mockGetFriendsActiveRooms.mockResolvedValue(failed)
		mockGetFriendsActiveCooking.mockResolvedValue(failed)

		render(<FriendsCookingNow />)

		expect(
			await screen.findByText('friendsCookingUnavailableTitle'),
		).toBeTruthy()
		expect(screen.queryByText('friendsCookingEmptyTitle')).toBeNull()
		expect(screen.getByLabelText('friendsCookingCountUnavailable')).toBeTruthy()
	})

	it('retries both presence sources from the unavailable state', async () => {
		mockGetFriendsActiveRooms.mockResolvedValueOnce(failed)
		mockGetFriendsActiveCooking.mockResolvedValueOnce(failed)

		render(<FriendsCookingNow />)
		fireEvent.click(
			await screen.findByRole('button', { name: 'friendsCookingRetry' }),
		)

		await waitFor(() => {
			expect(mockGetFriendsActiveRooms).toHaveBeenCalledTimes(2)
			expect(mockGetFriendsActiveCooking).toHaveBeenCalledTimes(2)
		})
		expect(await screen.findByText('friendsCookingEmptyTitle')).toBeTruthy()
	})

	it('preserves known room data when a later refresh partially fails', async () => {
		mockGetFriendsActiveRooms
			.mockResolvedValueOnce({
				success: true,
				statusCode: 200,
				data: [liveRoom],
			})
			.mockResolvedValue(failed)
		mockGetFriendsActiveCooking
			.mockResolvedValueOnce(emptySolo)
			.mockResolvedValue(failed)

		render(<FriendsCookingNow pollInterval={250} />)

		expect(await screen.findByText('Mai & Minh')).toBeTruthy()
		expect(await screen.findByText('friendsCookingPartial')).toBeTruthy()
		expect(screen.getByText('Mai & Minh')).toBeTruthy()
		expect(screen.queryByText('friendsCookingEmptyTitle')).toBeNull()
	})

	it('exposes solo-friend recipe navigation as a keyboard link', async () => {
		mockGetFriendsActiveCooking.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: {
				friends: [
					{
						userId: 'friend-1',
						username: 'linh',
						displayName: 'Linh',
						avatarUrl: null,
						recipeId: 'recipe-solo',
						recipeTitle: 'Weeknight Pho',
						coverImageUrl: [],
						currentStep: 2,
						totalSteps: 5,
						startedAt: '2026-11-20T00:00:00Z',
						roomCode: null,
					},
				],
				totalActive: 1,
			},
		})

		render(<FriendsCookingNow />)

		const recipeLink = await screen.findByRole('link', { name: /Linh/ })
		expect(recipeLink).toHaveAttribute('href', '/recipes/recipe-solo')
	})
})

describe("Tonight's Pick state truth", () => {
	it.each([
		['successful absence', { success: true, statusCode: 200, data: null }],
		['empty catalog', { success: false, statusCode: 404 }],
	])('renders empty for %s', async (_label, response) => {
		mockGetTonightsPick.mockResolvedValue(response)

		render(<TonightsPick />)

		expect(await screen.findByText('tpEmptyMsg')).toBeTruthy()
		expect(screen.queryByText('tpErrorMsg')).toBeNull()
		expect(screen.queryByRole('button', { name: 'tpRetry' })).toBeNull()
	})

	it('renders a retryable error for infrastructure failure', async () => {
		mockGetTonightsPick.mockResolvedValue(failed)

		render(<TonightsPick />)

		expect(await screen.findByText('tpErrorMsg')).toBeTruthy()
		expect(screen.getByRole('button', { name: 'tpRetry' })).toBeTruthy()
		expect(screen.queryByText('tpEmptyMsg')).toBeNull()
	})
})
