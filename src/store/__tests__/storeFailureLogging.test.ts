import { useNotificationStore } from '@/store/notificationStore'
import { useBlockedUsersStore } from '@/store/blockedUsersStore'
import { useCookingStore } from '@/store/cookingStore'
import { getUnreadCount } from '@/services/notification'
import { getBlockedUsers, blockUser, unblockUser } from '@/services/social'
import {
	createRoom as apiCreateRoom,
	joinRoom as apiJoinRoom,
} from '@/services/cookingRoom'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'

jest.mock('@/services/notification', () => ({
	getUnreadCount: jest.fn(),
}))

jest.mock('@/services/social', () => ({
	getBlockedUsers: jest.fn(),
	blockUser: jest.fn(),
	unblockUser: jest.fn(),
}))

jest.mock('@/services/cookingRoom', () => ({
	createRoom: jest.fn(),
	joinRoom: jest.fn(),
	leaveRoom: jest.fn(),
	getRoom: jest.fn(),
}))

jest.mock('@/services/recipe', () => ({
	getRecipeById: jest.fn(),
}))

jest.mock('@/store/authStore', () => ({
	useAuthStore: {
		getState: jest.fn(() => ({
			user: { userId: 'user-1' },
		})),
	},
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: {
		error: jest.fn(),
	},
}))

const mockGetUnreadCount = getUnreadCount as jest.Mock
const mockGetBlockedUsers = getBlockedUsers as jest.Mock
const mockBlockUser = blockUser as jest.Mock
const mockUnblockUser = unblockUser as jest.Mock
const mockCreateRoom = apiCreateRoom as jest.Mock
const mockJoinRoom = apiJoinRoom as jest.Mock
const mockLogDevError = logDevError as jest.Mock
const mockToastError = toast.error as jest.Mock

describe('store failure logging', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		useNotificationStore.setState({
			unreadCount: 0,
			lastFetched: null,
			isPolling: false,
		})
		useBlockedUsersStore.setState({
			blockedUserIds: new Set(),
			isLoaded: false,
			lastFetched: null,
		})
		useCookingStore.setState({
			isLoading: false,
			error: null,
			roomCode: null,
			isInRoom: false,
			isHost: false,
			participants: [],
		})
	})

	it('logs notification badge fetch failures without changing the badge count', async () => {
		const error = new Error('network down')
		mockGetUnreadCount.mockRejectedValueOnce(error)

		await useNotificationStore.getState().fetchUnreadCount()

		expect(mockLogDevError).toHaveBeenCalledWith(
			'[notificationStore] fetchUnreadCount failed:',
			error,
		)
		expect(useNotificationStore.getState().unreadCount).toBe(0)
	})

	it('marks blocked-user state loaded and logs fetch failures', async () => {
		mockGetBlockedUsers.mockResolvedValueOnce({
			success: false,
			statusCode: 500,
			message: 'blocked users unavailable',
		})

		await useBlockedUsersStore.getState().fetchBlockedUsers()

		expect(mockLogDevError).toHaveBeenCalledWith(
			'[blockedUsersStore] fetchBlockedUsers returned failure:',
			expect.objectContaining({ message: 'blocked users unavailable' }),
		)
		expect(useBlockedUsersStore.getState().isLoaded).toBe(true)
	})

	it('logs and toasts user-initiated block and unblock failures', async () => {
		mockBlockUser.mockResolvedValueOnce({
			success: false,
			statusCode: 409,
			message: 'Cannot block this user',
		})
		mockUnblockUser.mockRejectedValueOnce(new Error('unblock failed'))

		await expect(
			useBlockedUsersStore.getState().addBlockedUser('user-2'),
		).resolves.toBe(false)
		await expect(
			useBlockedUsersStore.getState().removeBlockedUser('user-2'),
		).resolves.toBe(false)

		expect(mockLogDevError).toHaveBeenCalledWith(
			'[blockedUsersStore] blockUser returned failure:',
			expect.objectContaining({ message: 'Cannot block this user' }),
		)
		expect(mockLogDevError).toHaveBeenCalledWith(
			'[blockedUsersStore] unblockUser failed:',
			expect.any(Error),
		)
		expect(mockToastError).toHaveBeenCalledWith('Cannot block this user')
		expect(mockToastError).toHaveBeenCalledWith('Failed to unblock user')
	})

	it('logs co-cook room creation and join exceptions while releasing loading state', async () => {
		const createError = new Error('create failed')
		const joinError = new Error('join failed')
		mockCreateRoom.mockRejectedValueOnce(createError)
		mockJoinRoom.mockRejectedValueOnce(joinError)

		await expect(useCookingStore.getState().createRoom('recipe-1')).resolves.toBeNull()
		await expect(useCookingStore.getState().joinRoom('ROOM42')).resolves.toBe(false)

		expect(mockLogDevError).toHaveBeenCalledWith(
			'[cookingStore] createRoom failed:',
			createError,
		)
		expect(mockLogDevError).toHaveBeenCalledWith(
			'[cookingStore] joinRoom failed:',
			joinError,
		)
		expect(useCookingStore.getState().isLoading).toBe(false)
	})
})
