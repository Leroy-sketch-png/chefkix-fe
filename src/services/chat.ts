import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { AxiosError } from 'axios'

// ============================================
// TYPES - Based on implemented_spec/09-chat.txt
// ============================================

export type MessageType = 'TEXT' | 'POST_SHARE'

export interface ChatParticipant {
	userId: string
	username: string
	firstName: string
	lastName: string
	avatar: string
}

export interface Conversation {
	id: string
	type: 'DIRECT' | 'GROUP'
	participantsHash: string
	conversationAvatar: string
	conversationName: string
	participants: ChatParticipant[]
	createdDate: string // ISO8601
	modifiedDate: string // ISO8601
	// Frontend-added for convenience
	lastMessage?: ChatMessage
	unreadCount?: number
}

export interface ChatMessage {
	id: string
	conversationId: string
	me: boolean // Is this message from current user
	message: string
	sender: ChatParticipant
	createdDate: string // ISO8601
}

export interface CreateConversationDto {
	type: 'DIRECT' | 'GROUP'
	participantIds: string[]
}

export interface SendMessageDto {
	conversationId: string
	message: string
}

export interface ShareContactResponse {
	conversationId: string
	displayName: string
	avatar: string
	type: 'DIRECT' | 'GROUP'
	userId?: string // Only present for DIRECT conversations
}

export interface CreateMessageRequest {
	conversationId: string
	message?: string // Optional for POST_SHARE (auto-filled by BE)
	type?: MessageType
	relatedId?: string // Post ID for POST_SHARE
}

// ============================================
// API ENDPOINTS
// ============================================

const API_BASE = '/api/v1/chat'

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Create a new conversation (direct or group).
 */
export const createConversation = async (
	data: CreateConversationDto,
): Promise<ApiResponse<Conversation>> => {
	try {
		const response = await api.post<ApiResponse<Conversation>>(
			`${API_BASE}/conversations/create`,
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Conversation>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to create conversation',
			statusCode: 500,
		}
	}
}

/**
 * Get all conversations for the current user.
 */
export const getMyConversations = async (): Promise<
	ApiResponse<Conversation[]>
> => {
	try {
		const response = await api.get<ApiResponse<Conversation[]>>(
			`${API_BASE}/conversations/my-conversations`,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<Conversation[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get conversations',
			statusCode: 500,
		}
	}
}

/**
 * Share a post to a conversation
 */
export const sharePostToConversation = async (
	data: CreateMessageRequest,
): Promise<ApiResponse<ChatMessage>> => {
	try {
		const response = await api.post<ApiResponse<ChatMessage>>(
			`${API_BASE}/messages/create`,
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ChatMessage>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to share post',
			statusCode: 500,
		}
	}
}

/**
 * Send a message in a conversation.
 */
export const sendMessage = async (
	data: SendMessageDto,
): Promise<ApiResponse<ChatMessage>> => {
	try {
		const response = await api.post<ApiResponse<ChatMessage>>(
			`${API_BASE}/messages/create`,
			data,
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ChatMessage>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to send message',
			statusCode: 500,
		}
	}
}

/**
 * Get messages for a conversation.
 */
export const getMessages = async (
	conversationId: string,
): Promise<ApiResponse<ChatMessage[]>> => {
	try {
		const response = await api.get<ApiResponse<ChatMessage[]>>(
			`${API_BASE}/messages`,
			{ params: { conversationId } },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ChatMessage[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get messages',
			statusCode: 500,
		}
	}
}

/**
 * Get or create a direct conversation with a user.
 * Convenience function that checks existing conversations first.
 */
export const getOrCreateDirectConversation = async (
	userId: string,
): Promise<ApiResponse<Conversation>> => {
	try {
		// First try to find existing conversation
		const conversationsResponse = await getMyConversations()
		if (conversationsResponse.success && conversationsResponse.data) {
			const existing = conversationsResponse.data.find(
				conv =>
					conv.type === 'DIRECT' &&
					conv.participants.some(p => p.userId === userId),
			)
			if (existing) {
				return {
					success: true,
					message: 'Existing conversation found',
					statusCode: 200,
					data: existing,
				}
			}
		}

		// Create new conversation
		return createConversation({
			type: 'DIRECT',
			participantIds: [userId],
		})
	} catch (error) {
		return {
			success: false,
			message: 'Failed to get or create conversation',
			statusCode: 500,
		}
	}
}

/**
 * Get conversation suggestions for sharing (recent chats)
 */
export const getShareSuggestions = async (
	size: number = 5,
): Promise<ApiResponse<ShareContactResponse[]>> => {
	try {
		const response = await api.get<ApiResponse<ShareContactResponse[]>>(
			`${API_BASE}/conversations/share-suggestions`,
			{ params: { size } },
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<ShareContactResponse[]>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to get share suggestions',
			statusCode: 500,
		}
	}
}
