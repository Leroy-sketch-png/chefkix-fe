import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
import { diag } from '@/lib/diagnostics'

// ============================================
// TYPES
// ============================================

interface CookingState {
	// Current session
	session: CookingSession | null
	recipe: Recipe | null
	isLoading: boolean
	error: string | null

	// Local timer state (UI-managed, synced on events)
	// startedAt: original start time, initialDuration: total seconds
	// remaining is calculated as: initialDuration - elapsed
	localTimers: Map<
		number,
		{ initialDuration: number; startedAt: number; remaining: number }
	>

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
		rating: number,
		notes?: string,
	) => Promise<CompleteSessionResponse | null>
	abandonCooking: () => Promise<void>
	clearSession: () => void
	clearAllTimers: () => void

	// Timer management
	tickTimers: () => void
	getTimerRemaining: (stepNumber: number) => number | null
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
			localTimers: new Map(),

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
									})
									return true // Successfully resumed!
								}
							}

							// If existing session is for a DIFFERENT recipe,
							// we need to inform the user (they must abandon first)
							set({
								error: `You're already cooking "${existingSession.recipe?.title || 'another recipe'}". Please finish or abandon that session first.`,
								isLoading: false,
							})
							return false
						}
					}

					if (!sessionResponse.success || !sessionResponse.data) {
						set({
							error: sessionResponse.message || 'Failed to start session',
							isLoading: false,
						})
						return false
					}

					// Fetch full recipe data
					const recipeResponse = await getRecipeById(recipeId)
					if (!recipeResponse.success || !recipeResponse.data) {
						set({
							error: 'Failed to load recipe',
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
					})

					return true
				} catch (error) {
					set({
						error: 'An error occurred starting the session',
						isLoading: false,
					})
					return false
				}
			},

			resumeExistingSession: async () => {
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
							error: 'Failed to load recipe for session',
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
					})

					return true
				} catch (error) {
					set({ error: 'Failed to resume session', isLoading: false })
					return false
				}
			},

			loadSession: async (sessionId: string) => {
				set({ isLoading: true, error: null })

				try {
					const response = await apiGetSessionById(sessionId)
					if (!response.success || !response.data) {
						set({
							error: response.message || 'Session not found',
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
							error: `This cooking session is ${session.status}. Navigate to the recipe page to cook again.`,
							isLoading: false,
						})
						return false
					}

					// Fetch recipe
					const recipeResponse = await getRecipeById(session.recipeId)
					if (!recipeResponse.success || !recipeResponse.data) {
						set({
							error: 'Failed to load recipe',
							isLoading: false,
						})
						return false
					}

					set({
						session,
						recipe: recipeResponse.data,
						isLoading: false,
					})

					return true
				} catch (error) {
					set({ error: 'Failed to load session', isLoading: false })
					return false
				}
			},

			navigateToStep: async (direction, stepNumber) => {
				const { session } = get()
				if (!session) return

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
					console.error('Failed to navigate step:', error)
				}
			},

			completeStep: async (stepNumber: number) => {
				const { session } = get()
				if (!session) return

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
					console.error('Failed to complete step:', error)
				}
			},

			startTimer: async (stepNumber: number) => {
				const { session, recipe, localTimers } = get()
				if (!session || !recipe) return

				// Find timer duration from recipe step
				const step = recipe.steps?.find(s => s.stepNumber === stepNumber)
				const timerSeconds = step?.timerSeconds || 60

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
					console.error('Failed to start timer:', error)
				}
			},

			skipTimer: async (stepNumber: number) => {
				const { session, localTimers } = get()
				if (!session) return

				try {
					await apiLogTimerEvent(session.sessionId, stepNumber, 'skip')

					// Remove local timer
					const newTimers = new Map(localTimers)
					newTimers.delete(stepNumber)
					set({ localTimers: newTimers })
				} catch (error) {
					console.error('Failed to skip timer:', error)
				}
			},

			pauseCooking: async () => {
				const { session } = get()
				if (!session) return

				try {
					const response = await apiPauseSession(session.sessionId)
					if (response.success && response.data) {
						set({
							session: {
								...session,
								status: 'paused',
								pausedAt: response.data.pausedAt,
							},
						})
					}
				} catch (error) {
					diag.error('cooking', 'PAUSE_SESSION exception', error)
				}
			},

			resumeCooking: async () => {
				const { session } = get()
				if (!session) return

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
				}
			},

			completeCooking: async (rating: number, notes?: string) => {
				const { session } = get()
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
					const response = await apiCompleteSession(session.sessionId, {
						rating,
						notes,
					})
					diag.response('cooking', `POST /complete`, response, response.success)

					if (response.success && response.data) {
						diag.action('cooking', 'COMPLETE_COOKING success', {
							baseXpAwarded: response.data.baseXpAwarded,
							pendingXp: response.data.pendingXp,
							postDeadline: response.data.postDeadline,
						})
						// CRITICAL: Clear session entirely to prevent ghost sessions in localStorage
						// The completion data is returned to the caller for the rewards modal,
						// we don't need to keep the session in store after completion
						set({
							session: null,
							recipe: null, // Also clear recipe - session is done
							localTimers: new Map(), // Kill zombie timers
							error: null,
						})
						return response.data
					}

					// API returned failure
					set({
						error: response.message || 'Failed to complete cooking session',
					})
					return null
				} catch (error) {
					console.error('Failed to complete session:', error)
					set({
						error: 'Network error while completing session. Please try again.',
					})
					return null
				}
			},

			abandonCooking: async () => {
				const { session } = get()
				if (!session) return

				try {
					await apiAbandonSession(session.sessionId)
					set({ session: null, recipe: null, localTimers: new Map() })
				} catch (error) {
					console.error('Failed to abandon session:', error)
				}
			},

			clearSession: () => {
				set({
					session: null,
					recipe: null,
					error: null,
					localTimers: new Map(),
				})
			},

			/**
			 * Clear all active timers immediately.
			 * Used when showing completion modal to prevent zombie timers.
			 */
			clearAllTimers: () => {
				set({ localTimers: new Map() })
			},

			tickTimers: () => {
				const { localTimers, session } = get()
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
							// Timer complete - record event
							apiLogTimerEvent(session.sessionId, stepNumber, 'complete')
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
		}),
		{
			name: 'chefkix-cooking-session',
			// Only persist session IDs, not full data
			partialize: state => ({
				session: state.session
					? {
							sessionId: state.session.sessionId,
							recipeId: state.session.recipeId,
						}
					: null,
			}),
		},
	),
)
