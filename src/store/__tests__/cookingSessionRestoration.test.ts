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
		localStorage.removeItem('chefkix-cooking-session')
		useCookingStore.setState({
			session: partialSession as never,
			recipe: null,
			isLoading: false,
			error: null,
			interactionMode: null,
			isPreviewMode: false,
			previewPreviousState: null,
			checkedIngredients: {},
			localTimers: new Map(),
		})
	})

	it('does not persist an unpublished preview when no real cook is active', () => {
		useCookingStore.setState({ session: null, recipe: null })
		useCookingStore.getState().startPreviewCooking({
			...recipe,
			id: 'unpublished-recipe',
			title: 'Private draft',
		} as Recipe)

		const persisted = JSON.parse(
			localStorage.getItem('chefkix-cooking-session') || '{}',
		) as {
			state?: { session?: unknown; recipe?: unknown; localTimers?: unknown[] }
		}

		expect(persisted.state?.session).toBeNull()
		expect(persisted.state?.recipe).toBeNull()
		expect(persisted.state?.localTimers).toEqual([])
		expect(useCookingStore.getState().isPreviewMode).toBe(true)
	})

	it('preserves and restores an existing real cook while preview is open', () => {
		const realTimers = new Map([
			[2, { initialDuration: 90, startedAt: 1000, remaining: 60 }],
		])
		useCookingStore.setState({
			session: restoredSession as never,
			recipe,
			checkedIngredients: { '1-0': true },
			localTimers: realTimers,
			interactionMode: 'ACTIVE',
		})

		useCookingStore.getState().startPreviewCooking({
			...recipe,
			id: 'unpublished-recipe',
			title: 'Private draft',
		} as Recipe)

		const persisted = JSON.parse(
			localStorage.getItem('chefkix-cooking-session') || '{}',
		) as {
			state?: {
				session?: { sessionId?: string }
				recipe?: { title?: string }
				checkedIngredients?: Record<string, boolean>
				localTimers?: [number, { remaining: number }][]
			}
		}
		expect(persisted.state?.session?.sessionId).toBe('session-1')
		expect(persisted.state?.recipe?.title).toBe('Pho')
		expect(persisted.state?.checkedIngredients).toEqual({ '1-0': true })
		expect(persisted.state?.localTimers?.[0]?.[1].remaining).toBe(60)
		expect(useCookingStore.getState().recipe?.title).toBe('Private draft')

		useCookingStore.getState().exitPreview()

		expect(useCookingStore.getState()).toMatchObject({
			session: restoredSession,
			recipe,
			isPreviewMode: false,
			checkedIngredients: { '1-0': true },
			interactionMode: 'ACTIVE',
		})
		expect(useCookingStore.getState().localTimers).toEqual(realTimers)
	})

	it('sanitizes persisted preview-prefixed sessions during hydration', () => {
		const merge = useCookingStore.persist.getOptions().merge
		expect(merge).toBeDefined()
		const hydrated = merge?.(
			{
				session: { sessionId: 'preview-1712345678', recipeId: 'draft-1' },
				recipe: { ...recipe, id: 'draft-1' },
				checkedIngredients: { '1-0': true },
				localTimers: [
					[1, { initialDuration: 60, startedAt: 1000, remaining: 30 }],
				],
			},
			useCookingStore.getState(),
		)

		expect(hydrated).toMatchObject({
			session: null,
			recipe: null,
			isPreviewMode: false,
			checkedIngredients: {},
		})
		expect(hydrated?.localTimers).toEqual(new Map())
	})

	it('never resumes a legacy preview-prefixed ID from the backend', async () => {
		useCookingStore.setState({
			session: { sessionId: 'preview-1712345678' } as never,
			recipe,
			isPreviewMode: false,
		})

		await expect(
			useCookingStore.getState().resumeExistingSession(),
		).resolves.toBe(false)

		expect(mockCurrentSession).not.toHaveBeenCalled()
		expect(useCookingStore.getState().session).toBeNull()
		expect(useCookingStore.getState().recipe).toBeNull()
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
