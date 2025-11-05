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
	slug: string
	photoUrl: string | null
	videoUrl: string | null
	postUrl: string
	tags: string[]
	likes: number
	commentCount: number
	createdAt: string
	updatedAt: string | null
	isLiked?: boolean // Client-side flag for optimistic UI
}

export interface CreatePostRequest {
	userId: string
	avatarUrl: string
	content: string
	photoUrl?: string
	videoUrl?: string
	tags?: string[]
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
