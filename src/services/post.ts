import { api } from '@/lib/axios'
import {
	ApiResponse,
	PaginationMeta,
	Post,
	CreatePostRequest,
	UpdatePostRequest,
	ToggleLikeResponse,
	PostWithXpResponse,
	Page,
} from '@/lib/types'
import {
	PollVoteResponse,
	PlateRateResponse,
	RecipeReviewStatsResponse,
	BattleVoteResponse,
} from '@/lib/types/post'
import type { TasteProfileResponse } from '@/lib/types/social'
import { API_ENDPOINTS } from '@/constants'
import { toBackendPagination } from '@/lib/apiUtils'
import { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

type PostPageData = {
	content: Post[]
	totalElements: number
	totalPages: number
	number: number
	size: number
	first: boolean
	last: boolean
}

const isPostPageData = (data: unknown): data is PostPageData => {
	if (!data || typeof data !== 'object' || !('content' in data)) return false
	const candidate = data as { content?: unknown }
	return Array.isArray(candidate.content)
}

const mapPostPageResponse = (
	response: ApiResponse<PostPageData | Post[]>,
): ApiResponse<Post[]> & { pagination?: PaginationMeta } => {
	if (!response.success || !response.data) {
		return {
			...response,
			data: Array.isArray(response.data) ? response.data : [],
		}
	}

	if (Array.isArray(response.data)) {
		return {
			...response,
			data: response.data,
		}
	}

	if (isPostPageData(response.data)) {
		return {
			...response,
			data: response.data.content,
			pagination: {
				page: response.data.number,
				size: response.data.size,
				totalElements: response.data.totalElements,
				totalPages: response.data.totalPages,
				first: response.data.first,
				last: response.data.last,
			},
		}
	}

	return {
		success: false,
		message: 'Unexpected response format',
		statusCode: 500,
		data: [],
	}
}

/**
 * Post API Service
 *
 * API Behavior Summary (from backend spec):
 *
 * 1. createPost:
 *    - Sends multipart/form-data with content, photoUrls (files), videoUrl, tags
 *    - Optional: sessionId to link post to cooking session for XP unlock
 *    - Optional: isPrivateRecipe for private recipe attempts
 *    - Returns full Post object with uploaded image URLs from Cloudinary
 *    - If sessionId provided: returns XP awarded, badges earned
 *    - Emits Kafka event "post-delivery"
 *
 * 2. updatePost:
 *    - Only post owner can update
 *    - Only allowed within 1 hour of creation
 *    - Can update content and tags only (not images/video)
 *    - Returns updated Post
 *
 * 3. deletePost:
 *    - Only post owner can delete
 *    - Emits Kafka event "post-deleted-delivery"
 *
 * 4. toggleLike:
 *    - If not liked: adds like (+1) and emits "post-liked-delivery"
 *    - If already liked: removes like (unlike)
 *    - Returns updated Post with new like count
 */

export const createPost = async (
	data: CreatePostRequest,
): Promise<ApiResponse<Post | PostWithXpResponse>> => {
	try {
		const formData = new FormData()
		formData.append('content', data.content)

		// Append multiple image files
		if (data.photoUrls && data.photoUrls.length > 0) {
			data.photoUrls.forEach(file => {
				formData.append('photoUrls', file)
			})
		}

		if (data.videoUrl) {
			formData.append('videoUrl', data.videoUrl)
		}

		if (data.tags && data.tags.length > 0) {
			data.tags.forEach(tag => {
				formData.append('tags', tag)
			})
		}

		if (data.avatarUrl) {
			formData.append('avatarUrl', data.avatarUrl)
		}

		// Session linking for XP unlock (per spec 05-posts.txt)
		if (data.sessionId) {
			formData.append('sessionId', data.sessionId)
		}

		if (data.isPrivateRecipe !== undefined) {
			formData.append('isPrivateRecipe', String(data.isPrivateRecipe))
		}

		if (data.taggedUserIds && data.taggedUserIds.length > 0) {
			data.taggedUserIds.forEach(id => {
				formData.append('taggedUserIds', id)
			})
		}

		if (data.postType) {
			formData.append('postType', data.postType)
		}

		// Poll fields (only when postType === 'POLL')
		if (data.pollQuestion) {
			formData.append('pollQuestion', data.pollQuestion)
		}
		if (data.pollOptionA) {
			formData.append('pollOptionA', data.pollOptionA)
		}
		if (data.pollOptionB) {
			formData.append('pollOptionB', data.pollOptionB)
		}

		const response = await api.post<ApiResponse<Post | PostWithXpResponse>>(
			API_ENDPOINTS.POST.CREATE,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			},
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

/**
 * Create a post within a specific group.
 * Uses the group-specific endpoint so the post is associated with the group
 * and filtered correctly in feeds.
 */
export const createGroupPost = async (
	groupId: string,
	data: CreatePostRequest,
): Promise<ApiResponse<Post>> => {
	try {
		const formData = new FormData()
		formData.append('content', data.content)
		formData.append('postType', 'GROUP')

		if (data.photoUrls && data.photoUrls.length > 0) {
			data.photoUrls.forEach(file => {
				formData.append('photoUrls', file)
			})
		}

		if (data.avatarUrl) {
			formData.append('avatarUrl', data.avatarUrl)
		}

		const response = await api.post<ApiResponse<Post>>(
			API_ENDPOINTS.GROUPS.CREATE_POST(groupId),
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			},
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to create group post. Please try again.',
			statusCode: 500,
		}
	}
}

/**
 * Get a single post by ID.
 * Useful for post detail pages and notifications that link to a specific post.
 */
export const getPostById = async (
	postId: string,
): Promise<ApiResponse<Post>> => {
	try {
		const response = await api.get<ApiResponse<Post>>(
			API_ENDPOINTS.POST.GET_BY_ID(postId),
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Post not found or an error occurred.',
			statusCode: 500,
		}
	}
}

/**
 * Get posts saved/bookmarked by the current user.
 */
export const getSavedPosts = async (
	page: number = 0,
	size: number = 20,
): Promise<ApiResponse<Page<Post>>> => {
	try {
		const params = toBackendPagination({ page, size })
		const response = await api.get<ApiResponse<Page<Post>>>(
			API_ENDPOINTS.POST.GET_SAVED,
			{ params },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Page<Post>>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to load saved posts.',
			statusCode: 500,
		}
	}
}

export const updatePost = async (
	postId: string,
	data: UpdatePostRequest,
): Promise<ApiResponse<Post>> => {
	try {
		const response = await api.put<ApiResponse<Post>>(
			API_ENDPOINTS.POST.UPDATE(postId),
			data,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

export const deletePost = async (
	postId: string,
): Promise<ApiResponse<string>> => {
	try {
		const response = await api.delete<ApiResponse<string>>(
			API_ENDPOINTS.POST.DELETE(postId),
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<string>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

export const toggleLike = async (
	postId: string,
): Promise<ApiResponse<ToggleLikeResponse>> => {
	try {
		const response = await api.post<ApiResponse<ToggleLikeResponse>>(
			API_ENDPOINTS.POST.TOGGLE_LIKE(postId),
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<ToggleLikeResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

/**
 * Get personalized feed from users the current user follows + their own posts.
 * Mirrors getFeedPosts but hits /posts/following instead of /posts/all.
 * Always requires authentication (no anonymous access).
 */
export const getFollowingFeedPosts = async (params?: {
	limit?: number
	offset?: number
	page?: number
	size?: number
	mode?: 'latest' | 'trending'
}): Promise<
	ApiResponse<Post[]> & {
		pagination?: PaginationMeta
	}
> => {
	try {
		const backendParams = toBackendPagination(params) ?? params
		const response = await api.get<ApiResponse<PostPageData | Post[]>>(
			API_ENDPOINTS.POST.GET_FOLLOWING,
			{
				params: {
					...backendParams,
					mode: params?.mode === 'trending' ? 1 : 0,
				},
			},
		)
		return mapPostPageResponse(response.data)
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<PostPageData | Post[]>>
		if (axiosError.response) {
			return mapPostPageResponse(axiosError.response.data)
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
			data: [],
		}
	}
}

export const getFeedPosts = async (params?: {
	limit?: number
	offset?: number
	page?: number
	size?: number
	mode?: 'latest' | 'trending' | 'forYou' // 0 = latest (default), 1 = trending (hotScore), 2 = forYou (taste-based)
}): Promise<
	ApiResponse<Post[]> & {
		pagination?: PaginationMeta
	}
> => {
	try {
		const backendParams = toBackendPagination(params) ?? params
		const modeMap = { latest: 0, trending: 1, forYou: 2 } as const
		const response = await api.get<ApiResponse<PostPageData | Post[]>>(
			API_ENDPOINTS.POST.GET_ALL,
			{
				params: {
					...backendParams,
					mode: modeMap[params?.mode ?? 'latest'],
				},
			},
		)
		return mapPostPageResponse(response.data)
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<PostPageData | Post[]>>
		if (axiosError.response) {
			return mapPostPageResponse(axiosError.response.data)
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
			data: [],
		}
	}
}

/**
 * Toggle save/bookmark on a post
 * Returns the new save state
 */
export const toggleSave = async (
	postId: string,
): Promise<ApiResponse<{ isSaved: boolean; saveCount: number }>> => {
	try {
		const response = await api.post<
			ApiResponse<{ isSaved: boolean; saveCount: number }>
		>(API_ENDPOINTS.POST.TOGGLE_SAVE(postId))
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
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

export const votePoll = async (
	postId: string,
	option: 'A' | 'B',
): Promise<ApiResponse<PollVoteResponse>> => {
	try {
		const response = await api.post<ApiResponse<PollVoteResponse>>(
			API_ENDPOINTS.POST.VOTE_POLL(postId),
			{ option },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<PollVoteResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

export const ratePlate = async (
	postId: string,
	rating: 'FIRE' | 'CRINGE',
): Promise<ApiResponse<PlateRateResponse>> => {
	try {
		const response = await api.post<ApiResponse<PlateRateResponse>>(
			API_ENDPOINTS.POST.RATE_PLATE(postId),
			{ rating },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<PlateRateResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

export const getPostsByUser = async (
	userId: string,
	params?: { limit?: number; offset?: number; page?: number; size?: number },
): Promise<ApiResponse<Post[]>> => {
	try {
		const backendParams = toBackendPagination(params) ?? params
		// Backend returns Page<Post>, not Post[]
		const response = await api.get<ApiResponse<Page<Post> | Post[]>>(
			API_ENDPOINTS.POST.GET_FEED(userId),
			{
				params: backendParams,
			},
		)

		// Handle both Page<Post> (with .content) and Post[] (direct array) responses
		const data = response.data.data
		let posts: Post[] = []

		if (data) {
			if (Array.isArray(data)) {
				// Already an array
				posts = data
			} else if ('content' in data && Array.isArray(data.content)) {
				// Page response - extract content array
				posts = data.content
			}
		}

		return {
			...response.data,
			data: posts,
		}
	} catch (error) {
		logDevError('data failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

/**
 * Report response type
 */
export interface ReportResponse {
	reportId: string
	targetType: string
	targetId: string
	reason: string
	reportCount: number
	reviewTriggered: boolean
	createdAt: string
}

/**
 * Report a post for content moderation.
 * Per spec 13-moderation.txt:
 * - Max 3 reports per day per user
 * - 3 unique reports on same content triggers admin review
 */
export const reportPost = async (
	postId: string,
	data: { reason: string; details?: string },
): Promise<ApiResponse<ReportResponse>> => {
	try {
		const response = await api.post<ApiResponse<ReportResponse>>(
			API_ENDPOINTS.POST.REPORT,
			{
				targetType: 'post',
				targetId: postId,
				reason: data.reason,
				details: data.details,
			},
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<ReportResponse>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'An unexpected error occurred. Please try again later.',
			statusCode: 500,
		}
	}
}

// ========================================================================
// RECIPE REVIEWS
// ========================================================================

/**
 * Get all reviews for a specific recipe.
 * GET /api/v1/posts/reviews/recipe/{recipeId}
 */
export const getReviewsForRecipe = async (
	recipeId: string,
	page = 0,
	size = 10,
): Promise<ApiResponse<Post[]>> => {
	try {
		const params = toBackendPagination({ page, size })
		const response = await api.get<ApiResponse<Post[] | PostPageData>>(
			API_ENDPOINTS.POST.GET_REVIEWS_FOR_RECIPE(recipeId),
			{ params },
		)
		return mapPostPageResponse(response.data)
	} catch (error) {
		logDevError('getReviewsForRecipe failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post[]>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load reviews', statusCode: 500 }
	}
}

/**
 * Get aggregate review stats for a recipe.
 * GET /api/v1/posts/reviews/recipe/{recipeId}/stats
 */
export const getRecipeReviewStats = async (
	recipeId: string,
): Promise<ApiResponse<RecipeReviewStatsResponse>> => {
	try {
		const response = await api.get<ApiResponse<RecipeReviewStatsResponse>>(
			API_ENDPOINTS.POST.GET_REVIEW_STATS(recipeId),
		)
		return response.data
	} catch (error) {
		logDevError('getRecipeReviewStats failed:', error)
		const axiosError = error as AxiosError<ApiResponse<RecipeReviewStatsResponse>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load review stats', statusCode: 500 }
	}
}

// ========================================================================
// RECIPE BATTLES
// ========================================================================

/**
 * Vote in a recipe battle (toggle: same choice removes vote).
 * POST /api/v1/posts/battles/{postId}/vote?choice=A|B
 */
export const voteBattle = async (
	postId: string,
	choice: 'A' | 'B',
): Promise<ApiResponse<BattleVoteResponse>> => {
	try {
		const response = await api.post<ApiResponse<BattleVoteResponse>>(
			API_ENDPOINTS.POST.VOTE_BATTLE(postId),
			null,
			{ params: { choice } },
		)
		return response.data
	} catch (error) {
		logDevError('voteBattle failed:', error)
		const axiosError = error as AxiosError<ApiResponse<BattleVoteResponse>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to vote', statusCode: 500 }
	}
}

/**
 * Get active recipe battles (not yet ended).
 * GET /api/v1/posts/battles/active
 */
export const getActiveBattles = async (
	page = 0,
	size = 10,
): Promise<ApiResponse<Post[]>> => {
	try {
		const params = toBackendPagination({ page, size })
		const response = await api.get<ApiResponse<Post[] | PostPageData>>(
			API_ENDPOINTS.POST.GET_ACTIVE_BATTLES,
			{ params },
		)
		return mapPostPageResponse(response.data)
	} catch (error) {
		logDevError('getActiveBattles failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post[]>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load battles', statusCode: 500 }
	}
}

export const getTasteProfile = async (): Promise<ApiResponse<TasteProfileResponse>> => {
	try {
		const response = await api.get<ApiResponse<TasteProfileResponse>>(
			API_ENDPOINTS.POST.TASTE_PROFILE,
		)
		return response.data
	} catch (error) {
		logDevError('getTasteProfile failed:', error)
		const axiosError = error as AxiosError<ApiResponse<TasteProfileResponse>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load taste profile', statusCode: 500 }
	}
}
