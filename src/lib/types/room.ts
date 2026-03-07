// ──────────────────────────────────────────────────────
// Co-Cooking Room Types (per spec 18-co-cooking.txt)
// ──────────────────────────────────────────────────────

/** A participant in a cooking room */
export interface RoomParticipant {
	userId: string
	displayName: string
	avatarUrl: string | null
	sessionId: string
	currentStep: number
	completedSteps: number[]
	joinedAt: string
	isHost: boolean
}

/** Room state from REST API */
export interface CookingRoom {
	roomCode: string
	recipeId: string
	recipeTitle: string
	hostUserId: string
	status: 'WAITING' | 'COOKING' | 'DISSOLVED'
	maxParticipants: number
	participants: RoomParticipant[]
	createdAt: string
	/** The current user's cooking session ID */
	sessionId: string | null
}

/** WebSocket event types broadcast to room */
export type RoomEventType =
	| 'PARTICIPANT_JOINED'
	| 'PARTICIPANT_LEFT'
	| 'STEP_NAVIGATED'
	| 'STEP_COMPLETED'
	| 'TIMER_STARTED'
	| 'TIMER_COMPLETED'
	| 'REACTION'
	| 'SESSION_COMPLETED'
	| 'HOST_TRANSFERRED'
	| 'ROOM_DISSOLVED'

/** WebSocket event envelope */
export interface RoomEvent {
	type: RoomEventType
	userId: string
	displayName: string | null
	timestamp: string
	data: Record<string, unknown>
}

/** Request to create a room */
export interface CreateRoomRequest {
	recipeId: string
}

/** Request to join a room */
export interface JoinRoomRequest {
	roomCode: string
}

/** Response from leaving a room */
export interface LeaveRoomResponse {
	left: boolean
	roomDissolved: boolean
	newHostUserId: string | null
}

/** WebSocket event payloads sent by client */
export interface RoomEventPayload {
	roomCode: string
	stepNumber?: number
	completedSteps?: number[]
	totalSeconds?: number
	emoji?: string
	rating?: number
}
