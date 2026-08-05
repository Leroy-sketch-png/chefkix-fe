import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FollowSuggestionCard } from '@/components/social/FollowSuggestionCard'
import { toggleFollow } from '@/services/social'
import { triggerMutualFollowConfetti } from '@/lib/confetti'
import { useAuthActionGuard } from '@/hooks/useAuthActionGuard'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'

jest.mock('@/services/social', () => ({
	toggleFollow: jest.fn(),
}))

jest.mock('@/lib/confetti', () => ({
	triggerMutualFollowConfetti: jest.fn(),
}))

jest.mock('@/hooks/useAuthActionGuard', () => ({
	useAuthActionGuard: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
	},
}))

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) =>
			values ? `${key}:${JSON.stringify(values)}` : key,
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
	const motionProps = new Set([
		'animate',
		'exit',
		'initial',
		'layout',
		'transition',
		'variants',
		'whileHover',
		'whileTap',
	])

	return {
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
						const domProps = Object.fromEntries(
							Object.entries(props).filter(([key]) => !motionProps.has(key)),
						)
						return React.createElement(tag, domProps, children)
					},
			},
		),
	}
})

const profile = {
	profileId: 'profile-2',
	userId: 'user-2',
	email: 'linh@example.com',
	username: 'linh',
	firstName: 'Linh',
	lastName: 'Nguyen',
	dob: '1992-01-01',
	displayName: 'Linh Nguyen',
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
} satisfies Profile

const mockedToggleFollow = jest.mocked(toggleFollow)
const mockedConfetti = jest.mocked(triggerMutualFollowConfetti)
const mockedAuthGuard = jest.mocked(useAuthActionGuard)

type ToggleResult = Awaited<ReturnType<typeof toggleFollow>>
type AuthGuard = ReturnType<typeof useAuthActionGuard>

const createAuthGuard = (requireAuth: AuthGuard['requireAuth']): AuthGuard => ({
	requireAuth,
	guardAction: (_actionType, callback) => callback,
	isAuthenticated: true,
})

const confirmedFollow = (isFollowedBy: boolean): ToggleResult => ({
	success: true,
	statusCode: 200,
	data: { ...profile, isFollowing: true, isFollowedBy },
})

const renderCard = (overrides?: {
	variant?: 'follow-back' | 'suggested'
	onFollowBack?: jest.Mock
	onDismiss?: jest.Mock
}) => {
	const onFollowBack = overrides?.onFollowBack ?? jest.fn()
	const onDismiss = overrides?.onDismiss ?? jest.fn()
	render(
		<FollowSuggestionCard
			profile={profile}
			variant={overrides?.variant}
			onFollowBack={onFollowBack}
			onDismiss={onDismiss}
		/>,
	)
	return { onFollowBack, onDismiss }
}

describe('FollowSuggestionCard settlement', () => {
	beforeEach(() => {
		jest.resetAllMocks()
		mockedAuthGuard.mockReturnValue(createAuthGuard(jest.fn(() => true)))
	})

	it('settles a one-way suggestion once without mutual celebration', async () => {
		mockedToggleFollow.mockResolvedValue(confirmedFollow(false))
		const { onFollowBack } = renderCard({ variant: 'suggested' })

		fireEvent.click(screen.getByRole('button', { name: 'follow' }))

		await waitFor(() => expect(onFollowBack).toHaveBeenCalledWith('user-2'))
		expect(mockedToggleFollow).toHaveBeenCalledTimes(1)
		expect(mockedToggleFollow).toHaveBeenCalledWith('user-2')
		expect(mockedConfetti).not.toHaveBeenCalled()
		expect(toast.success).toHaveBeenCalledWith(
			'nowFollowing:{"name":"Linh Nguyen"}',
		)
	})

	it('celebrates only when the settled response proves mutuality', async () => {
		mockedToggleFollow.mockResolvedValue(confirmedFollow(true))
		const { onFollowBack } = renderCard()

		fireEvent.click(screen.getByRole('button', { name: 'followBack' }))

		await waitFor(() => expect(onFollowBack).toHaveBeenCalledWith('user-2'))
		expect(mockedToggleFollow).toHaveBeenCalledTimes(1)
		expect(mockedConfetti).toHaveBeenCalledTimes(1)
	})

	it('does not settle a contradictory successful response', async () => {
		mockedToggleFollow.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { ...profile, isFollowing: false, isFollowedBy: true },
		})
		const { onFollowBack } = renderCard({ variant: 'suggested' })

		fireEvent.click(screen.getByRole('button', { name: 'follow' }))

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('failedFollowUser'),
		)
		expect(onFollowBack).not.toHaveBeenCalled()
		expect(mockedConfetti).not.toHaveBeenCalled()
		expect(
			(screen.getByRole('button', { name: 'follow' }) as HTMLButtonElement)
				.disabled,
		).toBe(false)
	})

	it('does not settle a successful envelope with missing data', async () => {
		mockedToggleFollow.mockResolvedValue({
			success: true,
			statusCode: 200,
		} as ToggleResult)
		const { onFollowBack } = renderCard({ variant: 'suggested' })

		fireEvent.click(screen.getByRole('button', { name: 'follow' }))

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('failedFollowUser'),
		)
		expect(onFollowBack).not.toHaveBeenCalled()
		expect(mockedConfetti).not.toHaveBeenCalled()
	})

	it('recovers controls after structured and thrown failures', async () => {
		mockedToggleFollow.mockResolvedValueOnce({
			success: false,
			statusCode: 503,
		})
		const { onFollowBack } = renderCard({ variant: 'suggested' })
		const followButton = screen.getByRole('button', { name: 'follow' })

		fireEvent.click(followButton)
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('failedFollowUser'),
		)
		await waitFor(() =>
			expect(
				(screen.getByRole('button', { name: 'follow' }) as HTMLButtonElement)
					.disabled,
			).toBe(false),
		)

		mockedToggleFollow.mockRejectedValueOnce(new Error('offline'))
		fireEvent.click(screen.getByRole('button', { name: 'follow' }))
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('networkErrorConnection'),
		)
		expect(
			(screen.getByRole('button', { name: 'follow' }) as HTMLButtonElement)
				.disabled,
		).toBe(false)
		expect(onFollowBack).not.toHaveBeenCalled()
		expect(mockedConfetti).not.toHaveBeenCalled()
	})

	it('keeps auth denial and dismiss outside the follow command', () => {
		const requireAuth = jest.fn(() => false)
		mockedAuthGuard.mockReturnValue(createAuthGuard(requireAuth))
		const { onFollowBack, onDismiss } = renderCard({ variant: 'suggested' })

		fireEvent.click(screen.getByRole('button', { name: 'follow' }))
		expect(requireAuth).toHaveBeenCalledWith('followThisChefAuth', 'follow')
		expect(mockedToggleFollow).not.toHaveBeenCalled()
		expect(onFollowBack).not.toHaveBeenCalled()

		fireEvent.click(screen.getByRole('button', { name: 'dismissSuggestion' }))
		expect(onDismiss).toHaveBeenCalledWith('user-2')
		expect(mockedToggleFollow).not.toHaveBeenCalled()
	})
})
