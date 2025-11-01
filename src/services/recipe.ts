import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	Recipe,
	RecipeCreateDto,
	RecipeUpdateDto,
	RecipeQueryParams,
} from '@/lib/types/recipe'

const API_BASE = '/api/recipes'

/**
 * Get all recipes with optional filters
 */
export const getAllRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(API_BASE, { params })
	return response.data
}

/**
 * Get a single recipe by ID
 */
export const getRecipeById = async (
	recipeId: string,
): Promise<ApiResponse<Recipe>> => {
	const response = await api.get(`${API_BASE}/${recipeId}`)
	return response.data
}

/**
 * Get recipes by user ID
 */
export const getRecipesByUserId = async (
	userId: string,
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(`${API_BASE}/user/${userId}`, {
		params,
	})
	return response.data
}

/**
 * Get feed recipes (from friends and followed users)
 */
export const getFeedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(`${API_BASE}/feed`, { params })
	return response.data
}

/**
 * Get trending recipes
 */
export const getTrendingRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(`${API_BASE}/trending`, { params })
	return response.data
}

/**
 * Create a new recipe
 */
export const createRecipe = async (
	data: RecipeCreateDto,
): Promise<ApiResponse<Recipe>> => {
	const response = await api.post(API_BASE, data)
	return response.data
}

/**
 * Update a recipe
 */
export const updateRecipe = async (
	recipeId: string,
	data: RecipeUpdateDto,
): Promise<ApiResponse<Recipe>> => {
	const response = await api.put(`${API_BASE}/${recipeId}`, data)
	return response.data
}

/**
 * Delete a recipe
 */
export const deleteRecipe = async (
	recipeId: string,
): Promise<ApiResponse<void>> => {
	const response = await api.delete(`${API_BASE}/${recipeId}`)
	return response.data
}

/**
 * Toggle like on a recipe
 */
export const toggleLikeRecipe = async (
	recipeId: string,
): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> => {
	const response = await api.post(`${API_BASE}/${recipeId}/like`)
	return response.data
}

/**
 * Toggle save on a recipe
 */
export const toggleSaveRecipe = async (
	recipeId: string,
): Promise<ApiResponse<{ isSaved: boolean; saveCount: number }>> => {
	const response = await api.post(`${API_BASE}/${recipeId}/save`)
	return response.data
}

/**
 * Get user's saved recipes
 */
export const getSavedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(`${API_BASE}/saved`, { params })
	return response.data
}

/**
 * Get user's liked recipes
 */
export const getLikedRecipes = async (
	params?: RecipeQueryParams,
): Promise<ApiResponse<Recipe[]>> => {
	const response = await api.get(`${API_BASE}/liked`, { params })
	return response.data
}
