// ============================================================================
// 1. DTO DÙNG ĐỂ TẠO STORY (Khớp với StoryCreateRequest.java)
// ============================================================================
export interface StoryCreateRequest {
	mediaUrl: string
	mediaType: 'IMAGE' | 'VIDEO'
	imageScale?: number // Thêm trường này
	imageRotation?: number
	linkedRecipeId?: string
	items: StoryOverlayItem[] // Danh sách text, stickers...
}

export interface StoryOverlayItem {
	type: 'TEXT' | 'STICKER' | 'IMAGE_STICKER'
	x: number
	y: number
	rotation: number
	scale: number
	data: Record<string, any> // Khớp với Map<String, Object> ở Backend
}

// ============================================================================
// 2. ENTITIES DÙNG ĐỂ HIỂN THỊ (Khớp với Database/Response Backend trả về)
// ============================================================================
export interface Story {
	id: string
	userId: string
	mediaUrl: string
	mediaType: 'IMAGE' | 'VIDEO'
	imageScale?: number // Thêm trường này
	imageRotation?: number
	createdAt: string
	expiresAt: string
	items: StoryItemDto[]
}

export interface StoryItemDto {
	type: string
	x: number
	y: number
	rotation: number
	scale: number
	data: Record<string, any>
}

export interface StoryResponse {
	id: string
	userId: string
	mediaUrl: string
	mediaType: 'IMAGE' | 'VIDEO'
	imageScale?: number // Thêm trường này
	imageRotation?: number
	linkedRecipeId?: string
	items: StoryItemDto[]
	createdAt: string
	expiresAt: string
}

export enum ReactionType {
	LIKE = 'LIKE',
	LOVE = 'LOVE',
	HAHA = 'HAHA',
	WOW = 'WOW',
	SAD = 'SAD',
	ANGRY = 'ANGRY',
}

// Request body when sending a reaction to a story
export interface StoryReactionRequest {
	storyId: string
	reactionType: ReactionType | string
}

// Request body when sending a reply (message) to a story
export interface StoryReplyRequest {
	storyId: string
	message: string
	// Optional: id of message being replied to or metadata
	replyToMessageId?: string
}

export interface UserStoryFeedResponse {
	userId: string
	displayName: string
	avatarUrl: string
	hasUnseenStory: boolean
}

export interface StoryInteraction {
	id: string
	storyId: string
	userId: string
	type: 'LIKE' | 'CLAP' | 'WOW' | 'HEART'
	createdAt: string
}

export interface StoryHighlight {
	id: string
	userId: string
	title: string
	coverUrl: string
	storyIds: string[]
	createdAt: string
}
