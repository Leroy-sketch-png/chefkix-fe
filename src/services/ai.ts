/**
 * AI Service
 * Handles AI-powered features: recipe processing, metas calculation, cooking assistant, moderation
 * Based on: .tmp/implemented_spec/14-ai-integration.txt
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants/api'
import type { AxiosError } from 'axios'

// ============================================
// TYPES
// ============================================

// Process Recipe - Parse raw text into structured recipe
export interface ProcessRecipeRequest {
	raw_text: string
}

/**
 * Response from AI service /api/v1/process_recipe
 * Uses camelCase to match AI service Pydantic serialization_alias
 */
export interface ProcessedRecipe {
	title: string
	description: string
	difficulty: string
	prepTimeMinutes: number
	cookTimeMinutes: number
	totalTimeMinutes?: number
	servings: number
	cuisineType?: string
	dietaryTags: string[]
	caloriesPerServing?: number
	fullIngredientList: ProcessedIngredient[]
	steps: ProcessedStep[]
	// Metas from AI
	xpReward: number
	badges: string[]
	skillTags: string[]
	difficultyMultiplier: number
	// Enrichment
	equipmentNeeded?: string[]
	techniqueGuides?: Record<string, string>
	ingredientSubstitutions?: Record<string, string[]>
	seasonalTags?: string[]
	regionalOrigin?: string
	recipeStory?: string
	chefNotes?: string
}

export interface ProcessedIngredient {
	name: string
	quantity: string
	unit: string
}

/**
 * Step in ProcessedRecipe response
 * Uses camelCase to match AI service
 */
export interface ProcessedStep {
	stepNumber: number
	title?: string
	description: string
	action?: string
	ingredients?: ProcessedIngredient[]
	timerSeconds?: number
	imageUrl?: string
	tips?: string
	chefTip?: string
	techniqueExplanation?: string
	commonMistake?: string
	estimatedHandsOnTime?: number
	equipmentNeeded?: string[]
	visualCues?: string
}

// Calculate Metas - Recalculate XP, badges, enrichment for edited recipes
export interface CalculateMetasRequest {
	title: string
	description: string
	difficulty: string
	prep_time_minutes: number
	cook_time_minutes: number
	servings: number
	cuisine_type?: string
	dietary_tags: string[]
	calories_per_serving?: number
	full_ingredient_list: Array<
		{ name: string; quantity: string; unit: string } | string
	>
	steps: Array<{
		step_number: number
		description: string
		action?: string
		timer_seconds?: number
	}>
	include_enrichment?: boolean
	include_equipment?: boolean
}

export interface CalculateMetasResponse {
	xpReward: number
	xpBreakdown: {
		base: number
		baseReason: string
		steps: number
		stepsReason: string
		time: number
		timeReason: string
		techniques: number
		techniquesReason: string
		total: number
	}
	difficultyMultiplier: number
	badges: string[]
	skillTags: string[]
	achievements: string[]
	equipmentNeeded: string[]
	techniqueGuides: string[]
	seasonalTags: string[]
	ingredientSubstitutions: Record<string, string[]>
	culturalContext?: {
		region: string
		background: string
		significance: string
	}
	recipeStory?: string
	chefNotes?: string
	aiEnriched: boolean
	// Anti-cheat validation
	xpValidated: boolean
	validationConfidence: number
	validationIssues: string[]
	xpAdjusted: boolean
	aiUsed: boolean
}

// Validate Recipe - Safety check before publishing
export interface ValidateRecipeRequest {
	title: string
	description: string
	ingredients: string[]
	steps: string[]
	check_safety?: boolean
}

export interface ValidateRecipeResponse {
	schemaValid: boolean
	contentSafe: boolean
	issues: string[]
	isRealFood: boolean
	isSafeToConsume: boolean
	legitimacyScore: number
	aiAnalysis: string
	aiUsed: boolean
}

// Cooking Assistant - Real-time help during cooking
export interface CookingAssistantRequest {
	query: string
	context: string
}

export interface CookingAssistantResponse {
	answer: string
	tips: string[]
	related: string[]
}

// Content Moderation
export type ContentType =
	| 'comment'
	| 'recipe_title'
	| 'recipe_description'
	| 'post_caption'
	| 'chat_message'
	| 'bio'

export interface ModerateRequest {
	text: string
	content_type: ContentType
}

