import { api } from '@/lib/axios'
import {
	ApiResponse,
	Post,
	CreatePostRequest,
	UpdatePostRequest,
	ToggleLikeResponse,
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
 *    - Returns full Post object with uploaded image URLs from Cloudinary
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
): Promise<ApiResponse<Post>> => {
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

		const response = await api.post<ApiResponse<Post>>(
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
}): Promise<ApiResponse<Post[]>> => {
	try {
		const backendParams = toBackendPagination(params) ?? params
		const response = await api.get<ApiResponse<Post[]>>(
			API_ENDPOINTS.POST.GET_ALL,
			{
				params: backendParams,
			},
		)
		return response.data
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

export const getPostsByUser = async (
	userId: string,
	params?: { limit?: number; offset?: number; page?: number; size?: number },
): Promise<ApiResponse<Post[]>> => {
	try {
		const backendParams = toBackendPagination(params) ?? params
		const response = await api.get<ApiResponse<Post[]>>(
			API_ENDPOINTS.POST.GET_FEED(userId),
			{
				params: backendParams,
			},
		)
		return response.data
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
