/**
 * Post API Types
 * Based on Social Module API Specification
 *
 * IMPORTANT: BE PostResponse.java only sends `photoUrls` (List<String>).
 * The singular `photoUrl` field does NOT exist in BE responses.
 * FE keeps `photoUrl` as an optional field for graceful degradation,
 * but all new code should use `photoUrls` exclusively.
 */

export interface CoChef {
	userId: string
	displayName: string
	avatarUrl: string | null
}

export interface Post {
	id: string
	userId: string
	displayName: string
	avatarUrl?: string
	content: string
	slug: string
	photoUrl?: string | null // @deprecated — BE does NOT send this field. Use photoUrls[0] instead. Kept for legacy FE fallback only.
	photoUrls?: string[] // Canonical: BE PostResponse.photoUrls (List<String>)
	videoUrl: string | null
	postUrl: string
	tags: string[]
	likes: number // BE: Integer (nullable), but FE defaults to 0
	commentCount: number
	createdAt: string
	updatedAt: string | null
	isLiked?: boolean // Client-side flag for optimistic UI
	isSaved?: boolean // Client-side flag for saved/bookmarked state
	// Session linking (per spec 05-posts.txt)
	sessionId?: string // Cooking session this post is linked to
	recipeId?: string // Recipe that was cooked
	recipeTitle?: string // For display: "Cooked: Spicy Ramen"
	isPrivateRecipe?: boolean // True = recipe details hidden, only title shown
	xpEarned?: number // XP user earned from this post
	roomCode?: string // Co-cooking room code (null for solo posts)
	coChefs?: CoChef[] // Co-chefs who cooked together
}

export interface CreatePostRequest {
	avatarUrl: string
	content: string
	photoUrls?: File[] // For multipart upload (canonical)
	videoUrl?: string
	tags?: string[]
	// Session linking for XP unlock (per spec 05-posts.txt)
	sessionId?: string // Links post to a cooking session
	isPrivateRecipe?: boolean // For private recipe attempts (default: false)
}

export interface UpdatePostRequest {
	content?: string
	tags?: string[]
}

export interface PostResponse extends Post {}

/**
 * Response from POST /toggle-like/{postId}
 * Matches PostLikeResponse.java exactly
 */
export interface ToggleLikeResponse {
	isLiked: boolean
	likeCount: number
}

/**
 * Response from POST /toggle-save/{postId}
 * Matches PostSaveResponse.java exactly
 */
export interface ToggleSaveResponse {
	isSaved: boolean
	saveCount: number
}

// Post creation response when sessionId is provided
export interface PostWithXpResponse extends Post {
	xpAwarded: number
	totalXp: number
	badgesEarned: string[]
}
