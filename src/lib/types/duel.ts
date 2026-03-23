/**
 * Cooking Duel types — matches BE DuelResponse.java, DuelStatus.java, CreateDuelRequest.java
 */

// Matches DuelStatus.java @JsonValue (Title Case)
export type DuelStatus =
	| 'Pending'
	| 'Accepted'
	| 'Declined'
	| 'In Progress'
	| 'Completed'
	| 'Expired'
	| 'Cancelled'

export interface DuelResponse {
	id: string

	// Participants
	challengerId: string
	challengerName: string
	challengerAvatar: string
	opponentId: string
	opponentName: string
	opponentAvatar: string

	// Recipe
	recipeId: string
	recipeTitle: string
	recipeCoverUrl: string

	// State
	status: DuelStatus
	message: string | null

	// Scores (null until sessions complete)
	challengerScore: number | null
	opponentScore: number | null
	winnerId: string | null
	bonusXp: number

	// Sessions (null until cooking starts)
	challengerSessionId: string | null
	opponentSessionId: string | null

	// Deadlines
	acceptDeadline: string | null
	cookDeadline: string | null

	// Timestamps
	createdAt: string
	acceptedAt: string | null
	completedAt: string | null
}

export interface CreateDuelRequest {
	opponentId: string
	recipeId: string
	message?: string
}
