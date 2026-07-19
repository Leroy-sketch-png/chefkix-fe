'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { logDevError, logDevWarn } from '@/lib/dev-log'
import type { Notification } from '@/services/notification'
import {
	getFreshWebSocketAccessToken,
	getReadableWebSocketError,
	getWebSocketUrl,
	isWebSocketAuthenticationError,
	WEBSOCKET_SESSION_EXPIRED_MESSAGE,
} from '@/lib/websocket-auth'

interface NotificationEvent {
	action: 'CREATE' | 'UPDATE' | 'DELETE'
	notification: Notification
}

interface UseNotificationSocketReturn {
	isConnected: boolean
	error: string | null
}

/**
 * WebSocket hook for real-time notification delivery.
 * Subscribes to /topic/user/{userId} — same topic NotificationService broadcasts to.
 * Replaces HTTP polling with instant push.
 */
export function useNotificationSocket(): UseNotificationSocketReturn {
	const { accessToken, user, isAuthenticated, isHydrated, isLoading } =
		useAuthStore()
	const { incrementUnreadCount, stopPolling, startPolling } =
		useNotificationStore()
	const clientRef = useRef<Client | null>(null)
	const subscriptionRef = useRef<StompSubscription | null>(null)
	const reconnectAttemptsRef = useRef(0)
	const [isConnected, setIsConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const MAX_RECONNECT_ATTEMPTS = 10

	const userId = user?.userId

	const handleNotification = useCallback(
		(event: NotificationEvent) => {
			if (event.action === 'CREATE') {
				incrementUnreadCount()
			}
		},
		[incrementUnreadCount],
	)

	// Stable refs to avoid WebSocket reconnection on callback identity changes
	const handleNotificationRef = useRef(handleNotification)
	handleNotificationRef.current = handleNotification
	const stopPollingRef = useRef(stopPolling)
	stopPollingRef.current = stopPolling
	const startPollingRef = useRef(startPolling)
	startPollingRef.current = startPolling

	// Connect to WebSocket
	useEffect(() => {
		if (
			!isHydrated ||
			isLoading ||
			!isAuthenticated ||
			!accessToken ||
			!userId
		) {
			return
		}

		let cancelled = false

		const connect = async () => {
			const initialToken = await getFreshWebSocketAccessToken()
			if (cancelled) return

			if (!initialToken) {
				setError(WEBSOCKET_SESSION_EXPIRED_MESSAGE)
				setIsConnected(false)
				startPollingRef.current()
				return
			}

			const client = new Client({
				brokerURL: getWebSocketUrl(),
				connectHeaders: {
					Authorization: `Bearer ${initialToken}`,
				},
				beforeConnect: async () => {
					const token = await getFreshWebSocketAccessToken()
					if (!token) {
						setError(WEBSOCKET_SESSION_EXPIRED_MESSAGE)
						setIsConnected(false)
						client.reconnectDelay = 0
						startPollingRef.current()
						throw new Error(WEBSOCKET_SESSION_EXPIRED_MESSAGE)
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

					// Subscribe to user-specific notification topic
					const sub = client.subscribe(
						`/topic/user/${userId}`,
						(message: IMessage) => {
							try {
								const event: NotificationEvent = JSON.parse(message.body)
								handleNotificationRef.current(event)
							} catch (err) {
								logDevError('[NotifSocket] Failed to parse:', err)
							}
						},
					)
					subscriptionRef.current = sub

					// Kill HTTP polling — WebSocket is now live
					stopPollingRef.current()
				},
				onDisconnect: () => {
					setIsConnected(false)
					reconnectAttemptsRef.current++
					if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
						client.reconnectDelay = 0
					}
					// Restart HTTP polling as fallback when WebSocket drops
					startPollingRef.current()
				},
				onStompError: frame => {
					const rawMessage = frame.headers['message']
					const errorMessage = getReadableWebSocketError(rawMessage)
					if (isWebSocketAuthenticationError(rawMessage)) {
						client.reconnectDelay = 0
						logDevWarn('[NotifSocket] Session rejected; reconnect disabled')
					} else {
						logDevError('[NotifSocket] STOMP error:', rawMessage)
					}
					setError(errorMessage)
					setIsConnected(false)
					// Restart HTTP polling as fallback
					startPollingRef.current()
				},
				onWebSocketError: () => {
					setError('WebSocket connection failed')
					setIsConnected(false)
					// Restart HTTP polling as fallback
					startPollingRef.current()
				},
			})

			clientRef.current = client
			client.activate()
		}

		void connect()

		return () => {
			cancelled = true
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe()
				subscriptionRef.current = null
			}
			if (clientRef.current) {
				void clientRef.current.deactivate()
				clientRef.current = null
			}
			setIsConnected(false)
		}
	}, [accessToken, userId, isAuthenticated, isHydrated, isLoading])

	return { isConnected, error }
}
