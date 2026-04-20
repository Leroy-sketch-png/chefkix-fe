import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { logDevError } from '@/lib/dev-log'
import {
	CookingSession,
	SessionHistoryItem,
	ActiveTimer,
	CompleteSessionResponse,
	startSession as apiStartSession,
	getCurrentSession as apiGetCurrentSession,
	getSessionById as apiGetSessionById,
	navigateStep as apiNavigateStep,
	completeStep as apiCompleteStep,
	logTimerEvent as apiLogTimerEvent,
	pauseSession as apiPauseSession,
	resumeSession as apiResumeSession,
	completeSession as apiCompleteSession,
	abandonSession as apiAbandonSession,
} from '@/services/cookingSession'
import { Recipe } from '@/lib/types/recipe'
import { getRecipeById } from '@/services/recipe'
import { toast } from 'sonner'
import messages from '../../messages/en.json'
import { diag } from '@/lib/diagnostics'
import type { RoomParticipant, CookingRoom, RoomEvent } from '@/lib/types/room'
import { useAuthStore } from '@/store/authStore'
import {
	createRoom as apiCreateRoom,
	joinRoom as apiJoinRoom,
	leaveRoom as apiLeaveRoom,
	getRoom as apiGetRoom,
} from '@/services/cookingRoom'
import type { StepRenderMode } from '@/components/cooking/StepV2Renderer'

/** Non-hook i18n lookup for Zustand stores (single-locale) */
const ct = (key: keyof typeof messages.cooking) => messages.cooking[key]

// ============================================
// TYPES
// ============================================

/**
 * Kitchen Protocol interaction modes — spec: §COMMON_GOTCHAS / 22-voice-mode.txt
 *
 * PREP        Before cooking starts. User is reading steps, gathering ingredients.
 *             Auto-transitions to ACTIVE after 30s or on first "Next Step".
 * ACTIVE      Hands free. Touch is primary. Normal cooking flow.
 * MESSY_HANDS Hands dirty (flour, oil, water). Touch secondary; voice + audio primary.
 *             Entered manually via button or voice "messy hands" command.
 * MONITORING  Timer running. Waiting for something to cook/boil/bake.
 *             Auto-entered when any timer starts; auto-exits when all timers clear.
 *             MESSY_HANDS takes priority (if both would apply, stay MESSY_HANDS).
 * COMPLETION  All steps done. Triggers rating modal.
 *             Auto-entered when showCompletion becomes true.
 */
export type KitchenInteractionMode =
	| 'PREP'
	| 'ACTIVE'
	| 'MESSY_HANDS'
	| 'MONITORING'
	| 'COMPLETION'

interface CookingState {
	// Current session
	session: CookingSession | null
	recipe: Recipe | null
	isLoading: boolean
	error: string | null

	// Kitchen Protocol interaction mode (null = no active session)
	interactionMode: KitchenInteractionMode | null
	setInteractionMode: (mode: KitchenInteractionMode) => void

	// Preview mode — allows creators to test-play recipes without backend session
	// NOT persisted to localStorage (defaults to false on rehydrate)
	isPreviewMode: boolean

	// Ingredient checklist state — persisted to localStorage across step changes and minimize
	// Key format: "${stepNumber}-${ingredientIndex}" (index, NOT name — avoids collision)
	checkedIngredients: Record<string, boolean>

	// Local timer state (UI-managed, synced on events)
	// startedAt: original start time, initialDuration: total seconds
	// remaining is calculated as: initialDuration - elapsed
	localTimers: Map<
		number,
		{ initialDuration: number; startedAt: number; remaining: number }
	>

	// Co-cooking room state
	roomCode: string | null
	participants: RoomParticipant[]
	isInRoom: boolean
	isHost: boolean

	// Actions
	startCooking: (recipeId: string) => Promise<boolean>
	resumeExistingSession: () => Promise<boolean>
	loadSession: (sessionId: string) => Promise<boolean>
	navigateToStep: (
		direction: 'goto' | 'next' | 'previous',
		stepNumber?: number,
	) => Promise<void>
	completeStep: (stepNumber: number) => Promise<void>
	startTimer: (stepNumber: number) => Promise<void>
	skipTimer: (stepNumber: number) => Promise<void>
	pauseCooking: () => Promise<void>
	resumeCooking: () => Promise<void>
	completeCooking: (
		rating?: number,
		notes?: string,
	) => Promise<CompleteSessionResponse | null>
	abandonCooking: () => Promise<void>
	clearSession: () => void
	clearAllTimers: () => void

