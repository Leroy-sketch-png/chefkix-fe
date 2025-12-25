import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	Recipe,
	RecipeCreateRequest,
	RecipeUpdateRequest,
	RecipeQueryParams,
} from '@/lib/types/recipe'
import { API_ENDPOINTS } from '@/constants'
import { toBackendPagination, toBackendRecipeParams } from '@/lib/apiUtils'
import type { AxiosError } from 'axios'

// ============================================
// ADDITIONAL TYPES (from spec 07-recipes.txt)
// ============================================

export interface RecipeSearchParams {
	q: string
	limit?: number
}

export interface RecipeMastery {
	recipeId: string
	cookCount: number
	masteryLevel: 'none' | 'apprentice' | 'expert' | 'master'
	masteryBadge?: string
	nextMilestone?: {
		level: string
		cooksRequired: number
		cooksRemaining: number
	}
	xpEarned: {
		first: number
		second: number
		third: number
		total: number
	}
	lastCookedAt?: string
}

export interface RecipeCompleteRequest {
	timerLogs: Array<{
		stepNumber: number
		elapsedSeconds: number
	}>
	rating?: number
	notes?: string
}

export interface RecipeCompleteResponse {
	completionId: string
	recipeId: string
	xpEarned: number
	newBadges: string[]
	userProfile: {
		userId: string
		level: number
		currentXP: number
		currentXPGoal: number
		completionCount: number
	}
}

export interface PublishResponse {
	isPublished: boolean
	moderationStatus: 'approved' | 'pending' | 'rejected'
}

// ============================================
// EXISTING API FUNCTIONS
// ============================================

const API_BASE = API_ENDPOINTS.RECIPES.BASE

/**
 * Get all recipes with optional filters
 * Maps FE params to BE params (e.g., search → query)
 */
export const getAllRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const backendParams = toBackendRecipeParams(params as Record<string, unknown>)
	const response = await api.get(API_BASE, { params: backendParams })
	return response.data
}

/**
 * Get a single recipe by ID
 */
export const getRecipeById = async (
	recipeId: string,
): Promise<ApiResponse<Recipe>> => {
	const response = await api.get(API_ENDPOINTS.RECIPES.GET_BY_ID(recipeId))
	return response.data
}

/**
 * Get recipes by user ID
 * Maps FE params to BE params (e.g., search → query)
 */
export const getRecipesByUserId = async (
	userId: string,
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const backendParams = toBackendRecipeParams(params as Record<string, unknown>)
	const response = await api.get(API_ENDPOINTS.RECIPES.GET_BY_USER(userId), {
		params: backendParams,
	})
	return response.data
}

/**
 * Get feed recipes (from friends and followed users)
 * Maps FE params to BE params (e.g., search → query)
 */
export const getFeedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const backendParams = toBackendRecipeParams(params as Record<string, unknown>)
	const response = await api.get(API_ENDPOINTS.RECIPES.FEED, {
		params: backendParams,
	})
	return response.data
}

/**
 * Get trending recipes
 */
export const getTrendingRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const backendParams = toBackendPagination(params as any) ?? params
	const response = await api.get(API_ENDPOINTS.RECIPES.TRENDING, {
		params: backendParams,
	})
	return response.data
}

/**
 * Search recipes by query
 */
export const searchRecipes = async (
	params: RecipeSearchParams,
): Promise<ApiResponse<Recipe[]>> => {
	try {
		const response = await api.get(API_ENDPOINTS.RECIPES.SEARCH, { params })
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Recipe[]>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Search failed', statusCode: 500 }
	}
}

/**
 * Get current user's draft recipes
 */
export const getDraftRecipes = async (): Promise<ApiResponse<Recipe[]>> => {
	try {
		const response = await api.get(API_ENDPOINTS.RECIPES.DRAFTS)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Recipe[]>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch drafts',
			statusCode: 500,
		}
	}
}

