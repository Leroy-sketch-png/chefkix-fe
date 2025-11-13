/**
 * Post API Types
 * Based on Post Service API Specification
 *
 * Note: API spec canonical is photoUrls (array), but legacy chefkix-be uses photoUrl (string).
 * We support both for compatibility.
 */

export interface Post {
	id: string
	userId: string
	displayName: string
	avatarUrl?: string
	content: string
	slug: string
	photoUrl?: string | null // Legacy chefkix-be: single photo URL
	photoUrls?: string[] // Canonical spec: array of photo URLs
	videoUrl: string | null
	postUrl: string
	tags: string[]
	likes: number
	commentCount: number
	createdAt: string
	updatedAt: string | null
	isLiked?: boolean // Client-side flag for optimistic UI
	isSaved?: boolean // Client-side flag for saved/bookmarked state
}

export interface CreatePostRequest {
	avatarUrl: string
	content: string
	photoUrls?: File[] // For multipart upload (canonical)
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
