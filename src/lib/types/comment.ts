/**
 * Comment and Reply Types
 * Based on API Specification
 */

export interface Comment {
	userId: string
	postId: string
	displayName: string
	content: string
	avatarUrl: string
	likes: number
	comments: number
	createdAt: string
	updatedAt: string
}

export interface CreateCommentRequest {
	content: string
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
	taggedUsers: Array<{
		userId: string
		displayName: string
	}>
	parentCommentId: string
}

export interface CreateReplyRequest {
	content: string
	parentCommentId: string
	taggedUserIds: string[]
}