// ============================================
// DRAFT MANAGEMENT (spec 07-recipes.txt)
// ============================================

export interface XpBreakdownDto {
	base: number
	baseReason?: string
	steps: number
	stepsReason?: string
	time: number
	timeReason?: string
	techniques?: number
	techniquesReason?: string
	total: number
}

export interface DraftSaveRequest {
	title?: string
	description?: string
	coverImageUrl?: string[]
	difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
	prepTimeMinutes?: number
	cookTimeMinutes?: number
	servings?: number
	cuisineType?: string
	dietaryTags?: string[]
	caloriesPerServing?: number
	fullIngredientList?: Array<{
		name: string
		quantity: string
		unit: string
	}>
	steps?: Array<{
		stepNumber: number
		title?: string
		description: string
		action?: string
		ingredients?: Array<{ name: string; quantity: string; unit: string }>
		timerSeconds?: number
		imageUrl?: string
		tips?: string
	}>
	// Gamification (from AI service)
	xpReward?: number
	xpBreakdown?: XpBreakdownDto
	difficultyMultiplier?: number
	rewardBadges?: string[]
	skillTags?: string[]
}

/**
 * Create a new empty draft (call when user starts creating a recipe)
 */
export const createDraft = async (): Promise<ApiResponse<Recipe>> => {
	try {
		const response = await api.post(API_ENDPOINTS.RECIPES.CREATE_DRAFT)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		console.error('[createDraft] Error details:', {
			status: axiosError.response?.status,
			statusText: axiosError.response?.statusText,
			data: axiosError.response?.data,
			message: axiosError.message,
		})
		if (axiosError.response?.data) {
			return {
				...axiosError.response.data,
				success: false,
				statusCode: axiosError.response.status || 500,
			}
		}
		return {
			success: false,
			message: axiosError.message || 'Failed to create draft',
			statusCode: axiosError.response?.status || 500,
		}
	}
}

/**
 * Save/auto-save a draft (PATCH - partial update)
 */
export const saveDraft = async (
	draftId: string,
	data: DraftSaveRequest,
): Promise<ApiResponse<Recipe>> => {
	try {
		const response = await api.patch(
			API_ENDPOINTS.RECIPES.SAVE_DRAFT(draftId),
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		console.error('[saveDraft] Error details:', {
			status: axiosError.response?.status,
			statusText: axiosError.response?.statusText,
			data: axiosError.response?.data,
			message: axiosError.message,
		})
		if (axiosError.response?.data) {
			// Ensure the response has success: false
			return {
				...axiosError.response.data,
				success: false,
				statusCode: axiosError.response.status || 500,
			}
		}
		return {
			success: false,
			message: axiosError.message || 'Failed to save draft',
			statusCode: axiosError.response?.status || 500,
		}
	}
}

/**
 * Discard a draft
 */
export const discardDraft = async (
	draftId: string,
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.delete(
			API_ENDPOINTS.RECIPES.DISCARD_DRAFT(draftId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to discard draft',
			statusCode: 500,
		}
	}
}

/**
 * Create a new recipe
 */
export const createRecipe = async (
	data: RecipeCreateRequest,
): Promise<ApiResponse<Recipe>> => {
	const response = await api.post(API_ENDPOINTS.RECIPES.CREATE, data)
	return response.data
}

/**
 * Update a recipe
 */
export const updateRecipe = async (
	recipeId: string,
	data: RecipeUpdateRequest,
): Promise<ApiResponse<Recipe>> => {
	const response = await api.put(API_ENDPOINTS.RECIPES.UPDATE(recipeId), data)
	return response.data
}

/**
 * Delete a recipe
 */
export const deleteRecipe = async (
	recipeId: string,
): Promise<ApiResponse<void>> => {
	const response = await api.delete(API_ENDPOINTS.RECIPES.DELETE(recipeId))
	return response.data
}

/**
 * Toggle like on a recipe
 */
export const toggleLikeRecipe = async (
	recipeId: string,
): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> => {
	const response = await api.post(API_ENDPOINTS.RECIPES.TOGGLE_LIKE(recipeId))
	return response.data
}

/**
 * Toggle save on a recipe
 */
export const toggleSaveRecipe = async (
	recipeId: string,
): Promise<ApiResponse<{ isSaved: boolean; saveCount: number }>> => {
	const response = await api.post(API_ENDPOINTS.RECIPES.TOGGLE_SAVE(recipeId))
	return response.data
}

/**
 * Get user's saved recipes
 */
export const getSavedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(API_ENDPOINTS.RECIPES.SAVED, { params })
	return response.data
}

