import { Profile } from './profile'

/**
 * Response from toggleFollow API.
 * Returns the target user's full profile with updated isFollowing status.
 */
export type ToggleFollowResponse = Profile

/** Cuisine breakdown in taste profile */
export interface CuisineBreakdown {
	cuisine: string
	percentage: number
	interactionCount: number
}

/** Taste profile response from POST /taste-profile */
export interface TasteProfileResponse {
	tasteVector: Record<string, number>
	cuisineDistribution: CuisineBreakdown[]
	totalInteractions: number
	topCuisines: string[]
}
