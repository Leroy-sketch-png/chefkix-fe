/**
 * ML service — NER extraction, difficulty calibration, content guard.
 * Uses `aiApi` (port 8000) for all AI service endpoints.
 * Wave 5.4–5.6: Intelligence layer.
 */
import { aiApi } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import {
	getDirectAiPreflightFailure,
	handleDirectAiError,
} from './directAiClient'

// ── Difficulty Calibration ──────────────────────────────────────────────────

export interface CalibrationRequest {
	ingredient_count: number
	step_count: number
	techniques: string[]
	estimated_time_minutes: number
	equipment_count: number
	avgCompletionRate?: number
	avgTimeRatio?: number
	avgStepAccuracy?: number
	sessionCount?: number
}

export interface CalibrationResult {
	predictedDifficulty: string
	confidence: number
	score: number
	factors: Record<string, unknown>
	calibrationSource: string
	parseTimeMs: number
}

export const calibrateDifficulty = async (
	data: CalibrationRequest,
): Promise<ApiResponse<CalibrationResult>> => {
	const preflightFailure = getDirectAiPreflightFailure<CalibrationResult>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<CalibrationResult>>(
			API_ENDPOINTS.ML.CALIBRATE_DIFFICULTY,
			data,
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<CalibrationResult>(
			error,
			'Difficulty calibration failed',
		)
	}
}

// ── Content Guard ───────────────────────────────────────────────────────────

export interface ContentGuardResult {
	action: 'approve' | 'flag' | 'block'
	category: string
	confidence: number
	reasons: string[]
	needsLlmReview: boolean
	parseTimeMs: number
	modelVersion: string
}

export const guardContent = async (
	text: string,
	contentType: 'post' | 'comment' | 'recipe' | 'chat' = 'post',
): Promise<ApiResponse<ContentGuardResult>> => {
	const preflightFailure = getDirectAiPreflightFailure<ContentGuardResult>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<ContentGuardResult>>(
			API_ENDPOINTS.ML.CONTENT_GUARD,
			{ text, content_type: contentType },
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<ContentGuardResult>(
			error,
			'Content guard check failed',
		)
	}
}
