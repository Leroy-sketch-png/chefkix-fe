import { api } from '@/lib/axios'
import { ApiResponse, PaginationMeta } from '@/lib/types/common'
import {
	Recipe,
	RecipeSummary,
	RecipeCreateRequest,
	RecipeUpdateRequest,
	RecipeQueryParams,
} from '@/lib/types/recipe'
import { API_ENDPOINTS } from '@/constants'
import { toBackendPagination, toBackendRecipeParams } from '@/lib/apiUtils'
import type { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

// ============================================
// ADDITIONAL TYPES (from spec 07-recipes.txt)
// ============================================

export interface RecipeSearchParams {
	q: string
	limit?: number
}

export interface PublishResponse {
	isPublished: boolean
	moderationStatus: 'approved' | 'pending' | 'rejected'
}

/**
 * Pagination metadata from culinary module.
 * Uses the canonical PaginationMeta from common.ts which matches
 * BE ApiResponse.PaginationMeta (page/size/totalElements/totalPages/first/last).
 */
export type PaginatedRecipeResponse = ApiResponse<Recipe[]> & {
	pagination?: PaginationMeta
}

// ============================================
// EXISTING API FUNCTIONS
// ============================================

const API_BASE = API_ENDPOINTS.RECIPES.BASE

/**
 * Get all recipes with optional filters
 * Maps FE params to BE params (e.g., search → query)
 * Returns pagination metadata for infinite scroll
 */
export const getAllRecipes = async (
	params?: RecipeQueryParams,
): Promise<PaginatedRecipeResponse> => {
	try {
		const backendParams = toBackendRecipeParams(
			params as Record<string, unknown>,
		)
		const response = await api.get<PaginatedRecipeResponse>(API_BASE, {
			params: backendParams,
		})
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<PaginatedRecipeResponse>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch recipes',
			statusCode: 500,
		}
	}
}

/**
 * Get a single recipe by ID
 */
export const getRecipeById = async (
	recipeId: string,
): Promise<ApiResponse<Recipe>> => {
	// Guard against undefined/null recipeId to prevent /recipes/undefined requests
	if (!recipeId) {
		logDevError('[getRecipeById] Called with undefined/null recipeId')
		return {
			success: false,
			statusCode: 400,
			message: 'Recipe ID is required',
			data: null as unknown as Recipe,
		}
	}
	try {
		const response = await api.get(API_ENDPOINTS.RECIPES.GET_BY_ID(recipeId))
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch recipe',
			statusCode: 500,
		}
	}
}

/**
 * Get recipes by user ID
 * Maps FE params to BE params (e.g., search → query)
 */
export const getRecipesByUserId = async (
	userId: string,
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	try {
		const backendParams = toBackendRecipeParams(
			params as Record<string, unknown>,
		)
		const response = await api.get(API_ENDPOINTS.RECIPES.GET_BY_USER(userId), {
			params: backendParams,
		})
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe[]>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch user recipes',
			statusCode: 500,
		}
	}
}

/**
 * Get feed recipes (from friends and followed users)
 * Maps FE params to BE params (e.g., search → query)
 */
export const getFeedRecipes = async (
	params?: RecipeQueryParams,
): Promise<PaginatedRecipeResponse> => {
	try {
		const backendParams = toBackendRecipeParams(
			params as Record<string, unknown>,
		)
		const response = await api.get<PaginatedRecipeResponse>(
			API_ENDPOINTS.RECIPES.FEED,
			{
				params: backendParams,
			},
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<PaginatedRecipeResponse>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch feed recipes',
			statusCode: 500,
		}
	}
}

/**
 * Get trending recipes
 * Returns pagination metadata for infinite scroll
 */
export const getTrendingRecipes = async (
	params?: RecipeQueryParams,
): Promise<PaginatedRecipeResponse> => {
	try {
		const backendParams = toBackendPagination(params as any) ?? params
		const response = await api.get<PaginatedRecipeResponse>(
			API_ENDPOINTS.RECIPES.TRENDING,
			{
				params: backendParams,
			},
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<PaginatedRecipeResponse>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch trending recipes',
			statusCode: 500,
		}
	}
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
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe[]>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Search failed', statusCode: 500 }
	}
}

/**
 * Get tonight's personalized recipe recommendation.
 * Uses cooking history + trending for taste-based picks.
 */
export const getTonightsPick = async (): Promise<ApiResponse<Recipe>> => {
	try {
		const response = await api.get<ApiResponse<Recipe>>(
			API_ENDPOINTS.RECIPES.TONIGHT_PICK,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch tonight\'s pick',
			statusCode: 500,
		}
	}
}

/**
 * Get similar recipes based on cuisine, difficulty, and ingredients.
 */
export const getSimilarRecipes = async (
	recipeId: string,
	size: number = 6,
): Promise<PaginatedRecipeResponse> => {
	try {
		const response = await api.get<PaginatedRecipeResponse>(
			API_ENDPOINTS.RECIPES.SIMILAR(recipeId),
			{ params: { size } },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<PaginatedRecipeResponse>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch similar recipes',
			statusCode: 500,
		}
	}
}

