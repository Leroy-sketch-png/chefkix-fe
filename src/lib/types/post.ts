/**
 * Post API Types
 * Based on Post Service API Specification
 */

export interface Post {
	id: string
	userId: string
	displayName: string
	avatarUrl?: string
	content: string
	photoUrls: string[]
	videoUrl?: string | null
	tags: string[]
	likes: number
	commentCount: number
	slug: string
	postUrl: string
	createdAt: string
	updatedAt: string | null
	isLiked?: boolean // Client-side flag for optimistic UI
}

export interface CreatePostRequest {
	content: string
	photoUrls?: File[] // Will be sent as multipart/form-data
	videoUrl?: string
	tags?: string[]
	avatarUrl?: string
}

export interface UpdatePostRequest {
	content?: string
	tags?: string[]
}

export interface PostResponse extends Post {}

export interface ToggleLikeResponse {
	id: string
	likes: number
	content: string
	userId: string
	displayName: string
	tags: string[]
}
