import { useCookingStore } from '@/store/cookingStore'
import { useAuthStore } from '@/store/authStore'
import {
	createRoom as apiCreateRoom,
	joinRoom as apiJoinRoom,
	leaveRoom as apiLeaveRoom,
} from '@/services/cookingRoom'
import { getSessionById } from '@/services/cookingSession'
import { getRecipeById } from '@/services/recipe'
import { logDevError } from '@/lib/dev-log'
import type { Recipe } from '@/lib/types/recipe'

jest.mock('@/services/cookingRoom', () => ({
	createRoom: jest.fn(),
	joinRoom: jest.fn(),
	leaveRoom: jest.fn(),
	getRoom: jest.fn(),
}))

jest.mock('@/services/cookingSession', () => ({
	getSessionById: jest.fn(),
}))

jest.mock('@/services/recipe', () => ({
	getRecipeById: jest.fn(),
}))

jest.mock('@/store/authStore', () => ({
	useAuthStore: {
		getState: jest.fn(),
	},
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: { error: jest.fn() },
}))

const mockCreateRoom = apiCreateRoom as jest.Mock
const mockJoinRoom = apiJoinRoom as jest.Mock
const mockLeaveRoom = apiLeaveRoom as jest.Mock
const mockGetSessionById = getSessionById as jest.Mock
const mockGetRecipeById = getRecipeById as jest.Mock
const mockAuthState = useAuthStore.getState as jest.Mock
const mockLogDevError = logDevError as jest.Mock

const room = (sessionId: string | null) => ({
	roomCode: 'ROOM42',
	recipeId: 'recipe-1',
	recipeTitle: 'Spicy Noodles',
	hostUserId: 'user-1',
	status: 'WAITING',
	maxParticipants: 6,
	participants: [],
	createdAt: '2026-07-28T00:00:00Z',
	sessionId,
})

const session = {
	sessionId: 'session-1',
	recipeId: 'recipe-1',
	status: 'paused',
	currentStep: 3,
	totalSteps: 6,
	completedSteps: [1, 2],
	activeTimers: [],
	startedAt: '2026-07-28T00:00:00Z',
}

const recipe = {
	id: 'recipe-1',
	title: 'Spicy Noodles',
	steps: [],
} as Recipe

const spectatorParticipant = {
	userId: 'user-1',
	displayName: 'Test User',
	avatarUrl: null,
	sessionId: null,
	currentStep: 1,
	completedSteps: [],
	joinedAt: '2026-07-28T00:00:00Z',
	isHost: false,
	role: 'SPECTATOR' as const,
}

const cookParticipant = {
	...spectatorParticipant,
	sessionId: 'session-1',
	role: 'COOK' as const,
}