/**
 * Get current user's draft recipes.
 *
 * IMPORTANT: Backend returns RecipeSummaryResponse[] (no ingredients/steps).
 * When resuming a draft for editing, use getRecipeById() to fetch full data.
 */
export const getDraftRecipes = async (): Promise<
	ApiResponse<RecipeSummary[]>
> => {
	try {
		const response = await api.get(API_ENDPOINTS.RECIPES.DRAFTS)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<RecipeSummary[]>>
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
		videoUrl?: string
		videoThumbnailUrl?: string
		videoDurationSec?: number
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
		logDevError('[createDraft] Error details:', {
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
		logDevError('[saveDraft] Error details:', {
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
		logDevError('response failed:', error)
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
	try {
		const response = await api.post<ApiResponse<Recipe>>(
			API_ENDPOINTS.RECIPES.CREATE,
			data,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to create recipe',
			statusCode: 500,
		}
	}
}

/**
 * Update a recipe
 */
export const updateRecipe = async (
	recipeId: string,
	data: RecipeUpdateRequest,
): Promise<ApiResponse<Recipe>> => {
	try {
		const response = await api.put<ApiResponse<Recipe>>(
			API_ENDPOINTS.RECIPES.UPDATE(recipeId),
			data,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to update recipe',
			statusCode: 500,
		}
	}
}

/**
 * Delete a recipe
 */
export const deleteRecipe = async (
	recipeId: string,
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.delete<ApiResponse<void>>(
			API_ENDPOINTS.RECIPES.DELETE(recipeId),
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to delete recipe',
			statusCode: 500,
		}
	}
}

/**
 * Toggle like on a recipe
 */
export const toggleLikeRecipe = async (
	recipeId: string,
): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> => {
	try {
		const response = await api.post<
			ApiResponse<{ isLiked: boolean; likeCount: number }>
		>(API_ENDPOINTS.RECIPES.TOGGLE_LIKE(recipeId))
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<
			ApiResponse<{ isLiked: boolean; likeCount: number }>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to toggle like',
			statusCode: 500,
		}
	}
}

/**
 * Toggle save on a recipe
 */
export const toggleSaveRecipe = async (
	recipeId: string,
): Promise<ApiResponse<{ isSaved: boolean; saveCount: number }>> => {
	try {
		const response = await api.post<
			ApiResponse<{ isSaved: boolean; saveCount: number }>
		>(API_ENDPOINTS.RECIPES.TOGGLE_SAVE(recipeId))
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<
			ApiResponse<{ isSaved: boolean; saveCount: number }>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to toggle save',
			statusCode: 500,
		}
	}
}

/**
 * Get user's saved recipes
 */
export const getSavedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	try {
		const response = await api.get<ApiResponse<Recipe[]>>(
			API_ENDPOINTS.RECIPES.SAVED,
			{ params },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch saved recipes',
			statusCode: 500,
		}
	}
}

/**
 * Get user's liked recipes
 */
export const getLikedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	try {
		const response = await api.get<ApiResponse<Recipe[]>>(
			API_ENDPOINTS.RECIPES.LIKED,
			{ params },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch liked recipes',
			statusCode: 500,
		}
	}
}

// ============================================
// NEW API FUNCTIONS (from spec 07-recipes.txt)
// ============================================

/**
 * Publish a recipe (with moderation check)
 */
export const publishRecipe = async (
	recipeId: string,
	visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE' = 'PUBLIC',
): Promise<ApiResponse<PublishResponse>> => {
	try {
		const response = await api.post(API_ENDPOINTS.RECIPES.PUBLISH(recipeId), {
			visibility,
		})
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
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
 * Duplicate any owned recipe as a new DRAFT.
 * Deep-copies all content; resets status and social counters.
 */
export const duplicateRecipe = async (
	recipeId: string,
): Promise<ApiResponse<Recipe>> => {
	try {
		const response = await api.post(API_ENDPOINTS.RECIPES.DUPLICATE(recipeId))
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Recipe>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to duplicate recipe',
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
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string[]>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to upload images',
			statusCode: 500,
		}
	}
}

/**
 * Upload a step video.
 * Returns { url, thumbnailUrl, durationSec }.
 * Spec: vision_and_spec/20-media-lifecycle.txt §2
 * Constraints: mp4/webm only, max 50MB, max 60 seconds.
 */
export interface VideoUploadResult {
	url: string
	thumbnailUrl: string
	durationSec: number | null
}

export const uploadStepVideo = async (
	file: File,
): Promise<ApiResponse<VideoUploadResult>> => {
	try {
		const formData = new FormData()
		formData.append('file', file)
		const response = await api.post(
			API_ENDPOINTS.RECIPES.UPLOAD_VIDEO,
			formData,
			{
				headers: { 'Content-Type': 'multipart/form-data' },
				timeout: 120000, // 2 min timeout for video uploads
			},
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<VideoUploadResult>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to upload video',
			statusCode: 500,
		}
	}
}