export interface ModerateResponse {
	action: 'approve' | 'flag' | 'block'
	category: 'clean' | 'toxic' | 'spam' | 'off_topic'
	severity: 'low' | 'medium' | 'high' | 'critical'
	confidence: number
	score: number
	reason: string
	matched_terms: string[]
	ai_used: boolean
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Process raw recipe text into structured format
 * Use when user pastes recipe text for AI parsing
 * Requires authentication - user must be logged in
 */
export const processRecipe = async (
	rawText: string,
): Promise<ApiResponse<ProcessedRecipe>> => {
	try {
		const response = await api.post<ApiResponse<ProcessedRecipe>>(
			API_ENDPOINTS.AI.PROCESS_RECIPE,
			{ raw_text: rawText },
		)
		console.debug('[ai.processRecipe] Response:', {
			success: response.data?.success,
			hasData: !!response.data?.data,
			title: response.data?.data?.title,
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ProcessedRecipe>>

		// Extract meaningful error info
		const status = axiosError.response?.status
		const errorMessage = axiosError.message || 'Unknown error'
		const responseData = axiosError.response?.data

		console.error(
			'[ai.processRecipe] Error:',
			`Status: ${status || 'N/A'}`,
			`Message: ${errorMessage}`,
			responseData ? JSON.stringify(responseData) : 'No response data',
		)

		// Handle specific HTTP status codes with user-friendly messages
		if (status === 401) {
			return {
				success: false,
				message: 'Please log in to use AI recipe parsing.',
				statusCode: 401,
			}
		}

		if (status === 503 || status === 502) {
			return {
				success: false,
				message: 'AI service is temporarily unavailable. Please try again.',
				statusCode: status,
			}
		}

		if (axiosError.response?.data) return axiosError.response.data
		return {
			success: false,
			message: `Failed to process recipe: ${errorMessage}`,
			statusCode: status || 500,
		}
	}
}

/**
 * Calculate XP, badges, and enrichment for a recipe
 * Use when: manually creating recipe, editing AI-generated recipe, or recalculating after changes
 */
export const calculateMetas = async (
	recipe: CalculateMetasRequest,
): Promise<ApiResponse<CalculateMetasResponse>> => {
	try {
		const response = await api.post<ApiResponse<CalculateMetasResponse>>(
			API_ENDPOINTS.AI.CALCULATE_METAS,
			recipe,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CalculateMetasResponse>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to calculate recipe metas',
			statusCode: 500,
		}
	}
}

/**
 * Validate recipe safety before publishing
 * Use when user clicks "Publish" button
 */
export const validateRecipe = async (
	recipe: ValidateRecipeRequest,
): Promise<ApiResponse<ValidateRecipeResponse>> => {
	try {
		const response = await api.post<ApiResponse<ValidateRecipeResponse>>(
			API_ENDPOINTS.AI.VALIDATE_RECIPE,
			recipe,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ValidateRecipeResponse>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to validate recipe',
			statusCode: 500,
		}
	}
}

/**
 * Get AI cooking assistance during a cooking session
 * Use when user asks a question while cooking
 */
export const askCookingAssistant = async (
	query: string,
	context: string,
): Promise<ApiResponse<CookingAssistantResponse>> => {
	try {
		const response = await api.post<ApiResponse<CookingAssistantResponse>>(
			API_ENDPOINTS.AI.COOKING_ASSISTANT,
			{ query, context },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<CookingAssistantResponse>
		>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'AI assistant unavailable',
			statusCode: 500,
		}
	}
}

/**
 * Moderate user-generated content before saving
 * Use BEFORE saving any text: comments, captions, titles, descriptions, bios, chat messages
 */
export const moderateContent = async (
	text: string,
	contentType: ContentType,
): Promise<ApiResponse<ModerateResponse>> => {
	try {
		const response = await api.post<ApiResponse<ModerateResponse>>(
			API_ENDPOINTS.AI.MODERATE,
			{ text, content_type: contentType },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ModerateResponse>>
		if (axiosError.response) return axiosError.response.data
		// Fail open - allow content if moderation service is down
		return {
			success: true,
			message: 'Moderation service unavailable, allowing content',
			statusCode: 200,
			data: {
				action: 'approve',
				category: 'clean',
				severity: 'low',
				confidence: 0,
				score: 0,
				reason: 'Moderation service unavailable',
				matched_terms: [],
				ai_used: false,
			},
		}
	}
}
