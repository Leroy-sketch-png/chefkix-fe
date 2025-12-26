/**
 * Comment and Reply Types
 * Based on API Specification (06-comments.txt)
 */

export interface TaggedUser {
	userId: string
	displayName: string
}

export interface Comment {
	id: string // Comment ID (per spec)
	userId: string
	postId: string
	displayName: string
	content: string
	avatarUrl: string
	taggedUsers: TaggedUser[] // Per spec 06-comments.txt
	likes: number
	replyCount: number // Per spec 06-comments.txt (was 'comments')
	createdAt: string
	updatedAt: string
}

export interface CreateCommentRequest {
	content: string
	taggedUserIds?: string[] // Users @mentioned in the comment
}

export interface Reply {
	id: string
	userId: string
	displayName: string
	avatarUrl: string
	content: string
	likes: number
	createdAt: string
	updatedAt: string
	taggedUsers: TaggedUser[]
	parentCommentId: string
}

export interface CreateReplyRequest {
	content: string
	parentCommentId: string
	taggedUserIds?: string[] // Optional per spec
}
