/**
 * Admin moderation types — matches BE DTOs from AdminController & ModerationController.
 *
 * Backend source:
 * - AdminController: social/moderation/controller/AdminController.java
 * - ModerationController: social/moderation/controller/ModerationController.java
 * - Report entity: social/post/entity/Report.java
 * - Ban entity: social/moderation/entity/Ban.java
 * - Appeal entity: social/moderation/entity/Appeal.java
 */

// ── Report ──

export type ReportTargetType = 'post' | 'comment' | 'recipe'

export type ReportReason =
	| 'fraud'
	| 'spam'
	| 'inappropriate'
	| 'harassment'
	| 'copyright'
	| 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

/** Report entity returned directly by GET /admin/reports */
export interface Report {
	id: string
	reporterId: string
	targetType: ReportTargetType
	targetId: string
	reason: ReportReason
	details: string | null
	status: ReportStatus
	reviewedBy: string | null
	reviewNotes: string | null
	reviewedAt: string | null // ISO instant
	createdAt: string // ISO instant
	updatedAt: string // ISO instant
}

export type ReviewDecision = 'resolved' | 'dismissed' | 'ban_user'
export type BanScope = 'post' | 'comment' | 'all'

/** POST /admin/reports/{reportId}/review request body */
export interface ReviewReportRequest {
	decision: ReviewDecision
	notes?: string
	banScope?: BanScope
}

// ── Ban ──

/** BanResponse DTO from POST /admin/users/{userId}/ban and GET /admin/users/{userId}/bans */
export interface BanResponse {
	id: string
	userId: string
	reason: string
	scope: BanScope
	durationDays: number // -1 = permanent
	offenseNumber: number
	issuedAt: string // ISO instant
	expiresAt: string | null // null if permanent
	active: boolean
	permanent: boolean
}

/** POST /admin/users/{userId}/ban request body */
export interface BanUserRequest {
	reason: string
	scope?: BanScope
}

// ── Appeal ──

export type AppealStatus = 'pending' | 'approved' | 'rejected'
export type AppealDecision = 'approved' | 'rejected'

/** Appeal entity returned by GET /admin/appeals */
export interface Appeal {
	id: string
	userId: string
	banId: string
	reason: string
	evidenceUrls: string[]
	status: AppealStatus
	reviewedBy: string | null
	reviewNotes: string | null
	reviewedAt: string | null // ISO instant
	createdAt: string // ISO instant
}

/** POST /admin/appeals/{appealId}/review request body */
export interface ReviewAppealRequest {
	decision: AppealDecision
	notes?: string
}
