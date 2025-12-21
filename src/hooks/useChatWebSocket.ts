'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { ChatMessage } from '@/services/chat'

interface UseChatWebSocketOptions {
	conversationId: string | null
	onMessage: (message: ChatMessage) => void
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
	enabled = true,
}: UseChatWebSocketOptions): UseChatWebSocketReturn {
	const { accessToken } = useAuthStore()
	const clientRef = useRef<Client | null>(null)
	const subscriptionRef = useRef<StompSubscription | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Store onMessage in ref to avoid reconnection on callback change
	const onMessageRef = useRef(onMessage)
	useEffect(() => {
		onMessageRef.current = onMessage
	}, [onMessage])

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
			debug: str => {
				if (process.env.NODE_ENV === 'development') {
					console.log('[STOMP Debug]', str)
				}
			},
			reconnectDelay: 5000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,
			onConnect: () => {
				console.log('[WebSocket] Connected to chat service')
				setIsConnected(true)
				setError(null)
			},
			onDisconnect: () => {
				console.log('[WebSocket] Disconnected from chat service')
				setIsConnected(false)
			},
			onStompError: frame => {
				console.error('[WebSocket] STOMP error:', frame.headers['message'])
				setError(frame.headers['message'] || 'Connection error')
				setIsConnected(false)
			},
			onWebSocketError: () => {
				// Don't log the event object - it serializes to {} and is useless
				// This error fires when backend is offline - expected in dev
				if (process.env.NODE_ENV === 'development') {
					console.warn('[WebSocket] Connection failed - backend may be offline')
				}
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
			if (clientRef.current) {
				clientRef.current.deactivate()
				clientRef.current = null
			}
			setIsConnected(false)
		}
	}, [enabled, accessToken])

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
					console.log('[WebSocket] Received message:', chatMessage)
					onMessageRef.current(chatMessage)
				} catch (err) {
					console.error('[WebSocket] Failed to parse message:', err)
				}
			},
		)

		subscriptionRef.current = subscription
		console.log(
			`[WebSocket] Subscribed to /topic/conversation/${conversationId}`,
		)

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

			console.log('[WebSocket] Message sent:', payload)
		},
		[conversationId],
	)

	return {
		sendMessage,
		isConnected,
		error,
	}
}
