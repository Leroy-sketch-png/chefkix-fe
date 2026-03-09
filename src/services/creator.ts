/**
 * Creator Stats Service
 * Based on: .tmp/implemented_spec/03-social.txt
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants/api'
import type { AxiosError } from 'axios'

// ============================================
// TYPES
// ============================================

/**
 * Top recipe info for creator stats
 * Per vision_and_spec/03-social.txt - Phase 1 (MVP) fields
 */
export interface TopRecipe {
	id: string
	title: string
	cookCount: number
	xpGenerated: number
	// New fields from BE (Phase 1)
	coverImageUrl: string | null
	cookTimeMinutes: number | null
	difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null
	averageRating: number | null
}

export interface CreatorBadge {
	name: string
	icon: string
	recipeTitle: string
}

export interface WeekStats {
	newCooks: number
	xpEarned: number
	// Phase 2: newCooksChange, xpEarnedChange (requires historical data)
}

/**
 * Creator stats response
 * Per vision_and_spec/03-social.txt
 */
export interface CreatorStats {
	totalRecipesPublished: number
	totalCooksOfYourRecipes: number
	xpEarnedAsCreator: number
	avgRating: number | null // Average across all recipes
	topRecipe: TopRecipe | null
	thisWeek: WeekStats
	creatorBadges: CreatorBadge[]
}

// ============================================
// CREATOR ANALYTICS TYPES (spec: 21-creator-analytics.txt)
// ============================================

export interface RecipePerformanceItem {
	id: string
	title: string
	coverImageUrl: string[]
	difficulty: string | null
	xpReward: number
	cookCount: number
	masteredByCount: number
	averageRating: number | null
	creatorXpEarned: number | null
	likeCount: number
	saveCount: number
	viewCount: number
}

export interface CreatorPerformanceSummary {
	totalRecipes: number
	totalCooks: number
	totalViews: number
	totalLikes: number
	averageRating: number
}

export interface CreatorPerformanceResponse {
	recipes: RecipePerformanceItem[]
	summary: CreatorPerformanceSummary
}

export interface RecentCookItem {
	sessionId: string
	recipeId: string
	recipeTitle: string
	coverImageUrl: string[]
	cookUserId: string
	cookDisplayName: string | null
	cookAvatarUrl: string | null
	cookUsername: string | null
	completedAt: string // ISO datetime
	rating: number | null
}

export interface RecentCooksResponse {
	cooks: RecentCookItem[]
	totalCount: number
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get creator statistics for current user
 * Shows how their published recipes are performing
 */
export const getCreatorStats = async (): Promise<ApiResponse<CreatorStats>> => {
	try {
		const response = await api.get<ApiResponse<CreatorStats>>(
			API_ENDPOINTS.CREATOR.STATS,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CreatorStats>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch creator stats',
			statusCode: 500,
		}
	}
}

/**
 * Get per-recipe performance metrics for the creator dashboard.
 * Returns all published recipes with individual stats + aggregate summary.
 */
export const getCreatorPerformance = async (): Promise<
	ApiResponse<CreatorPerformanceResponse>
> => {
	try {
		const response = await api.get<ApiResponse<CreatorPerformanceResponse>>(
			API_ENDPOINTS.CREATOR.PERFORMANCE,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<CreatorPerformanceResponse>
		>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch creator performance',
			statusCode: 500,
		}
	}
}

/**
 * Get recent cooking sessions on the creator's recipes.
 * Shows who cooked your recipes and when.
 */
export const getRecentCooks = async (
	page: number = 0,
	size: number = 20,
): Promise<ApiResponse<RecentCooksResponse>> => {
	try {
		const response = await api.get<ApiResponse<RecentCooksResponse>>(
			API_ENDPOINTS.CREATOR.RECENT_COOKS,
			{ params: { page, size } },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<RecentCooksResponse>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch recent cooks',
			statusCode: 500,
		}
	}
}
