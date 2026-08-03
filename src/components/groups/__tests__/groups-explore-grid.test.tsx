import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GroupsExploreGrid } from '../GroupsExploreGrid'
import { exploreGroups, getMyGroups } from '@/services/group'
import type { Group } from '@/lib/types/group'

jest.mock('next-intl', () => {
	const translate = (key: string) => key
	return { useTranslations: () => translate }
})
jest.mock('@/services/group', () => ({
	exploreGroups: jest.fn(),
	getMyGroups: jest.fn(),
}))
jest.mock('@/store/authStore', () => ({
	useAuthStore: (selector: (state: { user: { userId: string } }) => unknown) =>
		selector({ user: { userId: 'cook-1' } }),
}))
jest.mock('framer-motion', () => ({
	motion: {
		div: ({ children }: React.ComponentProps<'div'>) => <div>{children}</div>,
		button: ({
			children,
			onClick,
			type,
			className,
		}: React.ComponentProps<'button'>) => (
			<button type={type} className={className} onClick={onClick}>
				{children}
			</button>
		),
	},
}))
jest.mock('../GroupCard', () => ({
	GroupCard: ({
		group,
		onMembershipChange,
	}: {
		group: Group
		onMembershipChange?: (group: Group) => void
	}) => (
		<div>
			<span>{group.name}</span>
			<span>{group.myStatus}</span>
			<button
				type='button'
				aria-label={`request-${group.id}`}
				onClick={() =>
					onMembershipChange?.({
						...group,
						myStatus: 'PENDING',
						isJoined: false,
						hasPendingRequest: true,
					})
				}
			>
				Request
			</button>
		</div>
	),
}))
jest.mock('../CreateGroupModal', () => ({ CreateGroupModal: () => null }))

const mockedExploreGroups = jest.mocked(exploreGroups)
const mockedGetMyGroups = jest.mocked(getMyGroups)
const groupFixture = (id: string, name: string): Group => ({
	id,
	name,
	description: `${name} description`,
	coverImageUrl: null,
	privacyType: 'PUBLIC',
	creatorId: 'cook-1',
	ownerId: 'cook-1',
	memberCount: 1,
	createdAt: '2026-07-22T00:00:00Z',
})

describe('GroupsExploreGrid', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockedGetMyGroups.mockResolvedValue({
			content: [],
			totalElements: 0,
			totalPages: 0,
			currentPage: 0,
			pageSize: 12,
			hasNext: false,
			hasPrevious: false,
		})
	})

	it('loads the member directory without showing irrelevant explore filters', async () => {
		render(<GroupsExploreGrid currentUserId='cook-1' source='mine' />)

		await waitFor(() =>
			expect(mockedGetMyGroups).toHaveBeenCalledWith(undefined, 0, 12),
		)
		expect(mockedExploreGroups).not.toHaveBeenCalled()
		expect(screen.getByRole('heading', { name: 'msMyGroups' })).toBeTruthy()
		expect(screen.queryByPlaceholderText('geSearchPlaceholder')).toBeNull()
	})

	it('does not let a stale explore response replace newer search results', async () => {
		let resolveInitial!: (
			value: Awaited<ReturnType<typeof exploreGroups>>,
		) => void
		const initialRequest = new Promise<
			Awaited<ReturnType<typeof exploreGroups>>
		>(resolve => {
			resolveInitial = resolve
		})

		mockedExploreGroups
			.mockReturnValueOnce(initialRequest)
			.mockResolvedValueOnce({
				content: [groupFixture('new', 'New Result')],
				totalElements: 1,
				totalPages: 1,
				currentPage: 0,
				pageSize: 12,
				hasNext: false,
				hasPrevious: false,
			})

		render(<GroupsExploreGrid currentUserId='cook-1' />)
		fireEvent.change(screen.getByPlaceholderText('geSearchPlaceholder'), {
			target: { value: 'new' },
		})

		await screen.findByText('New Result')
		resolveInitial({
			content: [groupFixture('old', 'Old Result')],
			totalElements: 1,
			totalPages: 1,
			currentPage: 0,
			pageSize: 12,
			hasNext: false,
			hasPrevious: false,
		})

		await waitFor(() => expect(screen.queryByText('Old Result')).toBeNull())
		expect(screen.getByText('New Result')).toBeTruthy()
	})

	it('persists a pending membership without promoting it to joined', async () => {
		mockedExploreGroups.mockResolvedValueOnce({
			content: [groupFixture('private', 'Private Bakers')],
			totalElements: 1,
			totalPages: 1,
			currentPage: 0,
			pageSize: 12,
			hasNext: false,
			hasPrevious: false,
		})

		render(<GroupsExploreGrid currentUserId='cook-1' />)
		await screen.findByText('Private Bakers')
		fireEvent.click(screen.getByRole('button', { name: 'request-private' }))

		expect(screen.getByText('PENDING')).toBeTruthy()
	})
})
