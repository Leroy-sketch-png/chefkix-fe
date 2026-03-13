/**
 * Chat types - matches chefkix-monolith social module chat DTOs
 *
 * BE: com.chefkix.social.chat.dto.response.*
 * All fields use default camelCase serialization
 */

// Conversation type - string literal union (not an enum in BE)
export type ConversationType = 'GROUP' | 'DIRECT'

// Message type - matches BE MessageType enum
export type MessageType = 'TEXT' | 'POST_SHARE' | 'IMAGE' | 'FILE'

// Participant info embedded in conversations and messages
export interface ParticipantInfo {
	userId: string
	username: string
	firstName: string
	lastName: string
	avatar: string
}

// Chat message response - matches ChatMessageResponse.java
export interface ChatMessage {
	id: string
	conversationId: string
	me: boolean // Flag indicating if current user is the sender
	message: string
	sender: ParticipantInfo
	createdDate: string // ISO timestamp
	// Message type and shared content — per BE ChatMessageResponse.java
	type?: MessageType // Default: 'TEXT'. 'POST_SHARE' for shared posts.
	relatedId?: string // ID of shared entity (postId for POST_SHARE)
	sharedPostImage?: string // Thumbnail of shared post (POST_SHARE only)
	sharedPostTitle?: string // Title of shared post (POST_SHARE only)
}

// Conversation response - matches ConversationResponse.java
export interface Conversation {
	id: string
	type: ConversationType
	participantsHash: string // Unique hash of participants for direct convos
	conversationAvatar: string
	conversationName: string
	participants: ParticipantInfo[]
	createdDate: string // ISO timestamp
	modifiedDate: string // ISO timestamp
}

// Request types for chat operations
export interface CreateMessageRequest {
	conversationId: string
	message: string
}

export interface CreateConversationRequest {
	type: ConversationType
	participantIds: string[]
	name?: string // Optional for group conversations
}
