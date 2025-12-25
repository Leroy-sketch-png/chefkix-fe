import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { AxiosError } from 'axios'

// ============================================
// TYPES - Based on implemented_spec/08-cooking-sessions.txt
// ============================================

export type SessionStatus =
	| 'in_progress'
	| 'paused'
	| 'completed'
	| 'abandoned'
	| 'posted'
	| 'expired'

export interface TimerEvent {
	stepNumber: number
	event: 'start' | 'complete' | 'skip'
	clientTimestamp: string
	serverTimestamp?: string
}

export interface ActiveTimer {
	stepNumber: number
	totalSeconds: number
	startedAt: string
	remainingSeconds: number
}

export interface CookingSessionRecipe {
	id: string
	title: string
	xpReward: number
	cookTimeMinutes: number
	totalSteps: number
	coverImageUrl?: string[] // BE returns array - FE should use [0] for thumbnail
}

export interface CookingSession {
	sessionId: string
	recipeId: string
	recipe?: CookingSessionRecipe
	status: SessionStatus
	currentStep: number
	totalSteps?: number
	completedSteps: number[]
	activeTimers: ActiveTimer[]
	startedAt: string
	pausedAt?: string
	completedAt?: string
	// XP tracking (set after completion)
	baseXpAwarded?: number
	pendingXp?: number
	remainingXpAwarded?: number
	// Post linking
	postId?: string
	postDeadline?: string
	daysRemaining?: number
	// Validation
	flagged?: boolean
	flagReason?: string
	// Completion data
	rating?: number
	notes?: string
}

export interface SessionHistoryItem {
	sessionId: string
	recipeId: string
	recipeTitle: string
	coverImageUrl?: string[] // BE returns array - FE should use [0] for thumbnail
	status: SessionStatus
	startedAt: string
	completedAt?: string
	xpEarned?: number
	baseXpAwarded?: number
	pendingXp?: number
	postDeadline?: string
	daysRemaining?: number
	postId?: string | null
}

export interface StartSessionResponse {
	sessionId: string
	recipeId: string
	startedAt: string
	status: 'in_progress'
	currentStep: number
	totalSteps: number
	activeTimers: []
	recipe: CookingSessionRecipe
}

export interface CompleteSessionResponse {
	sessionId: string
	status: 'completed'
	completedAt: string
	baseXpAwarded: number
	pendingXp: number
	postDeadline: string
	message: string
	// Level-up tracking for celebration
	leveledUp?: boolean
	oldLevel?: number
	newLevel?: number
	currentXp?: number
	xpToNextLevel?: number
}

export interface LinkPostResponse {
	sessionId: string
	postId: string
	xpAwarded: number
	totalXpForRecipe: number
	badgesEarned: string[]
	creatorBonusAwarded: boolean
}

// ============================================
// API ENDPOINTS
// ============================================

const API_BASE = '/api/v1/cooking-sessions'

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Start a new cooking session for a recipe.
 * Only ONE active session per user at a time.
 */
export const startSession = async (
	recipeId: string,
): Promise<ApiResponse<StartSessionResponse>> => {
	try {
		const response = await api.post<ApiResponse<StartSessionResponse>>(
			API_BASE,
			{ recipeId },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<StartSessionResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to start cooking session',
			statusCode: 500,
		}
	}
}

/**
 * Get the user's currently active session (if any).
 * Use for app resume / restoring cooking UI state.
 */
export const getCurrentSession = async (): Promise<
	ApiResponse<CookingSession | null>
> => {
	try {
		const response = await api.get<ApiResponse<CookingSession | null>>(
			`${API_BASE}/current`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CookingSession | null>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get current session',
			statusCode: 500,
		}
	}
}

/**
 * Get a specific session by ID.
 */
export const getSessionById = async (
	sessionId: string,
): Promise<ApiResponse<CookingSession>> => {
	try {
		const response = await api.get<ApiResponse<CookingSession>>(
			`${API_BASE}/${sessionId}`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CookingSession>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get session',
			statusCode: 500,
		}
	}
}

/**
 * Get session history with optional status filter.
 * @param status Filter by status: 'completed' | 'posted' | 'expired' | 'abandoned' | 'all'
 */
export const getSessionHistory = async (params?: {
	status?: SessionStatus | 'all'
	page?: number
	size?: number
}): Promise<
	ApiResponse<{
		sessions: SessionHistoryItem[]
		pagination: { page: number; size: number; total: number }
	}>
> => {
	try {
		const response = await api.get<
			ApiResponse<{
				sessions: SessionHistoryItem[]
				pagination: { page: number; size: number; total: number }
			}>
		>(API_BASE, { params })
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<{
				sessions: SessionHistoryItem[]
				pagination: { page: number; size: number; total: number }
			}>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get session history',
			statusCode: 500,
		}
	}
}

/**
 * Get pending sessions (completed but not yet posted).
 * Convenience wrapper for getSessionHistory with status='completed'.
 */
export const getPendingSessions = async (): Promise<
	ApiResponse<SessionHistoryItem[]>
> => {
	try {
		const response = await getSessionHistory({ status: 'completed' })
		if (response.success && response.data) {
			// Filter out sessions that already have a postId
			const pending = response.data.sessions.filter(s => !s.postId)
			return {
				success: true,
				message: 'Pending sessions fetched',
				statusCode: 200,
				data: pending,
			}
		}
		return {
			success: false,
			message: response.message || 'Failed to get pending sessions',
			statusCode: response.statusCode || 500,
		}
	} catch (error) {
		return {
			success: false,
			message: 'Failed to get pending sessions',
			statusCode: 500,
		}
	}
}

