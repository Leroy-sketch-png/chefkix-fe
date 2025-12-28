import { api } from '@/lib/axios'
import {
	ApiResponse,
	Post,
	CreatePostRequest,
	UpdatePostRequest,
	ToggleLikeResponse,
	PostWithXpResponse,
	Page,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { toBackendPagination } from '@/lib/apiUtils'
import { AxiosError } from 'axios'

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

export const getFeedPosts = async (params?: {
	limit?: number
	offset?: number
	page?: number
	size?: number
	mode?: 'latest' | 'trending' // 0 = latest (default), 1 = trending (hotScore)
}): Promise<ApiResponse<Post[]>> => {
	try {
		const backendParams = toBackendPagination(params) ?? params
		// Backend returns Page<PostResponse>, extract content array
		const response = await api.get<ApiResponse<{ content: Post[] }>>(
			API_ENDPOINTS.POST.GET_ALL,
			{
				params: {
					...backendParams,
					mode: params?.mode === 'trending' ? 1 : 0, // Convert to backend mode int
				},
			},
		)
		// Extract posts from Page.content
		if (response.data.success && response.data.data?.content) {
			return {
				...response.data,
				data: response.data.data.content,
			}
		}
		return response.data as any
	} catch (error) {
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
