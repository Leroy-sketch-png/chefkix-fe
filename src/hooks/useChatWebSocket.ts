'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { ChatMessage, Conversation } from '@/services/chat'
import { logDevError, logDevWarn } from '@/lib/dev-log'
import {
	getFreshWebSocketAccessToken,
	getReadableWebSocketError,
	getWebSocketUrl,
	WEBSOCKET_SESSION_EXPIRED_MESSAGE,
} from '@/lib/websocket-auth'

interface UseChatWebSocketOptions {
	conversationId: string | null
	onMessage: (message: ChatMessage) => void
	onNewConversation?: (conversation: Conversation) => void
	userId?: string // Current user ID for subscribing to personal topics
	enabled?: boolean
}

interface UseChatWebSocketReturn {
	sendMessage: (message: string, replyToId?: string) => void
	isConnected: boolean
	error: string | null
}

/**
 * WebSocket hook for real-time chat messaging.
 * Connects to the STOMP broker at /ws and subscribes to conversation topics.
 */
export function useChatWebSocket({
	conversationId,
	onMessage,
	onNewConversation,
	userId,
	enabled = true,
}: UseChatWebSocketOptions): UseChatWebSocketReturn {
	const { accessToken, isHydrated, isLoading } = useAuthStore()
	const clientRef = useRef<Client | null>(null)
	const subscriptionRef = useRef<StompSubscription | null>(null)
	const userSubscriptionRef = useRef<StompSubscription | null>(null)
	const reconnectAttemptsRef = useRef(0)
	const [isConnected, setIsConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const MAX_RECONNECT_ATTEMPTS = 10

	// Store callbacks in refs to avoid reconnection on callback change
	const onMessageRef = useRef(onMessage)
	const onNewConversationRef = useRef(onNewConversation)
	useEffect(() => {
		onMessageRef.current = onMessage
	}, [onMessage])
	useEffect(() => {
		onNewConversationRef.current = onNewConversation
	}, [onNewConversation])

	// Connect to WebSocket
	useEffect(() => {
		if (!enabled || !isHydrated || isLoading || !accessToken) {
			return
		}

		const client = new Client({
			brokerURL: getWebSocketUrl(),
			beforeConnect: async () => {
				const token = await getFreshWebSocketAccessToken()
				if (!token) {
					setError(WEBSOCKET_SESSION_EXPIRED_MESSAGE)
					setIsConnected(false)
					client.reconnectDelay = 0
					return
				}

				client.connectHeaders = {
					Authorization: `Bearer ${token}`,
				}
			},
			debug: () => {},
			reconnectDelay: 5000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,
			onConnect: () => {
				reconnectAttemptsRef.current = 0
				setIsConnected(true)
				setError(null)
			},
			onDisconnect: () => {
				setIsConnected(false)
				reconnectAttemptsRef.current++
				if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
					logDevWarn('[WebSocket] Max reconnect attempts reached, stopping')
					client.reconnectDelay = 0
					setError('Chat connection lost — please refresh the page')
				}
			},
			onStompError: frame => {
				const errorMessage = getReadableWebSocketError(frame.headers['message'])
				logDevError('[WebSocket] STOMP error:', frame.headers['message'])
				setError(errorMessage)
				setIsConnected(false)
			},
			onWebSocketError: () => {
				setError('WebSocket connection failed - chat unavailable')
				setIsConnected(false)
			},
		})

		clientRef.current = client
		client.activate()

		return () => {
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe()
				subscriptionRef.current = null
			}
			if (userSubscriptionRef.current) {
				userSubscriptionRef.current.unsubscribe()
				userSubscriptionRef.current = null
			}
			if (clientRef.current) {
				clientRef.current.deactivate()
				clientRef.current = null
			}
			setIsConnected(false)
		}
	}, [enabled, accessToken, isHydrated, isLoading])

	// Subscribe to user-specific topic for new conversations
	useEffect(() => {
		if (
			!userId ||
			!clientRef.current?.connected ||
			!onNewConversationRef.current
		) {
			return
		}

		// Unsubscribe from previous user subscription
		if (userSubscriptionRef.current) {
			userSubscriptionRef.current.unsubscribe()
			userSubscriptionRef.current = null
		}

		// Subscribe to new conversation notifications for this user
		const subscription = clientRef.current.subscribe(
			`/topic/user/${userId}/conversations`,
			(message: IMessage) => {
				try {
					const conversation: Conversation = JSON.parse(message.body)
					onNewConversationRef.current?.(conversation)
				} catch (err) {
					logDevError('[WebSocket] Failed to parse new conversation:', err)
				}
			},
		)

		userSubscriptionRef.current = subscription

		return () => {
			if (userSubscriptionRef.current) {
				userSubscriptionRef.current.unsubscribe()
				userSubscriptionRef.current = null
			}
		}
	}, [userId, isConnected])

	// Subscribe to conversation topic when conversationId changes
	useEffect(() => {
		if (!conversationId || !clientRef.current?.connected) {
			return
		}

		// Unsubscribe from previous conversation
		if (subscriptionRef.current) {
			subscriptionRef.current.unsubscribe()
			subscriptionRef.current = null
		}

		// Subscribe to new conversation
		const subscription = clientRef.current.subscribe(
			`/topic/conversation/${conversationId}`,
			(message: IMessage) => {
				try {
					const chatMessage: ChatMessage = JSON.parse(message.body)
					onMessageRef.current(chatMessage)
				} catch (err) {
					logDevError('[WebSocket] Failed to parse message:', err)
				}
			},
		)

		subscriptionRef.current = subscription

		return () => {
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe()
				subscriptionRef.current = null
			}
		}
	}, [conversationId, isConnected])

	// Send message via WebSocket
	const sendMessage = useCallback(
		(message: string, replyToId?: string) => {
			if (!clientRef.current?.connected || !conversationId) {
				logDevWarn('[WebSocket] Cannot send: not connected or no conversation')
				return
			}

			const payload: Record<string, string> = {
				conversationId,
				message,
				type: 'TEXT',
			}
			if (replyToId) {
				payload.replyToId = replyToId
			}

			clientRef.current.publish({
				destination: '/app/chat.sendMessage',
				body: JSON.stringify(payload),
			})
		},
		[conversationId],
	)

	return {
		sendMessage,
		isConnected,
		error,
	}
}
