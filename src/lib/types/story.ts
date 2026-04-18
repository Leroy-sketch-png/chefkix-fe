// ============================================================================
// 1. DTO DÙNG ĐỂ TẠO STORY (Khớp với StoryCreateRequest.java)
// ============================================================================
export interface StoryCreateRequest {
	mediaUrl: string
	mediaType: 'IMAGE' | 'VIDEO'
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
	items: StoryItemDto[]
	createdAt: string
	expiresAt: string
}

export interface StoryItemDto {
	id: string // Frontend-only ID for React keys
	type: 'TEXT' | 'STICKER'
	x: number
	y: number
	width: number | string
	height: number | string
	rotation: number
	data: {
		text?: string
		color?: string
		emoji?: string
	}
}

export interface StoryResponse {
	id: string
	userId: string
	mediaUrl: string
	mediaType: 'IMAGE' | 'VIDEO'
	linkedRecipeId?: string
	items: StoryItemDto[]
	createdAt: string
	expiresAt: string
}

export interface StoryInteraction {
	id: string
	storyId: string
	userId: string
	type: 'VIEW' | 'REACTION' | 'REPLY'
	reactionType?: string
	text?: string
	createdAt: string
}

export interface StoryHighlight {
	id: string
	userId: string
	title: string
	coverStoryId: string
	storyIds: string[]
	createdAt: string
}
