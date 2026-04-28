/**
 * AI Service
 * Handles AI-powered features: recipe processing, metas calculation, cooking assistant, moderation
 * Based on: .tmp/implemented_spec/14-ai-integration.txt
 */

import { aiApi } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants/api'
import {
	getDirectAiPreflightFailure,
	handleDirectAiError,
} from './directAiClient'

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
	// Metas from AI - includes breakdown for transparency
	xpReward: number
	xpBreakdown: XPBreakdownFromAI
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

/**
 * XP calculation breakdown from AI service
 * Shows exactly how XP is calculated for transparency
 */
export interface XPBreakdownFromAI {
	base: number
	baseReason: string
	steps: number
	stepsReason: string
	time: number
	timeReason: string
	techniques?: number
	techniquesReason?: string
	total: number
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

// Ingredient Substitution
export type SubstitutionReason =
	| 'allergy'
	| 'unavailable'
	| 'preference'
	| 'dietary'

export interface SubstitutionRequest {
	ingredient: string
	reason: SubstitutionReason
	dietaryTags?: string[]
	recipeContext?: string
}

export interface Substitution {
	name: string
	ratio: string
	notes: string
	confidenceScore: number
}

export interface SubstitutionResponse {
	originalIngredient: string
	reason: string
	substitutions: Substitution[]
}

export type RemixType =
	| 'vegetarian'
	| 'vegan'
	| 'gluten-free'
	| 'spicy'
	| 'healthy'
	| 'quick'

export interface RemixRecipeRequest {
	recipe_title: string
	current_steps: string[]
	remix_type: RemixType
}

export interface RemixRecipeResponse {
	success: boolean
	remix_title: string
	modifications: string[]
	modified_steps: string[]
	new_ingredients: string[]
	removed_ingredients: string[]
	tip: string
}

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
	const preflightFailure = getDirectAiPreflightFailure<ProcessedRecipe>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<ProcessedRecipe>>(
			API_ENDPOINTS.AI.PROCESS_RECIPE,
			{ raw_text: rawText },
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<ProcessedRecipe>(
			error,
			'Failed to process recipe',
		)
	}
}

/**
 * Calculate XP, badges, and enrichment for a recipe
 * Use when: manually creating recipe, editing AI-generated recipe, or recalculating after changes
 */
export const calculateMetas = async (
	recipe: CalculateMetasRequest,
): Promise<ApiResponse<CalculateMetasResponse>> => {
	const preflightFailure = getDirectAiPreflightFailure<CalculateMetasResponse>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<CalculateMetasResponse>>(
			API_ENDPOINTS.AI.CALCULATE_METAS,
			recipe,
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<CalculateMetasResponse>(
			error,
			'Failed to calculate recipe metas',
		)
	}
}

/**
 * Validate recipe safety before publishing
 * Use when user clicks "Publish" button
 */
export const validateRecipe = async (
	recipe: ValidateRecipeRequest,
): Promise<ApiResponse<ValidateRecipeResponse>> => {
	const preflightFailure = getDirectAiPreflightFailure<ValidateRecipeResponse>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<ValidateRecipeResponse>>(
			API_ENDPOINTS.AI.VALIDATE_RECIPE,
			recipe,
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<ValidateRecipeResponse>(
			error,
			'Failed to validate recipe',
		)
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
	const preflightFailure =
		getDirectAiPreflightFailure<CookingAssistantResponse>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<CookingAssistantResponse>>(
			API_ENDPOINTS.AI.COOKING_ASSISTANT,
			{ query, context },
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<CookingAssistantResponse>(
			error,
			'AI assistant unavailable',
		)
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
	const preflightFailure = getDirectAiPreflightFailure<ModerateResponse>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<ModerateResponse>>(
			API_ENDPOINTS.AI.MODERATE,
			{ content: text, content_type: contentType },
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<ModerateResponse>(
			error,
			'Moderation service unavailable. Please try again.',
		)
	}
}

/**
 * Get AI-powered ingredient substitution suggestions
 * Use when user wants to replace an ingredient in a recipe
 */
export const suggestSubstitutions = async (
	ingredient: string,
	reason: SubstitutionReason,
	recipeContext?: string,
	dietaryTags?: string[],
): Promise<ApiResponse<SubstitutionResponse>> => {
	const preflightFailure = getDirectAiPreflightFailure<SubstitutionResponse>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<SubstitutionResponse>>(
			API_ENDPOINTS.AI.SUGGEST_SUBSTITUTIONS,
			{
				ingredient,
				reason,
				...(recipeContext && { recipe_context: recipeContext }),
				...(dietaryTags?.length && { dietary_tags: dietaryTags }),
			},
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<SubstitutionResponse>(
			error,
			'Failed to suggest substitutions',
		)
	}
}

/**
 * Remix a recipe with AI-powered variations (vegetarian, spicy, quick, etc.)
 */
export const remixRecipe = async (
	request: RemixRecipeRequest,
): Promise<ApiResponse<RemixRecipeResponse>> => {
	const preflightFailure = getDirectAiPreflightFailure<RemixRecipeResponse>()
	if (preflightFailure) return preflightFailure

	try {
		const response = await aiApi.post<ApiResponse<RemixRecipeResponse>>(
			API_ENDPOINTS.AI.REMIX_RECIPE,
			request,
		)
		return response.data
	} catch (error) {
		return handleDirectAiError<RemixRecipeResponse>(
			error,
			'Failed to remix recipe',
		)
	}
}
