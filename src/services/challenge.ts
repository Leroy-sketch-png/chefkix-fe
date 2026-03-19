import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse, Difficulty } from '@/lib/types'
import { AxiosError } from 'axios'

// ============================================
// TYPES - Based on implemented_spec/12-challenges.txt
// ============================================

export interface ChallengeCriteria {
	cuisineType?: string[]
	ingredientContains?: string[]
	maxTimeMinutes?: number
	difficulty?: Difficulty[]
	skillTags?: string[]
}

export interface ChallengeMatchingRecipe {
	id: string
	title: string
	xpReward: number
	coverImageUrl: string[] // BE returns array - use [0] for thumbnail
	totalTime?: number // BE includes this (minutes)
	difficulty?: Difficulty // BE includes this
}

export interface DailyChallenge {
	id: string
	title: string
	description: string
	icon?: string // NOTE: BE doesn't send this - may need BE addition or FE default
	bonusXp: number
	criteria: ChallengeCriteria | Record<string, unknown> // BE uses Map<String, Object>
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
		imageUrl?: string
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

// Weekly challenge (multi-completion target)
export interface WeeklyChallenge {
	id: string
	title: string
	description: string
	bonusXp: number
	target: number
	progress: number
	completed: boolean
	completedAt?: string
	startsAt: string // ISO8601 Monday 00:00 UTC
	endsAt: string // ISO8601 next Monday 00:00 UTC
	criteria: ChallengeCriteria | Record<string, unknown>
	matchingRecipes: ChallengeMatchingRecipe[]
}

// Community challenge (global collaborative progress, Redis-backed)
export interface CommunityChallenge {
	id: string
	title: string
	description: string
	emoji: string
	targetCount: number
	targetUnit: string
	currentProgress: number
	participantCount: number
	progressPercent: number
	rewardXpPerUser: number
	rewardBadgeId?: string
	startsAt: string
	endsAt: string
	status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
	hasContributed: boolean
	criteria: Record<string, unknown>
	tags: string[]
}

// Seasonal challenge (time-limited themed event, per-user progress)
export interface SeasonalChallenge {
	id: string
	title: string
	description: string
	emoji: string
	theme: string
	heroImageUrl?: string
	accentColor?: string
	targetCount: number
	targetUnit: string
	rewardXp: number
	rewardBadgeId?: string
	rewardBadgeName?: string
	startsAt: string
	endsAt: string
	status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
	userProgress: number
	userCompleted: boolean
	userCompletedAt?: string
	criteria: Record<string, unknown>
	featuredRecipes: ChallengeMatchingRecipe[]
	tags: string[]
}

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
			API_ENDPOINTS.CHALLENGES.TODAY,
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
			API_ENDPOINTS.CHALLENGES.HISTORY,
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

/**
 * Get this week's weekly challenge with progress.
 * Weekly challenges require multiple completions within a week (Mon-Sun).
 */
export const getWeeklyChallenge = async (): Promise<
	ApiResponse<WeeklyChallenge>
> => {
	try {
		const response = await api.get<ApiResponse<WeeklyChallenge>>(
			API_ENDPOINTS.CHALLENGES.WEEKLY,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<WeeklyChallenge>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get weekly challenge',
			statusCode: 500,
		}
	}
}

/**
 * Get active community challenges with live global progress.
 */
export const getCommunityChallenges = async (): Promise<
	ApiResponse<CommunityChallenge[]>
> => {
	try {
		const response = await api.get<ApiResponse<CommunityChallenge[]>>(
			API_ENDPOINTS.CHALLENGES.COMMUNITY,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<CommunityChallenge[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get community challenges',
			statusCode: 500,
		}
	}
}

/**
 * Get seasonal challenges (active + upcoming) with per-user progress.
 */
export const getSeasonalChallenges = async (): Promise<
	ApiResponse<SeasonalChallenge[]>
> => {
	try {
		const response = await api.get<ApiResponse<SeasonalChallenge[]>>(
			API_ENDPOINTS.CHALLENGES.SEASONAL,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<SeasonalChallenge[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get seasonal challenges',
			statusCode: 500,
		}
	}
}
