import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GroupCard } from '@/components/groups/GroupCard'
import { joinGroup } from '@/services/group'
import type { Group } from '@/lib/types/group'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))
jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode
		href: string
	}) => <a href={href}>{children}</a>,
}))
jest.mock('framer-motion', () => ({
	motion: {
		div: ({
			children,
			whileHover: _whileHover,
			transition: _transition,
			...props
		}: React.ComponentProps<'div'> & Record<string, unknown>) => (
			<div {...props}>{children}</div>
		),
	},
}))
jest.mock('@/components/ui/image-with-fallback', () => ({
	ImageWithFallback: () => null,
}))
jest.mock('@/services/group', () => ({
	joinGroup: jest.fn(),
}))
jest.mock('sonner', () => ({
	toast: {
		info: jest.fn(),
		success: jest.fn(),
		error: jest.fn(),
	},
}))

const mockedJoinGroup = jest.mocked(joinGroup)
const groupFixture = (overrides: Partial<Group> = {}): Group => ({
	id: 'group-1',
	name: 'Weeknight Cooks',
	description: 'Practical dinners',
	coverImageUrl: null,
	privacyType: 'PRIVATE',
	creatorId: 'owner-1',
	ownerId: 'owner-1',
	memberCount: 12,
	createdAt: '2026-07-31T00:00:00Z',
	myStatus: 'NONE',
	...overrides,
})

describe('GroupCard membership truth', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders an existing pending request as pending only', () => {
		render(
			<GroupCard
				group={groupFixture({ myStatus: 'PENDING' })}
				currentUserId='cook-1'
			/>,
		)

		expect(screen.getByText('gcRequestPending')).toBeTruthy()
		expect(screen.queryByText('gcViewGroup')).toBeNull()
		expect(screen.queryByText('gcJoinGroup')).toBeNull()
	})

	it('keeps a private join request pending without changing member count', async () => {
		const onMembershipChange = jest.fn()
		mockedJoinGroup.mockResolvedValue({
			groupId: 'group-1',
			membershipStatus: 'PENDING',
			message: 'Waiting for approval',
		})

		render(
			<GroupCard
				group={groupFixture()}
				currentUserId='cook-1'
				onMembershipChange={onMembershipChange}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'gcJoinGroup' }))

		await screen.findByText('gcRequestPending')
		expect(screen.queryByText('gcViewGroup')).toBeNull()
		expect(onMembershipChange).toHaveBeenCalledWith(
			expect.objectContaining({
				myStatus: 'PENDING',
				isJoined: false,
				hasPendingRequest: true,
				memberCount: 12,
			}),
		)
	})

	it('promotes an active public join and increments the visible count once', async () => {
		const onMembershipChange = jest.fn()
		mockedJoinGroup.mockResolvedValue({
			groupId: 'group-1',
			membershipStatus: 'ACTIVE',
			message: 'Joined',
		})

		render(
			<GroupCard
				group={groupFixture({ privacyType: 'PUBLIC' })}
				currentUserId='cook-1'
				onMembershipChange={onMembershipChange}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'gcJoinGroup' }))

		await screen.findByText('gcViewGroup')
		await waitFor(() =>
			expect(onMembershipChange).toHaveBeenCalledWith(
				expect.objectContaining({
					myStatus: 'ACTIVE',
					isJoined: true,
					hasPendingRequest: false,
					memberCount: 13,
				}),
			),
		)
	})

	it('does not offer a banned member another join or a sign-in action', () => {
		render(
			<GroupCard
				group={groupFixture({ myStatus: 'BANNED' })}
				currentUserId='cook-1'
			/>,
		)

		expect(screen.queryByText('gcJoinGroup')).toBeNull()
		expect(screen.queryByText('gcSignInToJoin')).toBeNull()
		expect(screen.queryByText('gcViewGroup')).toBeNull()
	})
})
