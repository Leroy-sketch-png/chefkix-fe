import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { AxiosError } from 'axios'

// ============================================
// TYPES - Based on implemented_spec/12-challenges.txt
// ============================================

export interface ChallengeCriteria {
	cuisineType?: string[]
	ingredientContains?: string[]
	maxTimeMinutes?: number
	difficulty?: ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT')[]
	skillTags?: string[]
}

export interface ChallengeMatchingRecipe {
	id: string
	title: string
	xpReward: number
	coverImageUrl: string
}

export interface DailyChallenge {
	id: string
	title: string
	description: string
	icon: string
	bonusXp: number
	criteria: ChallengeCriteria
	endsAt: string // ISO8601
	completed: boolean
	completedAt?: string
	matchingRecipes: ChallengeMatchingRecipe[]
}

export interface ChallengeHistoryItem {
	id: string
	title: string
	date: string // YYYY-MM-DD
	completed: boolean
	completedAt?: string
	bonusXpEarned: number
	recipeCooked?: {
		id: string
		title: string
	}
}

export interface ChallengeStats {
	totalCompleted: number
	currentStreak: number
	longestStreak: number
	totalBonusXp: number
}

export interface ChallengeHistoryResponse {
	challenges: ChallengeHistoryItem[]
	stats: ChallengeStats
}

// ============================================
// API ENDPOINTS
// ============================================

const API_BASE = '/api/v1/challenges'

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get today's daily challenge.
 * Returns the challenge details including matching recipes.
 */
export const getTodaysChallenge = async (): Promise<
	ApiResponse<DailyChallenge>
> => {
	try {
		const response = await api.get<ApiResponse<DailyChallenge>>(
			`${API_BASE}/today`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<DailyChallenge>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: "Failed to get today's challenge",
			statusCode: 500,
		}
	}
}

/**
 * Get challenge history for the user.
 * @param limit Number of past challenges to return (default: 7)
 */
export const getChallengeHistory = async (
	limit: number = 7,
): Promise<ApiResponse<ChallengeHistoryResponse>> => {
	try {
		const response = await api.get<ApiResponse<ChallengeHistoryResponse>>(
			`${API_BASE}/history`,
			{ params: { limit } },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<ChallengeHistoryResponse>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get challenge history',
			statusCode: 500,
		}
	}
}

/**
 * Get challenge stats only (without history items).
 * Convenience function that extracts stats from history response.
 */
export const getChallengeStats = async (): Promise<
	ApiResponse<ChallengeStats>
> => {
	try {
		const response = await getChallengeHistory(0) // No history items, just stats
		if (response.success && response.data) {
			return {
				success: true,
				message: 'Challenge stats fetched',
				statusCode: 200,
				data: response.data.stats,
			}
		}
		return {
			success: false,
			message: response.message || 'Failed to get challenge stats',
			statusCode: response.statusCode || 500,
		}
	} catch (error) {
		return {
			success: false,
			message: 'Failed to get challenge stats',
			statusCode: 500,
		}
	}
}
