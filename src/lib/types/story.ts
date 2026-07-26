export interface StoryCreateRequest {
	mediaUrl: string
	mediaType: 'IMAGE' | 'VIDEO'
	imageScale?: number
	imageRotation?: number
	linkedRecipeId?: string
	items: StoryOverlayItem[]
}

export interface StoryOverlayItem {
	type: 'TEXT' | 'STICKER' | 'IMAGE_STICKER'
	x: number
	y: number
	rotation: number
	scale: number
	data: Record<string, any>
}

export interface Story {
	id: string
	userId: string
	mediaUrl: string
	mediaType: 'IMAGE' | 'VIDEO'
	imageScale?: number
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
	imageScale?: number
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

export interface StoryReactionRequest {
	storyId: string
	reactionType: ReactionType | string
}

export interface StoryReplyRequest {
	storyId: string
	text: string
	replyToMessageId?: string
}

export interface UserStoryFeedResponse {
	userId: string
	displayName: string
	avatarUrl: string
	hasUnseenStory: boolean
	hasStories?: boolean
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
