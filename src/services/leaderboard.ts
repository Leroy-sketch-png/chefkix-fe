/**
 * Leaderboard Service
 * Based on: .tmp/implemented_spec/03-social.txt
 */

import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types'
import { API_ENDPOINTS } from '@/constants/api'
import type { AxiosError } from 'axios'

// ============================================
// TYPES
// ============================================

export type LeaderboardType = 'global' | 'friends' | 'league'
export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'all_time'

export interface LeaderboardEntry {
	rank: number
	userId: string
	username: string
	displayName: string
	avatarUrl: string
	level: number
	xpThisWeek: number
	recipesCooked: number
	streak: number
}

export interface MyRank {
	rank: number
	xpThisWeek: number
	xpToNextRank?: number
	nextRankPosition?: number
}

export interface LeaderboardResponse {
	type: LeaderboardType
	timeframe: LeaderboardTimeframe
	entries: LeaderboardEntry[]
	myRank: MyRank
}

export interface LeaderboardParams {
	type?: LeaderboardType
	timeframe?: LeaderboardTimeframe
	limit?: number
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get leaderboard data
 * @param params - Filter options (type, timeframe, limit)
 */
export const getLeaderboard = async (
	params?: LeaderboardParams,
): Promise<ApiResponse<LeaderboardResponse>> => {
	try {
		const response = await api.get<ApiResponse<LeaderboardResponse>>(
			API_ENDPOINTS.LEADERBOARD.GET,
			{ params },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<LeaderboardResponse>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch leaderboard',
			statusCode: 500,
		}
	}
}

/**
 * Get current user's rank only (lightweight endpoint for header display)
 * @param timeframe - weekly | monthly | all_time
 */
export const getMyRank = async (
	timeframe: LeaderboardTimeframe = 'weekly',
): Promise<ApiResponse<MyRank>> => {
	try {
		const response = await api.get<ApiResponse<MyRank>>(
			API_ENDPOINTS.LEADERBOARD.MY_RANK,
			{ params: { timeframe } },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<MyRank>>
		if (axiosError.response) return axiosError.response.data
		return {
			success: false,
			message: 'Failed to fetch your rank',
			statusCode: 500,
		}
	}
}
