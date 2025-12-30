'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { ChatMessage, Conversation } from '@/services/chat'

interface UseChatWebSocketOptions {
	conversationId: string | null
	onMessage: (message: ChatMessage) => void
	onNewConversation?: (conversation: Conversation) => void
	userId?: string // Current user ID for subscribing to personal topics
	enabled?: boolean
}

interface UseChatWebSocketReturn {
	sendMessage: (message: string) => void
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
	const { accessToken } = useAuthStore()
	const clientRef = useRef<Client | null>(null)
	const subscriptionRef = useRef<StompSubscription | null>(null)
	const userSubscriptionRef = useRef<StompSubscription | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)

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
		if (!enabled || !accessToken) {
			return
		}

		// Determine WebSocket URL based on environment
		// Use same base as API but with WebSocket protocol
		const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'
		const wsBase = apiBase.replace(/^http/, 'ws')
		const wsUrl = `${wsBase}/ws`

		const client = new Client({
			brokerURL: wsUrl,
			connectHeaders: {
				Authorization: `Bearer ${accessToken}`,
			},
			debug: () => {},
			reconnectDelay: 5000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,
			onConnect: () => {
				setIsConnected(true)
				setError(null)
			},
			onDisconnect: () => {
				setIsConnected(false)
			},
			onStompError: frame => {
				console.error('[WebSocket] STOMP error:', frame.headers['message'])
				setError(frame.headers['message'] || 'Connection error')
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
	}, [enabled, accessToken])

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
					console.error('[WebSocket] Failed to parse new conversation:', err)
				}
			},
		)

		userSubscriptionRef.current = subscription
		console.log(`[WebSocket] Subscribed to /topic/user/${userId}/conversations`)

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
					console.error('[WebSocket] Failed to parse message:', err)
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
		(message: string) => {
			if (!clientRef.current?.connected || !conversationId) {
				console.warn(
					'[WebSocket] Cannot send: not connected or no conversation',
				)
				return
			}

			const payload = {
				conversationId,
				message,
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
