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
