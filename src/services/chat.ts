import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types'
import { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

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

/**
 * Enriched snapshot for POST_SHARE messages.
 * - postId: used for redirect
 * - url: FE route to navigate (can be derived if BE doesn't send it)
 * - photoUrls: for richer preview (if BE provides)
 * - recipeId/sessionId: extra context (optional)
 */
export interface SharedPostSnapshot {
	postId: string
	url?: string
	title?: string
	thumbnail?: string
	photoUrls?: string[]
	recipeId?: string | null
	sessionId?: string | null
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

	// POST_SHARE fields
	type?: MessageType
	relatedId?: string // postId for POST_SHARE (as your backend uses)
	sharedPostImage?: string // legacy snapshot
	sharedPostTitle?: string // legacy snapshot

	// NEW: enriched snapshot (recommended contract going forward)
	sharedPost?: SharedPostSnapshot

	// Reactions
	reactions?: {
		emoji: string
		count: number
		userReacted: boolean
	}[]

	// Reply-to context
	replyTo?: {
		messageId: string
		content: string
		senderName: string
	} | null

	// Soft-delete flag
	deleted?: boolean
}

export interface CreateConversationDto {
	type: 'DIRECT' | 'GROUP'
	participantIds: string[]
}

export interface SendMessageDto {
	conversationId: string
	message: string
	replyToId?: string
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
		logDevError('response failed:', error)
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
		logDevError('response failed:', error)
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
 * Share a post to a conversation (POST_SHARE message type).
 * Backend will fetch post details and cache snapshot data.
 *
 * Backend caching flow:
 * 1. Validates post exists via PostClient.getPostDetail(relatedId)
 * 2. Extracts snapshot from InternalPostResponse:
 *    - sharedPostImage: First image from photoUrls array (thumbnail)
 *    - sharedPostTitle: Recipe title (prioritized for cooking posts)
 * 3. Auto-fills message caption if not provided
 * 4. Saves ChatMessage with cached snapshot fields
 * 5. Broadcasts via WebSocket to all conversation participants
 *
 * Frontend rendering:
 * - ChatMessage component detects type="POST_SHARE"
 * - Displays clickable preview card with thumbnail and title
 * - Navigates to /post/[postId] on click
 */
export const sharePostToConversation = async (
	data: CreateMessageRequest,
): Promise<ApiResponse<ChatMessage>> => {
	try {
		// Ensure type is POST_SHARE
		const payload: CreateMessageRequest = {
			...data,
			type: 'POST_SHARE',
		}

		const response = await api.post<ApiResponse<ChatMessage>>(
			`${API_BASE}/messages/create`,
			payload,
		)

		return response.data
	} catch (error) {
		logDevError('response failed:', error)
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
			{
				conversationId: data.conversationId,
				message: data.message,
				type: 'TEXT', // Explicitly TEXT for regular messages
				...(data.replyToId && { replyToId: data.replyToId }),
			},
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
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
		logDevError('response failed:', error)
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
 * Get conversation suggestions for sharing (recent chats)
 */
export const getShareSuggestions = async (
	size: number = 20,
): Promise<ApiResponse<ShareContactResponse[]>> => {
	try {
		const response = await api.get<ApiResponse<ShareContactResponse[]>>(
			`${API_BASE}/conversations/share-suggestions`,
			{ params: { size } },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
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

/**
 * Toggle a reaction on a message.
 */
export const reactToMessage = async (
	messageId: string,
	emoji: string,
): Promise<ApiResponse<ChatMessage>> => {
	try {
		const response = await api.post<ApiResponse<ChatMessage>>(
			`${API_BASE}/messages/${messageId}/react`,
			{ emoji },
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<ChatMessage>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to react to message',
			statusCode: 500,
		}
	}
}

/**
 * Soft-delete a message. Only the sender can delete their own messages.
 */
export const deleteMessage = async (
	messageId: string,
): Promise<ApiResponse<ChatMessage>> => {
	try {
		const response = await api.delete<ApiResponse<ChatMessage>>(
			`${API_BASE}/messages/${messageId}`,
		)
		return response.data
	} catch (error) {
		logDevError('response failed:', error)
		const axiosError = error as AxiosError<ApiResponse<ChatMessage>>
		if (axiosError.response) {
			return axiosError.response.data
		}
		return {
			success: false,
			message: 'Failed to delete message',
			statusCode: 500,
		}
	}
}

/**
 * Map backend ChatMessage to frontend Message format for UI components.
 * Backend uses 'message' field, frontend uses 'content'.
 *
 * Also normalizes POST_SHARE to always have a sharedPost object (if possible)
 * so UI can safely redirect + render preview.
 *
 * Backend now caches snapshot data directly in ChatMessage entity:
 * - sharedPostImage: Thumbnail (first photoUrl from post)
 * - sharedPostTitle: Recipe title for cooking posts
 * - relatedId: Post ID for redirect
 */
export const mapChatMessageToMessage = (
	backendMsg: ChatMessage,
): {
	id: string
	senderId: string
	content: string
	timestamp: Date
	status: 'sending' | 'sent' | 'delivered' | 'read'
	isOwn: boolean
	type?: MessageType
	relatedId?: string
	sharedPostImage?: string
	sharedPostTitle?: string
	sharedPost?: SharedPostSnapshot
	replyTo?: {
		id: string
		content: string
		senderName: string
	}
	reactions?: {
		emoji: string
		count: number
		userReacted: boolean
	}[]
} => {
	const isPostShare = (backendMsg.type || 'TEXT') === 'POST_SHARE'
	const postId = backendMsg.relatedId

	// Build enriched snapshot from backend's cached fields
	const sharedPost: SharedPostSnapshot | undefined =
		isPostShare && postId
			? {
					postId,
					// Derive URL for navigation
					url: `/post/${postId}`,
					// Use cached title (recipe title for cooking posts)
					title: backendMsg.sharedPostTitle || undefined,
					// Use cached thumbnail (first image from post)
					thumbnail: backendMsg.sharedPostImage || undefined,
					// photoUrls could be added later when backend expands InternalPostResponse mapping
					photoUrls: backendMsg.sharedPostImage
						? [backendMsg.sharedPostImage]
						: undefined,
					// These fields can be enriched when backend adds them
					recipeId: null,
					sessionId: null,
				}
			: undefined

	return {
		id: backendMsg.id,
		senderId: backendMsg.sender.userId,
		content: backendMsg.deleted
			? 'This message was deleted'
			: backendMsg.message,
		timestamp: new Date(backendMsg.createdDate),
		status: 'sent',
		isOwn: backendMsg.me,
		type: backendMsg.type || 'TEXT',
		relatedId: backendMsg.relatedId,
		sharedPostImage: backendMsg.sharedPostImage,
		sharedPostTitle: backendMsg.sharedPostTitle,
		sharedPost,
		replyTo: backendMsg.replyTo
			? {
					id: backendMsg.replyTo.messageId,
					content: backendMsg.replyTo.content,
					senderName: backendMsg.replyTo.senderName,
				}
			: undefined,
		reactions: backendMsg.reactions,
	}
}