describe('co-cook room session lifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockAuthState.mockReturnValue({ user: { userId: 'user-1' } })
		mockLeaveRoom.mockResolvedValue({ success: true, statusCode: 200 })
		useCookingStore.setState({
			session: null,
			recipe: null,
			roomCode: null,
			participants: [],
			isInRoom: false,
			isHost: false,
			isLoading: false,
			error: null,
			interactionMode: null,
		})
	})

	it('hydrates the exact cook session before room creation succeeds', async () => {
		mockCreateRoom.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: room('session-1'),
		})
		mockGetSessionById.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: session,
		})
		mockGetRecipeById.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: recipe,
		})

		await expect(
			useCookingStore.getState().createRoom('recipe-1'),
		).resolves.toBe('ROOM42')

		const state = useCookingStore.getState()
		expect(mockGetSessionById).toHaveBeenCalledWith('session-1')
		expect(state.session).toEqual(session)
		expect(state.recipe).toEqual(recipe)
		expect(state.roomCode).toBe('ROOM42')
		expect(state.isInRoom).toBe(true)
		expect(mockLeaveRoom).not.toHaveBeenCalled()
	})

	it('loads recipe context without creating a session for spectators', async () => {
		mockJoinRoom.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: room(null),
		})
		mockGetRecipeById.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: recipe,
		})

		await expect(
			useCookingStore.getState().joinRoom('ROOM42', 'SPECTATOR'),
		).resolves.toBe(true)

		const state = useCookingStore.getState()
		expect(mockGetSessionById).not.toHaveBeenCalled()
		expect(state.session).toBeNull()
		expect(state.recipe).toEqual(recipe)
		expect(state.isInRoom).toBe(true)
	})

	it('rolls back spectator membership when recipe context cannot load', async () => {
		mockJoinRoom.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: room(null),
		})
		mockGetRecipeById.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'Recipe unavailable',
		})

		await expect(
			useCookingStore.getState().joinRoom('ROOM42', 'SPECTATOR'),
		).resolves.toBe(false)

		const state = useCookingStore.getState()
		expect(mockLeaveRoom).toHaveBeenCalledWith('ROOM42')
		expect(state.recipe).toBeNull()
		expect(state.roomCode).toBeNull()
		expect(state.isInRoom).toBe(false)
	})

	it('rolls back backend membership when cook-session hydration fails', async () => {
		mockJoinRoom.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: room('session-1'),
		})
		mockGetSessionById.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'Session unavailable',
		})

		await expect(useCookingStore.getState().joinRoom('ROOM42')).resolves.toBe(
			false,
		)

		const state = useCookingStore.getState()
		expect(mockLeaveRoom).toHaveBeenCalledWith('ROOM42')
		expect(state.roomCode).toBeNull()
		expect(state.isInRoom).toBe(false)
		expect(state.error).toBe('Session unavailable')
	})

	it('keeps local room state false and logs a rejected rollback response', async () => {
		mockCreateRoom.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: room('session-1'),
		})
		mockGetSessionById.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'Session unavailable',
		})
		const rollbackFailure = {
			success: false,
			statusCode: 503,
			message: 'Room service unavailable',
		}
		mockLeaveRoom.mockResolvedValue(rollbackFailure)

		await expect(
			useCookingStore.getState().createRoom('recipe-1'),
		).resolves.toBeNull()

		expect(useCookingStore.getState().isInRoom).toBe(false)
		expect(mockLogDevError).toHaveBeenCalledWith(
			'[cookingStore] room entry rollback failed:',
			rollbackFailure,
		)
	})

	it('preserves spectator membership when an in-place cook upgrade is rejected', async () => {
		useCookingStore.setState({
			roomCode: 'ROOM42',
			participants: [spectatorParticipant],
			isInRoom: true,
			recipe,
		})
		mockJoinRoom.mockResolvedValue({
			success: false,
			statusCode: 409,
			message: 'A different cooking session is active',
		})

		await expect(
			useCookingStore.getState().joinRoom('ROOM42', 'COOK'),
		).resolves.toBe(false)

		const state = useCookingStore.getState()
		expect(mockLeaveRoom).not.toHaveBeenCalled()
		expect(state.roomCode).toBe('ROOM42')
		expect(state.isInRoom).toBe(true)
		expect(state.participants).toEqual([spectatorParticipant])
		expect(state.recipe).toEqual(recipe)
	})

	it('preserves upgraded room membership when session hydration needs recovery', async () => {
		useCookingStore.setState({
			roomCode: 'ROOM42',
			participants: [spectatorParticipant],
			isInRoom: true,
			recipe,
		})
		mockJoinRoom.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { ...room('session-1'), participants: [cookParticipant] },
		})
		mockGetSessionById.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'Session unavailable',
		})

		await expect(
			useCookingStore.getState().joinRoom('ROOM42', 'COOK'),
		).resolves.toBe(false)

		const state = useCookingStore.getState()
		expect(mockLeaveRoom).not.toHaveBeenCalled()
		expect(state.roomCode).toBe('ROOM42')
		expect(state.isInRoom).toBe(true)
		expect(state.participants).toEqual([cookParticipant])
		expect(state.error).toBe('Session unavailable')
	})

	it('hydrates the promoted cook session without creating a second room entry', async () => {
		useCookingStore.setState({
			roomCode: 'ROOM42',
			participants: [spectatorParticipant],
			isInRoom: true,
			recipe,
		})
		mockJoinRoom.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { ...room('session-1'), participants: [cookParticipant] },
		})
		mockGetSessionById.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: session,
		})
		mockGetRecipeById.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: recipe,
		})

		await expect(
			useCookingStore.getState().joinRoom('ROOM42', 'COOK'),
		).resolves.toBe(true)

		const state = useCookingStore.getState()
		expect(mockJoinRoom).toHaveBeenCalledTimes(1)
		expect(mockLeaveRoom).not.toHaveBeenCalled()
		expect(state.session).toEqual(session)
		expect(state.participants).toEqual([cookParticipant])
		expect(state.isInRoom).toBe(true)
	})
})