	// Preview mode
	startPreviewCooking: (recipe: Recipe) => void
	exitPreview: () => void

	// Ingredient checklist
	toggleIngredient: (id: string) => void
	clearCheckedIngredients: () => void

	// Step render mode preference (persisted)
	stepRenderMode: StepRenderMode
	setStepRenderMode: (mode: StepRenderMode) => void

	// Timer management
	tickTimers: () => void
	getTimerRemaining: (stepNumber: number) => number | null

	// Co-cooking room actions
	createRoom: (recipeId: string) => Promise<string | null>
	joinRoom: (roomCode: string, role?: string) => Promise<boolean>
	leaveRoom: () => Promise<void>
	refreshRoom: () => Promise<void>
	handleRoomEvent: (event: RoomEvent) => void
	clearRoom: () => void
}

// ============================================
// STORE
// ============================================

export const useCookingStore = create<CookingState>()(
	persist(
		(set, get) => ({
			session: null,
			recipe: null,
			isLoading: false,
			error: null,
			interactionMode: null,
			isPreviewMode: false,
			localTimers: new Map(),
			checkedIngredients: {},
			stepRenderMode: 'full' as StepRenderMode,
			roomCode: null,
			participants: [],
			isInRoom: false,
			isHost: false,

			setInteractionMode: (mode: KitchenInteractionMode) => {
				set({ interactionMode: mode })
			},

			setStepRenderMode: (mode: StepRenderMode) => {
				set({ stepRenderMode: mode })
			},

			startCooking: async (recipeId: string) => {
				diag.action('cooking', 'START_COOKING clicked', { recipeId })
				set({ isLoading: true, error: null })

				try {
					// Start session on backend
					diag.request('cooking', 'POST /cooking-sessions/start', { recipeId })
					const sessionResponse = await apiStartSession(recipeId)
					diag.response(
						'cooking',
						'POST /cooking-sessions/start',
						sessionResponse,
						sessionResponse.success,
					)

					// Handle "session already active" error (409 Conflict)
					// Try to resume the existing session instead of failing
					if (!sessionResponse.success && sessionResponse.statusCode === 409) {
						diag.warn(
							'cooking',
							'Session already active (409), attempting resume',
							{},
						)
						// User already has an active session - try to resume it
						const currentResponse = await apiGetCurrentSession()
						if (currentResponse.success && currentResponse.data) {
							const existingSession = currentResponse.data

							// If existing session is for the SAME recipe, resume it
							if (existingSession.recipeId === recipeId) {
								diag.action(
									'cooking',
									'Resuming existing session for same recipe',
									{
										sessionId: existingSession.sessionId,
									},
								)
								const recipeResponse = await getRecipeById(recipeId)
								if (recipeResponse.success && recipeResponse.data) {
									// Restore local timers from active timers
									const localTimers = new Map<
										number,
										{
											initialDuration: number
											startedAt: number
											remaining: number
										}
									>()
									existingSession.activeTimers?.forEach(timer => {
										localTimers.set(timer.stepNumber, {
											initialDuration: timer.remainingSeconds,
											startedAt: Date.now(),
											remaining: timer.remainingSeconds,
										})
									})

									set({
										session: existingSession,
										recipe: recipeResponse.data,
										isLoading: false,
										localTimers,
										interactionMode: 'ACTIVE', // Already in-progress session
									})
									return true // Successfully resumed!
								}
							}

							// If existing session is for a DIFFERENT recipe,
							// we need to inform the user (they must abandon first)
							set({
								error: ct('storeAlreadyCooking').replace(
									'{title}',
									existingSession.recipe?.title || ct('storeAnotherRecipe'),
								),
								isLoading: false,
							})
							return false
						}
					}

					if (!sessionResponse.success || !sessionResponse.data) {
						set({
							error: sessionResponse.message || ct('storeFailedStart'),
							isLoading: false,
						})
						return false
					}

					// Fetch full recipe data
					const recipeResponse = await getRecipeById(recipeId)
					if (!recipeResponse.success || !recipeResponse.data) {
						set({
							error: ct('storeFailedLoadRecipe'),
							isLoading: false,
						})
						return false
					}

					// Convert StartSessionResponse to CookingSession format
					const session: CookingSession = {
						sessionId: sessionResponse.data.sessionId,
						recipeId: sessionResponse.data.recipeId,
						status: sessionResponse.data.status,
						currentStep: sessionResponse.data.currentStep,
						totalSteps: sessionResponse.data.totalSteps,
						completedSteps: [],
						activeTimers: sessionResponse.data.activeTimers || [],
						startedAt: sessionResponse.data.startedAt,
						recipe: sessionResponse.data.recipe,
					}

					set({
						session,
						recipe: recipeResponse.data,
						isLoading: false,
						localTimers: new Map(),
						interactionMode: 'PREP', // New session → PREP until user engages
					})

					return true
				} catch (error) {
					set({
						error: ct('storeErrorStarting'),
						isLoading: false,
					})
					return false
				}
			},

			resumeExistingSession: async () => {
				// Skip resume if current session is a preview (sessionId: 'preview')
				const currentSession = get().session
				if (currentSession?.sessionId === 'preview') {
					set({ isPreviewMode: false, session: null, recipe: null })
					return false
				}

				diag.action('cooking', 'RESUME_SESSION called', {})
				set({ isLoading: true, error: null })

				try {
					diag.request('cooking', 'GET /cooking-sessions/current', {})
					const response = await apiGetCurrentSession()
					diag.response(
						'cooking',
						'GET /cooking-sessions/current',
						response,
						response.success,
					)

					if (!response.success || !response.data) {
						diag.warn('cooking', 'No current session found', {})
						set({ isLoading: false })
						return false
					}

					const session = response.data
					diag.action('cooking', 'Session found', {
						sessionId: session.sessionId,
						recipeId: session.recipeId,
						currentStep: session.currentStep,
						status: session.status,
					})

					// Guard against missing recipeId before fetching recipe
					if (!session.recipeId) {
						diag.error('cooking', 'Session has no recipeId, cannot resume', {
							session,
						})
						set({ isLoading: false })
						return false
					}

					// Fetch recipe data
					diag.request('cooking', `GET /recipes/${session.recipeId}`, {})
					const recipeResponse = await getRecipeById(session.recipeId)
					diag.response(
						'cooking',
						`GET /recipes/${session.recipeId}`,
						recipeResponse,
						recipeResponse.success,
					)

					if (!recipeResponse.success || !recipeResponse.data) {
						diag.error('cooking', 'Failed to load recipe for session', {
							recipeId: session.recipeId,
						})
						set({
							error: ct('storeFailedLoadRecipeSession'),
							isLoading: false,
						})
						return false
					}

					// Log the recipe data we loaded
					diag.snapshot('cooking', 'Recipe loaded for session', {
						title: recipeResponse.data.title,
						stepsCount: recipeResponse.data.steps?.length ?? 0,
						hasSteps: !!recipeResponse.data.steps,
						stepImages: recipeResponse.data.steps?.map((s, i) => ({
							step: i + 1,
							hasImage: !!s.imageUrl,
						})),
					})

					// Restore local timers from active timers
					// When restoring, remainingSeconds IS the initial duration from this point
					const localTimers = new Map<
						number,
						{ initialDuration: number; startedAt: number; remaining: number }
					>()
					session.activeTimers?.forEach(timer => {
						localTimers.set(timer.stepNumber, {
							initialDuration: timer.remainingSeconds, // Backend synced remaining becomes our new initial
							startedAt: Date.now(),
							remaining: timer.remainingSeconds,
						})
					})

					set({
						session,
						recipe: recipeResponse.data,
						localTimers,
						isLoading: false,
						interactionMode: 'ACTIVE', // Resuming past-PREP session
					})

					return true
				} catch (error) {
					set({ error: ct('storeFailedResume'), isLoading: false })
					return false
				}
			},

			loadSession: async (sessionId: string) => {
				set({ isLoading: true, error: null })

				try {
					const response = await apiGetSessionById(sessionId)
					if (!response.success || !response.data) {
						set({
							error: response.message || ct('storeSessionNotFound'),
							isLoading: false,
						})
						return false
					}

					const session = response.data

					// Navigation guard: If session is completed or abandoned, don't try to load it for cooking
					// User should be redirected to recipe page or post page instead
					if (
						session.status === 'completed' ||
						session.status === 'abandoned'
					) {
						diag.warn(
							'cooking',
							'Attempted to load completed/abandoned session',
							{
								sessionId,
								status: session.status,
							},
						)
						set({
							error: ct('storeSessionInactive').replace(
								'{status}',
								session.status,
							),
							isLoading: false,
						})
						return false
					}

					// Fetch recipe
					const recipeResponse = await getRecipeById(session.recipeId)
					if (!recipeResponse.success || !recipeResponse.data) {
						set({
							error: ct('storeFailedLoadRecipe'),
							isLoading: false,
						})
						return false
					}

					set({
						session,
						recipe: recipeResponse.data,
						isLoading: false,
						interactionMode: 'ACTIVE', // loadSession = already past PREP
					})

					return true
				} catch (error) {
					set({ error: ct('storeFailedLoadSession'), isLoading: false })
					return false
				}
			},

			navigateToStep: async (direction, stepNumber) => {
				const { session, isPreviewMode } = get()
				if (!session) return

				if (isPreviewMode) {
					// Pure state computation — no API call
					const totalSteps = session.totalSteps || 0
					let newStep = session.currentStep
					if (direction === 'next' && newStep < totalSteps) newStep++
					else if (direction === 'previous' && newStep > 1) newStep--
					else if (direction === 'goto' && stepNumber)
						newStep = Math.max(1, Math.min(stepNumber, totalSteps))
					set({ session: { ...session, currentStep: newStep } })
					return
				}

				try {
					const response = await apiNavigateStep(
						session.sessionId,
						direction,
						stepNumber,
					)
					if (response.success && response.data) {
						set({
							session: { ...session, currentStep: response.data.currentStep },
						})
					}
				} catch (error) {
					logDevError('Failed to navigate step:', error)
					toast.error(ct('toastNavigateStepFailed'))
				}
			},

			completeStep: async (stepNumber: number) => {
				const { session, isPreviewMode } = get()
				if (!session) return

				if (isPreviewMode) {
					// Pure state — toggle step in completedSteps
					const completed = new Set(session.completedSteps)
					completed.add(stepNumber)
					set({
						session: {
							...session,
							completedSteps: Array.from(completed),
						},
					})
					return
				}

				try {
					const response = await apiCompleteStep(session.sessionId, stepNumber)
					if (response.success && response.data) {
						set({
							session: {
								...session,
								completedSteps: response.data.completedSteps,
							},
						})
					}
				} catch (error) {
					logDevError('Failed to complete step:', error)
					toast.error(ct('toastCompleteStepFailed'))
				}
			},

			startTimer: async (stepNumber: number) => {
				const { session, recipe, localTimers, isPreviewMode } = get()
				if (!session || !recipe) return

				// Find timer duration from recipe step
				const step = recipe.steps?.find(s => s.stepNumber === stepNumber)
				const timerSeconds = step?.timerSeconds || 60

				if (isPreviewMode) {
					// Start local timer without API event
					const newTimers = new Map(localTimers)
					newTimers.set(stepNumber, {
						initialDuration: timerSeconds,
						startedAt: Date.now(),
						remaining: timerSeconds,
					})
					set({ localTimers: newTimers })
					return
				}

				try {
					await apiLogTimerEvent(session.sessionId, stepNumber, 'start')

					// Start local timer with initialDuration for accurate elapsed calculation
					const newTimers = new Map(localTimers)
					newTimers.set(stepNumber, {
						initialDuration: timerSeconds,
						startedAt: Date.now(),
						remaining: timerSeconds,
					})
					set({ localTimers: newTimers })
				} catch (error) {
					logDevError('Failed to start timer:', error)
					toast.error(ct('toastStartTimerFailed'))
				}
			},

			skipTimer: async (stepNumber: number) => {
				const { session, localTimers, isPreviewMode } = get()
				if (!session) return

				if (isPreviewMode) {
					// Remove local timer without API event
					const newTimers = new Map(localTimers)
					newTimers.delete(stepNumber)
					set({ localTimers: newTimers })
					return
				}

				try {
					await apiLogTimerEvent(session.sessionId, stepNumber, 'skip')

					// Remove local timer
					const newTimers = new Map(localTimers)
					newTimers.delete(stepNumber)
					set({ localTimers: newTimers })
				} catch (error) {
					logDevError('Failed to skip timer:', error)
					toast.error(ct('toastSkipTimerFailed'))
				}
			},

			pauseCooking: async () => {
				const { session, isPreviewMode } = get()
				if (!session) return

				if (isPreviewMode) {
					set({ session: { ...session, status: 'paused' } })
					return
				}

				try {
					const response = await apiPauseSession(session.sessionId)
					if (response.success && response.data) {
						set({
							session: {
								...session,
								status: 'paused',
								pausedAt: response.data.pauseAt, // BE uses pauseAt (not pausedAt)
							},
						})
					}
				} catch (error) {
					diag.error('cooking', 'PAUSE_SESSION exception', error)
					toast.error(ct('toastPauseSessionFailed'))
				}
			},

			resumeCooking: async () => {
				const { session, isPreviewMode } = get()
				if (!session) return

				if (isPreviewMode) {
					set({
						session: { ...session, status: 'in_progress', pausedAt: undefined },
					})
					return
				}

				diag.action('cooking', 'RESUME_COOKING clicked', {
					sessionId: session.sessionId,
				})
				try {
					diag.request(
						'cooking',
						`POST /cooking-sessions/${session.sessionId}/resume`,
						{},
					)
					const response = await apiResumeSession(session.sessionId)
					diag.response('cooking', `POST /resume`, response, response.success)

					if (response.success && response.data) {
						set({
							session: {
								...session,
								status: 'in_progress',
								pausedAt: undefined,
							},
						})
					}
				} catch (error) {
					diag.error('cooking', 'RESUME_COOKING exception', error)
					toast.error(ct('toastResumeSessionFailed'))
				}
			},

			completeCooking: async (rating?: number, notes?: string) => {
				const { session, isPreviewMode } = get()

				if (isPreviewMode) {
					// Preview mode — no API, just exit
					set({
						session: null,
						recipe: null,
						isPreviewMode: false,
						localTimers: new Map(),
						checkedIngredients: {},
						error: null,
					})
					return null
				}

				diag.action('cooking', 'COMPLETE_COOKING clicked', {
					sessionId: session?.sessionId,
					rating,
					hasNotes: !!notes,
				})

				if (!session) {
					diag.warn('cooking', 'COMPLETE_COOKING aborted - no session', {})
					return null
				}

				try {
					diag.request(
						'cooking',
						`POST /cooking-sessions/${session.sessionId}/complete`,
						{ rating, notes },
					)
					const body: { rating?: number; notes?: string } = {}
					if (rating != null) body.rating = rating
					if (notes) body.notes = notes
					const response = await apiCompleteSession(session.sessionId, body)
					diag.response('cooking', `POST /complete`, response, response.success)

					if (response.success && response.data) {
						diag.action('cooking', 'COMPLETE_COOKING success', {
							baseXpAwarded: response.data.baseXpAwarded,
							pendingXp: response.data.pendingXp,
							postDeadline: response.data.postDeadline,
						})
						// Update session status to completed and clear timers
						// DON'T clear session/recipe yet — CookingPlayer still needs them for rendering
						// The UI will call clearSession() after closeCookingPanel()
						const { session } = get()
						set({
							session: session
								? { ...session, status: 'completed' as const }
								: null,
							localTimers: new Map(), // Kill zombie timers
							error: null,
						})
						return response.data
					}

					// API returned failure
					set({
						error: response.message || ct('storeFailedLoadSession'),
					})
					return null
				} catch (error) {
					logDevError('Failed to complete session:', error)
					set({
						error: ct('storeNetworkError'),
					})
					return null
				}
			},

			abandonCooking: async () => {
				const { session, isPreviewMode } = get()
				if (!session) return

				if (isPreviewMode) {
					set({
						session: null,
						recipe: null,
						isPreviewMode: false,
						localTimers: new Map(),
						checkedIngredients: {},
					})
					return
				}

				try {
					const response = await apiAbandonSession(session.sessionId)
					if (response.success) {
						set({
							session: null,
							recipe: null,
							localTimers: new Map(),
							checkedIngredients: {},
							interactionMode: null,
						})
						toast.info(ct('toastSessionAbandoned'))
					} else {
						logDevError('Failed to abandon session:', response.message)
						toast.error(ct('toastAbandonSessionFailed'))
					}
				} catch (error) {
					logDevError('Failed to abandon session:', error)
					toast.error(ct('toastAbandonSessionFailed'))
				}
			},

			clearSession: () => {
				set({
					session: null,
					recipe: null,
					error: null,
					isPreviewMode: false,
					localTimers: new Map(),
					checkedIngredients: {},
					interactionMode: null,
				})
			},

			/**
			 * Clear all active timers immediately.
			 * Used when showing completion modal to prevent zombie timers.
			 */
			clearAllTimers: () => {
				set({ localTimers: new Map() })
			},

			toggleIngredient: (id: string) => {
				const { checkedIngredients } = get()
				set({
					checkedIngredients: {
						...checkedIngredients,
						[id]: !checkedIngredients[id],
					},
				})
			},

			clearCheckedIngredients: () => {
				set({ checkedIngredients: {} })
			},

			/**
			 * Start a preview cooking session with a local recipe — no backend session.
			 * Used by recipe creators to test-play their recipe before publishing.
			 */
			startPreviewCooking: (recipe: Recipe) => {
				const mockSession: CookingSession = {
					sessionId: `preview-${Date.now()}`,
					recipeId: recipe.id || 'preview-unsaved',
					status: 'in_progress',
					currentStep: 1,
					totalSteps: recipe.steps?.length || 0,
					completedSteps: [],
					activeTimers: [],
					startedAt: new Date().toISOString(),
				}
				set({
					session: mockSession,
					recipe,
					isPreviewMode: true,
					isLoading: false,
					error: null,
					localTimers: new Map(),
					checkedIngredients: {},
					interactionMode: 'PREP', // Preview starts in PREP too
				})
			},

			/**
			 * Exit preview mode and clean up all state.
			 */
			exitPreview: () => {
				set({
					session: null,
					recipe: null,
					isPreviewMode: false,
					isLoading: false,
					error: null,
					localTimers: new Map(),
					checkedIngredients: {},
					interactionMode: null,
				})
			},

			tickTimers: () => {
				const { localTimers, session, isPreviewMode } = get()
				if (!session || localTimers.size === 0) return

				const newTimers = new Map(localTimers)
				let changed = false

				newTimers.forEach((timer, stepNumber) => {
					// Calculate elapsed since ORIGINAL start (not since last tick)
					// This prevents drift from slow JS intervals
					const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000)
					const newRemaining = Math.max(0, timer.initialDuration - elapsed)

					if (newRemaining !== timer.remaining) {
						changed = true
						if (newRemaining <= 0) {
							// Timer complete - record event (skip API in preview mode)
							if (!isPreviewMode) {
								apiLogTimerEvent(
									session.sessionId,
									stepNumber,
									'complete',
								).catch(err => logDevError('Timer complete event failed:', err))
							}
							newTimers.delete(stepNumber)
						} else {
							// Update only remaining, keep startedAt and initialDuration unchanged
							newTimers.set(stepNumber, {
								...timer,
								remaining: newRemaining,
							})
						}
					}
				})

				if (changed) {
					set({ localTimers: newTimers })
				}
			},

			getTimerRemaining: (stepNumber: number) => {
				const timer = get().localTimers.get(stepNumber)
				return timer ? timer.remaining : null
			},

			// ===========================================
			// CO-COOKING ROOM ACTIONS
			// ===========================================

			createRoom: async (recipeId: string) => {
				set({ isLoading: true, error: null })
				try {
					const response = await apiCreateRoom({ recipeId })
					if (!response.success || !response.data) {
						set({
							error: response.message || ct('storeFailedCreateRoom'),
							isLoading: false,
						})
						return null
					}

					const room: CookingRoom = response.data
					const userId = useAuthStore.getState().user?.userId

					set({
						roomCode: room.roomCode,
						participants: room.participants,
						isInRoom: true,
						isHost: room.hostUserId === userId,
						isLoading: false,
					})

					return room.roomCode
				} catch {
					set({ error: ct('storeFailedCreateRoom'), isLoading: false })
					return null
				}
			},

			joinRoom: async (roomCode: string, role?: string) => {
				set({ isLoading: true, error: null })
				try {
					const response = await apiJoinRoom({
						roomCode,
						role: role as 'COOK' | 'SPECTATOR' | undefined,
					})
					if (!response.success || !response.data) {
						set({
							error: response.message || ct('storeFailedJoinRoom'),
							isLoading: false,
						})
						return false
					}

					const room: CookingRoom = response.data
					const userId = useAuthStore.getState().user?.userId

					// Also load the recipe for the cooking UI
					if (room.recipeId) {
						const recipeResponse = await getRecipeById(room.recipeId)
						if (recipeResponse.success && recipeResponse.data) {
							set({ recipe: recipeResponse.data })
						}
					}

					set({
						roomCode: room.roomCode,
						participants: room.participants,
						isInRoom: true,
						isHost: room.hostUserId === userId,
						isLoading: false,
					})

					return true
				} catch {
					set({ error: ct('storeFailedJoinRoom'), isLoading: false })
					return false
				}
			},

			leaveRoom: async () => {
				const { roomCode } = get()
				if (!roomCode) return

				try {
					await apiLeaveRoom(roomCode)
				} catch (e) {
					logDevError('leaveRoom failed', e)
				}

				set({
					roomCode: null,
					participants: [],
					isInRoom: false,
					isHost: false,
				})
			},

			refreshRoom: async () => {
				const { roomCode } = get()
				if (!roomCode) return

				try {
					const response = await apiGetRoom(roomCode)
					if (response.success && response.data) {
						const room: CookingRoom = response.data
						const userId = useAuthStore.getState().user?.userId

						set({
							participants: room.participants,
							isHost: room.hostUserId === userId,
						})
					}
				} catch (e) {
					logDevError('refreshRoom failed', e)
				}
			},

			handleRoomEvent: (event: RoomEvent) => {
				const { participants } = get()

				switch (event.type) {
					case 'PARTICIPANT_JOINED': {
						// Refresh full room state to get new participant
						get().refreshRoom()
						break
					}
					case 'PARTICIPANT_LEFT': {
						set({
							participants: participants.filter(p => p.userId !== event.userId),
						})
						break
					}
					case 'HOST_TRANSFERRED': {
						const newHostId = event.data?.newHostUserId as string
						const userId = useAuthStore.getState().user?.userId
						set({
							isHost: newHostId === userId,
							participants: participants.map(p => ({
								...p,
								isHost: p.userId === newHostId,
							})),
						})
						break
					}
					case 'STEP_NAVIGATED':
					case 'STEP_COMPLETED': {
						const stepNumber = event.data?.stepNumber as number
						const completedSteps = event.data?.completedSteps as
							| number[]
							| undefined
						set({
							participants: participants.map(p =>
								p.userId === event.userId
									? {
											...p,
											currentStep: stepNumber ?? p.currentStep,
											completedSteps: completedSteps ?? p.completedSteps,
										}
									: p,
							),
						})
						break
					}
					case 'ROOM_DISSOLVED': {
						set({
							roomCode: null,
							participants: [],
							isInRoom: false,
							isHost: false,
						})
						break
					}
					// TIMER_STARTED, TIMER_COMPLETED, REACTION, SESSION_COMPLETED
					// These are informational — UI handles them directly via the hook callback
					default:
						break
				}
			},

			clearRoom: () => {
				set({
					roomCode: null,
					participants: [],
					isInRoom: false,
					isHost: false,
				})
			},
		}),
		{
			name: 'chefkix-cooking-session',
			// Persist session IDs, checklist state, active timers, and render mode preference
			partialize: state => ({
				session: state.session
					? {
							sessionId: state.session.sessionId,
							recipeId: state.session.recipeId,
						}
					: null,
				checkedIngredients: state.checkedIngredients,
				localTimers: Array.from(state.localTimers.entries()),
				stepRenderMode: state.stepRenderMode,
			}),
			merge: (persisted: unknown, currentState: CookingState) => {
				const p = persisted as Partial<
					CookingState & {
						localTimers: [
							number,
							{ initialDuration: number; startedAt: number; remaining: number },
						][]
					}
				>
				const timersArray = Array.isArray(p?.localTimers) ? p.localTimers : []
				const now = Date.now()
				const rehydratedTimers = new Map<
					number,
					{ initialDuration: number; startedAt: number; remaining: number }
				>()
				for (const [step, timer] of timersArray) {
					const elapsed = Math.floor((now - timer.startedAt) / 1000)
					const remaining = Math.max(0, timer.initialDuration - elapsed)
					if (remaining > 0) {
						rehydratedTimers.set(step, { ...timer, remaining })
					}
				}
				return {
					...currentState,
					...p,
					localTimers: rehydratedTimers,
					stepRenderMode: (p?.stepRenderMode as StepRenderMode) || 'full',
				}
			},
		},
	),
)
