import { api } from '@/lib/axios'
import {
	ApiResponse,
	Comment,
	CreateCommentRequest,
	Reply,
	CreateReplyRequest,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'

/**
 * Comment API Service
 *
 * Handles all comment-related operations:
 * - Get comments for a post
 * - Create new comment
 * - Delete comment
 * - Toggle like on comment
 * - Create replies to comments
 * - Get replies for a comment
 *
 * Based on: .tmp/implemented_spec/06-comments.txt
 */

// ============================================
// COMMENT FUNCTIONS
// ============================================

/**
 * Get all comments for a specific post
 */
export const getCommentsByPostId = async (
	postId: string,
	params?: { page?: number; size?: number },
): Promise<ApiResponse<Comment[]>> => {
	try {
		const response = await api.get<ApiResponse<Comment[]>>(
			API_ENDPOINTS.POST.GET_COMMENTS(postId),
			{ params },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Comment[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch comments',
			statusCode: 500,
		}
	}
}

/**
 * Create a new comment on a post
 */
export const createComment = async (
	postId: string,
	data: CreateCommentRequest,
): Promise<ApiResponse<Comment>> => {
	try {
		const response = await api.post<ApiResponse<Comment>>(
			API_ENDPOINTS.POST.CREATE_COMMENT(postId),
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Comment>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to create comment',
			statusCode: 500,
		}
	}
}

/**
 * Delete a comment
 */
export const deleteComment = async (
	postId: string,
	commentId: string,
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.delete<ApiResponse<void>>(
			API_ENDPOINTS.POST.DELETE_COMMENT(postId, commentId),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to delete comment',
			statusCode: 500,
		}
	}
}

/**
 * Toggle like on a comment
 */
export const toggleLikeComment = async (
	postId: string,
	commentId: string,
): Promise<ApiResponse<{ likes: number; isLiked: boolean }>> => {
	try {
		const response = await api.post<
			ApiResponse<{ likes: number; isLiked: boolean }>
		>(API_ENDPOINTS.POST.TOGGLE_LIKE_COMMENT(postId, commentId))
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<{ likes: number; isLiked: boolean }>
		>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to toggle like',
			statusCode: 500,
		}
	}
}

// ============================================
// REPLY FUNCTIONS (per spec 06-comments.txt)
// ============================================

/**
 * Get all replies for a specific comment
 */
export const getRepliesByCommentId = async (
	commentId: string,
	params?: { page?: number; size?: number },
): Promise<ApiResponse<Reply[]>> => {
	try {
		const response = await api.get<ApiResponse<Reply[]>>(
			API_ENDPOINTS.POST.GET_REPLIES(commentId),
			{ params },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Reply[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to fetch replies',
			statusCode: 500,
		}
	}
}

/**
 * Create a reply to a comment
 */
export const createReply = async (
	commentId: string,
	data: CreateReplyRequest,
): Promise<ApiResponse<Reply>> => {
	try {
		const response = await api.post<ApiResponse<Reply>>(
			API_ENDPOINTS.POST.CREATE_REPLY(commentId),
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Reply>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to create reply',
			statusCode: 500,
		}
	}
}
