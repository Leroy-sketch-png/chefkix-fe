'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { logDevError } from '@/lib/dev-log'
import type { Notification } from '@/services/notification'

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
	const { accessToken, user } = useAuthStore()
	const { incrementUnreadCount, stopPolling } = useNotificationStore()
	const clientRef = useRef<Client | null>(null)
	const subscriptionRef = useRef<StompSubscription | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)

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

	// Connect to WebSocket
	useEffect(() => {
		if (!accessToken || !userId) return

		const apiBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'
		const wsBase = apiBase.replace(/^http/, 'ws')
		const wsUrl = `${wsBase}/api/v1/ws`

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
			},
			onStompError: frame => {
				logDevError(
					'[NotifSocket] STOMP error:',
					frame.headers['message'],
				)
				setError(frame.headers['message'] || 'Connection error')
				setIsConnected(false)
			},
			onWebSocketError: () => {
				setError('WebSocket connection failed')
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
	}, [accessToken, userId])

	return { isConnected, error }
}
