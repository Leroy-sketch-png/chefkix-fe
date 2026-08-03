import fs from 'fs'
import path from 'path'
import { useCookingStore } from '@/store/cookingStore'
import { getCurrentSession } from '@/services/cookingSession'
import { getRecipeById } from '@/services/recipe'
import type { Recipe } from '@/lib/types/recipe'

jest.mock('@/services/cookingSession', () => ({
	startSession: jest.fn(),
	getCurrentSession: jest.fn(),
	getSessionById: jest.fn(),
	navigateStep: jest.fn(),
	completeStep: jest.fn(),
	logTimerEvent: jest.fn(),
	pauseSession: jest.fn(),
	resumeSession: jest.fn(),
	completeSession: jest.fn(),
	abandonSession: jest.fn(),
}))

jest.mock('@/services/recipe', () => ({ getRecipeById: jest.fn() }))
jest.mock('@/services/cookingRoom', () => ({
	createRoom: jest.fn(),
	joinRoom: jest.fn(),
	leaveRoom: jest.fn(),
	getRoom: jest.fn(),
}))
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }))

const mockCurrentSession = getCurrentSession as jest.Mock
const mockRecipe = getRecipeById as jest.Mock
const partialSession = {
	sessionId: 'session-1',
	recipeId: 'recipe-1',
	status: undefined,
	currentStep: 3,
}
const restoredSession = {
	...partialSession,
	status: 'in_progress',
	totalSteps: 6,
	completedSteps: [1, 2],
	activeTimers: [],
}
const recipe = { id: 'recipe-1', title: 'Pho', steps: [] } as Recipe

describe('cooking session restoration', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		useCookingStore.setState({
			session: partialSession as never,
			recipe: null,
			isLoading: false,
			error: null,
			interactionMode: null,
		})
	})

	it('retains partial continuity and exposes a failed current-session response', async () => {
		mockCurrentSession.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'Session service unavailable',
		})

		await expect(
			useCookingStore.getState().resumeExistingSession(),
		).resolves.toBe(false)

		expect(useCookingStore.getState().session).toEqual(partialSession)
		expect(useCookingStore.getState().error).toBe('Session service unavailable')
	})

	it('keeps authoritative absence quiet for the provider to clear', async () => {
		mockCurrentSession.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: null,
		})

		await expect(
			useCookingStore.getState().resumeExistingSession(),
		).resolves.toBe(false)

		expect(useCookingStore.getState().session).toEqual(partialSession)
		expect(useCookingStore.getState().error).toBeNull()
	})

	it('reports malformed sessions without discarding local continuity', async () => {
		mockCurrentSession.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { ...restoredSession, recipeId: null },
		})

		await useCookingStore.getState().resumeExistingSession()

		expect(useCookingStore.getState().session).toEqual(partialSession)
		expect(useCookingStore.getState().error).toBeTruthy()
	})

	it('restores the session and recipe through the existing success path', async () => {
		mockCurrentSession.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: restoredSession,
		})
		mockRecipe.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: recipe,
		})

		await expect(
			useCookingStore.getState().resumeExistingSession(),
		).resolves.toBe(true)

		expect(useCookingStore.getState().session).toEqual(restoredSession)
		expect(useCookingStore.getState().recipe).toEqual(recipe)
		expect(useCookingStore.getState().error).toBeNull()
	})

	it('keeps failure, clear, and retry decisions in the global owner', () => {
		const provider = fs.readFileSync(
			path.join(
				process.cwd(),
				'src/components/providers/CookingTimerProvider.tsx',
			),
			'utf8',
		)

		expect(provider).toMatch(
			/if \(currentState\.error\)[\s\S]*toast\.error[\s\S]*onClick: \(\) => void restoreSession\(\)[\s\S]*if \(session\)[\s\S]*currentState\.clearSession\(\)/,
		)
		expect(provider).not.toContain('session resume is best-effort')
	})
})
