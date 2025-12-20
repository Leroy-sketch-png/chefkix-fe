/**
 * Chat types - matches chefkix-chat-service response DTOs
 *
 * BE: org.example.chefkixmessageservice.dto.response.*
 * All fields use default camelCase serialization
 */

// Conversation type - string literal union (not an enum in BE)
export type ConversationType = 'GROUP' | 'DIRECT'

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