/**
 * Navigate between steps in a cooking session.
 */
export const navigateStep = async (
	sessionId: string,
	action: 'next' | 'previous' | 'goto',
	targetStep?: number,
): Promise<
	ApiResponse<{
		sessionId: string
		currentStep: number
		previousStep: number
		activeTimers: ActiveTimer[]
	}>
> => {
	try {
		const response = await api.post<
			ApiResponse<{
				sessionId: string
				currentStep: number
				previousStep: number
				activeTimers: ActiveTimer[]
			}>
		>(`${API_BASE}/${sessionId}/navigate`, { action, targetStep })
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<{
				sessionId: string
				currentStep: number
				previousStep: number
				activeTimers: ActiveTimer[]
			}>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to navigate step',
			statusCode: 500,
		}
	}
}

/**
 * Complete Step Response type
 */
export interface CompleteStepResponse {
	sessionId: string
	completedStep: number
	completedSteps: number[]
	totalSteps: number
	allStepsComplete: boolean
	alreadyCompleted: boolean
}

/**
 * Mark a step as completed.
 * Separate from navigation - users can complete steps in any order (non-linear cooking).
 * Idempotent: completing an already-completed step returns success without duplicating.
 */
export const completeStep = async (
	sessionId: string,
	stepNumber: number,
): Promise<ApiResponse<CompleteStepResponse>> => {
	try {
		const response = await api.post<ApiResponse<CompleteStepResponse>>(
			`${API_BASE}/${sessionId}/complete-step`,
			{ stepNumber },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CompleteStepResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to complete step',
			statusCode: 500,
		}
	}
}

/**
 * Log a timer event (start, complete, skip).
 * Used for anti-cheat validation.
 */
export const logTimerEvent = async (
	sessionId: string,
	stepNumber: number,
	event: 'start' | 'complete' | 'skip',
): Promise<ApiResponse<{ logged: boolean }>> => {
	try {
		const response = await api.post<ApiResponse<{ logged: boolean }>>(
			`${API_BASE}/${sessionId}/timer-event`,
			{
				stepNumber,
				event,
				clientTimestamp: new Date().toISOString(),
			},
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<{ logged: boolean }>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to log timer event',
			statusCode: 500,
		}
	}
}

/**
 * Pause a cooking session.
 * Can only pause when NO timers are running.
 */
export const pauseSession = async (
	sessionId: string,
): Promise<
	ApiResponse<{
		sessionId: string
		status: 'paused'
		pausedAt: string
		resumeDeadline: string
	}>
> => {
	try {
		const response = await api.post<
			ApiResponse<{
				sessionId: string
				status: 'paused'
				pausedAt: string
				resumeDeadline: string
			}>
		>(`${API_BASE}/${sessionId}/pause`)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<{
				sessionId: string
				status: 'paused'
				pausedAt: string
				resumeDeadline: string
			}>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to pause session',
			statusCode: 500,
		}
	}
}

/**
 * Resume a paused session.
 */
export const resumeSession = async (
	sessionId: string,
): Promise<
	ApiResponse<{
		sessionId: string
		status: 'in_progress'
		resumedAt: string
	}>
> => {
	try {
		const response = await api.post<
			ApiResponse<{
				sessionId: string
				status: 'in_progress'
				resumedAt: string
			}>
		>(`${API_BASE}/${sessionId}/resume`)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<{
				sessionId: string
				status: 'in_progress'
				resumedAt: string
			}>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to resume session',
			statusCode: 500,
		}
	}
}

/**
 * Complete a cooking session.
 * Awards 30% of XP immediately. Remaining 70% unlocked by posting.
 */
export const completeSession = async (
	sessionId: string,
	data?: { rating?: number; notes?: string },
): Promise<ApiResponse<CompleteSessionResponse>> => {
	try {
		const response = await api.post<ApiResponse<CompleteSessionResponse>>(
			`${API_BASE}/${sessionId}/complete`,
			data || {},
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CompleteSessionResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to complete session',
			statusCode: 500,
		}
	}
}

/**
 * Link a post to a completed session.
 * Awards remaining 70% XP (with decay based on days since completion).
 */
export const linkPostToSession = async (
	sessionId: string,
	postId: string,
): Promise<ApiResponse<LinkPostResponse>> => {
	try {
		const response = await api.post<ApiResponse<LinkPostResponse>>(
			`${API_BASE}/${sessionId}/link-post`,
			{ postId },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<LinkPostResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to link post to session',
			statusCode: 500,
		}
	}
}

/**
 * Abandon a cooking session.
 * Sets status to 'abandoned'. Cannot be resumed.
 */
export const abandonSession = async (
	sessionId: string,
): Promise<ApiResponse<{ abandoned: boolean }>> => {
	try {
		const response = await api.post<ApiResponse<{ abandoned: boolean }>>(
			`${API_BASE}/${sessionId}/abandon`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<{ abandoned: boolean }>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to abandon session',
			statusCode: 500,
		}
	}
}

// Alias for logTimerEvent for consistency
export const recordTimerEvent = logTimerEvent
