/**
 * ML service — NER extraction, difficulty calibration, content guard.
 * Uses `aiApi` (port 8000) for all AI service endpoints.
 * Wave 5.4–5.6: Intelligence layer.
 */
import { aiApi } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

// ── NER Extract ─────────────────────────────────────────────────────────────

export interface NERIngredient {
	name: string
	quantity: string | null
	unit: string | null
	rawText: string
}

export interface NERResult {
	ingredients: NERIngredient[]
	techniques: string[]
	equipment: string[]
	times: Record<string, unknown>[]
	temperatures: Record<string, unknown>[]
	estimatedDifficulty: string
	parseTimeMs: number
	modelVersion: string
}

/** @deprecated Use `processRecipe` from `@/services/ai` instead — covers NER as part of full recipe parsing. */
export const extractEntities = async (
	rawText: string,
): Promise<ApiResponse<NERResult>> => {
	try {
		const response = await aiApi.post<ApiResponse<NERResult>>(
			API_ENDPOINTS.ML.NER_EXTRACT,
			{ raw_text: rawText },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<NERResult>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'NER extraction failed',
			statusCode: 500,
		}
	}
}

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
	try {
		const response = await aiApi.post<ApiResponse<CalibrationResult>>(
			API_ENDPOINTS.ML.CALIBRATE_DIFFICULTY,
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CalibrationResult>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Difficulty calibration failed',
			statusCode: 500,
		}
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
	try {
		const response = await aiApi.post<ApiResponse<ContentGuardResult>>(
			API_ENDPOINTS.ML.CONTENT_GUARD,
			{ text, content_type: contentType },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ContentGuardResult>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Content guard check failed',
			statusCode: 500,
		}
	}
}
