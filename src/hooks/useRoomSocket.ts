'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { logDevError, logDevWarn } from '@/lib/dev-log'
import type { RoomEvent, RoomEventPayload } from '@/lib/types/room'
import {
	getFreshWebSocketAccessToken,
	getReadableWebSocketError,
	getWebSocketUrl,
	WEBSOCKET_SESSION_EXPIRED_MESSAGE,
} from '@/lib/websocket-auth'

interface UseRoomSocketOptions {
	/** Room code to subscribe to (null = don't connect) */
	roomCode: string | null
	/** Called on every room event */
	onEvent: (event: RoomEvent) => void
	/** Whether the hook is enabled */
	enabled?: boolean
}

interface UseRoomSocketReturn {
	/** Publish a room event via WebSocket */
	publishEvent: (destination: string, payload: RoomEventPayload) => void
	/** Send step navigated event */
	sendStepNavigated: (stepNumber: number) => void
	/** Send step completed event */
	sendStepCompleted: (stepNumber: number, completedSteps?: number[]) => void
	/** Send timer started event */
	sendTimerStarted: (stepNumber: number, totalSeconds: number) => void
	/** Send timer completed event */
	sendTimerCompleted: (stepNumber: number) => void
	/** Send reaction emoji */
	sendReaction: (emoji: string) => void
	/** Send session completed event */
	sendSessionCompleted: (rating?: number) => void
	/** Whether connected to WebSocket */
	isConnected: boolean
	/** Any connection error */
	error: string | null
}

/**
 * WebSocket hook for real-time co-cooking room events.
 * Follows the same pattern as useChatWebSocket.
 *
 * Subscribes to `/topic/room/{roomCode}` for incoming events.
 * Publishes to `/app/room.*` destinations for outgoing events.
 */
export function useRoomSocket({
	roomCode,
	onEvent,
	enabled = true,
}: UseRoomSocketOptions): UseRoomSocketReturn {
	const { accessToken, isHydrated, isLoading } = useAuthStore()
	const clientRef = useRef<Client | null>(null)
	const subscriptionRef = useRef<StompSubscription | null>(null)
	const reconnectAttemptsRef = useRef(0)
	const [isConnected, setIsConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const MAX_RECONNECT_ATTEMPTS = 10

	// Store callback in ref to avoid reconnection on callback change
	const onEventRef = useRef(onEvent)
	useEffect(() => {
		onEventRef.current = onEvent
	}, [onEvent])

	// Connect to WebSocket
	useEffect(() => {
		if (!enabled || !isHydrated || isLoading || !accessToken || !roomCode) {
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
					logDevWarn('[RoomSocket] Max reconnect attempts reached, stopping')
					client.reconnectDelay = 0
					setError('Room connection lost — please refresh')
				}
			},
			onStompError: frame => {
				const errorMessage = getReadableWebSocketError(frame.headers['message'])
				logDevError('[RoomSocket] STOMP error:', frame.headers['message'])
				setError(errorMessage)
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
	}, [enabled, accessToken, roomCode, isHydrated, isLoading])

	// Subscribe to room topic
	useEffect(() => {
		if (!roomCode || !clientRef.current?.connected) {
			return
		}

		// Unsubscribe from previous room
		if (subscriptionRef.current) {
			subscriptionRef.current.unsubscribe()
			subscriptionRef.current = null
		}

		const subscription = clientRef.current.subscribe(
			`/topic/room/${roomCode.toUpperCase()}`,
			(message: IMessage) => {
				try {
					const event: RoomEvent = JSON.parse(message.body)
					onEventRef.current(event)
				} catch (err) {
					logDevError('[RoomSocket] Failed to parse event:', err)
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
	}, [roomCode, isConnected])

	// Generic publish
	const publishEvent = useCallback(
		(destination: string, payload: RoomEventPayload) => {
			if (!clientRef.current?.connected || !roomCode) {
				return
			}
			clientRef.current.publish({
				destination,
				body: JSON.stringify({ ...payload, roomCode: roomCode.toUpperCase() }),
			})
		},
		[roomCode],
	)

	// Convenience methods for each event type
	const sendStepNavigated = useCallback(
		(stepNumber: number) => {
			publishEvent('/app/room.stepNavigated', {
				roomCode: roomCode || '',
				stepNumber,
			})
		},
		[publishEvent, roomCode],
	)

	const sendStepCompleted = useCallback(
		(stepNumber: number, completedSteps?: number[]) => {
			publishEvent('/app/room.stepCompleted', {
				roomCode: roomCode || '',
				stepNumber,
				completedSteps,
			})
		},
		[publishEvent, roomCode],
	)

	const sendTimerStarted = useCallback(
		(stepNumber: number, totalSeconds: number) => {
			publishEvent('/app/room.timerStarted', {
				roomCode: roomCode || '',
				stepNumber,
				totalSeconds,
			})
		},
		[publishEvent, roomCode],
	)

	const sendTimerCompleted = useCallback(
		(stepNumber: number) => {
			publishEvent('/app/room.timerCompleted', {
				roomCode: roomCode || '',
				stepNumber,
			})
		},
		[publishEvent, roomCode],
	)

	const sendReaction = useCallback(
		(emoji: string) => {
			publishEvent('/app/room.reaction', {
				roomCode: roomCode || '',
				emoji,
			})
		},
		[publishEvent, roomCode],
	)

	const sendSessionCompleted = useCallback(
		(rating?: number) => {
			publishEvent('/app/room.sessionCompleted', {
				roomCode: roomCode || '',
				rating,
			})
		},
		[publishEvent, roomCode],
	)

	return {
		publishEvent,
		sendStepNavigated,
		sendStepCompleted,
		sendTimerStarted,
		sendTimerCompleted,
		sendReaction,
		sendSessionCompleted,
		isConnected,
		error,
	}
}
