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

export interface TopRecipe {
	id: string
	title: string
	cookCount: number
	xpGenerated: number
}

export interface CreatorBadge {
	name: string
	icon: string
	recipeTitle: string
}

export interface WeekStats {
	newCooks: number
	xpEarned: number
}

export interface CreatorStats {
	totalRecipesPublished: number
	totalCooksOfYourRecipes: number
	xpEarnedAsCreator: number
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