/**
 * Get user's liked recipes
 */
export const getLikedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(API_ENDPOINTS.RECIPES.LIKED, { params })
	return response.data
}

// ============================================
// NEW API FUNCTIONS (from spec 07-recipes.txt)
// ============================================

/**
 * Complete a recipe (legacy - prefer cooking sessions flow)
 * Note: This bypasses session system. Use cooking sessions for proper XP tracking.
 */
export const completeRecipe = async (
	recipeId: string,
	data: RecipeCompleteRequest,
): Promise<ApiResponse<RecipeCompleteResponse>> => {
	try {
		const response = await api.post(
			API_ENDPOINTS.RECIPES.COMPLETE(recipeId),
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<RecipeCompleteResponse>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to complete recipe',
			statusCode: 500,
		}
	}
}

/**
 * Get user's mastery progress for a recipe
 */
export const getRecipeMastery = async (
	recipeId: string,
): Promise<ApiResponse<RecipeMastery>> => {
	try {
		const response = await api.get(API_ENDPOINTS.RECIPES.MASTERY(recipeId))
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<RecipeMastery>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch mastery',
			statusCode: 500,
		}
	}
}

/**
 * Publish a recipe (with moderation check)
 */
export const publishRecipe = async (
	recipeId: string,
): Promise<ApiResponse<PublishResponse>> => {
	try {
		const response = await api.post(API_ENDPOINTS.RECIPES.PUBLISH(recipeId))
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<PublishResponse>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to publish recipe',
			statusCode: 500,
		}
	}
}

/**
 * Preview recipe as it will appear when published
 */
export const previewRecipe = async (
	recipeId: string,
): Promise<ApiResponse<Recipe>> => {
	try {
		const response = await api.get(API_ENDPOINTS.RECIPES.PREVIEW(recipeId))
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to preview recipe',
			statusCode: 500,
		}
	}
}

/**
 * Regenerate recipe with AI (recalculate XP, badges, enrichment)
 */
export const regenerateRecipe = async (
	recipeId: string,
	aiResponse: Record<string, unknown>,
): Promise<
	ApiResponse<Recipe & { currentVersion: number; versionsAvailable: number[] }>
> => {
	try {
		const response = await api.post(
			API_ENDPOINTS.RECIPES.REGENERATE(recipeId),
			{
				aiResponse,
			},
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) return axiosError.response.data as any
		return {
			success: false,
			message: 'Failed to regenerate recipe',
			statusCode: 500,
		}
	}
}

/**
 * Revert recipe to a previous version
 */
export const revertRecipe = async (
	recipeId: string,
	version: number,
): Promise<ApiResponse<Recipe>> => {
	try {
		const response = await api.post(API_ENDPOINTS.RECIPES.REVERT(recipeId), {
			version,
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to revert recipe',
			statusCode: 500,
		}
	}
}

/**
 * Upload recipe images
 */
export const uploadRecipeImages = async (
	files: File[],
): Promise<ApiResponse<string[]>> => {
	try {
		const formData = new FormData()
		files.forEach(file => formData.append('files', file))
		const response = await api.post(API_ENDPOINTS.RECIPES.UPLOAD, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<string[]>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to upload images',
			statusCode: 500,
		}
	}
}
