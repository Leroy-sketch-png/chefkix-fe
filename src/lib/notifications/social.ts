import type { ApiResponse } from '@/lib/types'
import { formatShortTimeAgo } from '@/lib/utils'
import type { Notification } from '@/services/notification'

export type SocialNotificationType =
	| 'like'
	| 'comment'
	| 'follow'
	| 'story'
	| 'cook'
	| 'achievement'
	| 'mention'
	| 'generic'

export interface SocialNotification {
	id: string
	type: SocialNotificationType
	userId: string
	user: string
	avatar: string
	action: string
	target?: string
	targetEntityId?: string
	targetEntityUrl?: string
	time: string
	read: boolean
	createdAt: Date
}

const TYPE_MAP: Partial<Record<Notification['type'], SocialNotificationType>> =
	{
		NEW_FOLLOWER: 'follow',
		FOLLOW: 'follow',
		POST_LIKE: 'like',
		RECIPE_LIKED: 'like',
		POST_COMMENT: 'comment',
		USER_MENTION: 'mention',
		STORY_INTERACTION: 'story',
		ROOM_INVITE: 'cook',
		CO_CHEF_TAGGED: 'mention',
		DUEL_INVITE: 'cook',
		DUEL_ACCEPTED: 'cook',
		DUEL_DECLINED: 'cook',
		DUEL_COMPLETED: 'achievement',
		DUEL_EXPIRED: 'cook',
		JOIN_REQUESTED: 'follow',
		MEMBER_JOINED: 'follow',
		JOIN_REQUEST_APPROVED: 'follow',
	}

const withoutRepeatedActor = (content: string, actorName: string) => {
	const trimmed = content.trim()
	if (!actorName || !trimmed.startsWith(actorName)) return trimmed

	const remainder = trimmed.slice(actorName.length)
	return /^\s/.test(remainder) ? remainder.trimStart() : trimmed
}

export const transformToSocialNotification = (
	notification: Notification,
): SocialNotification => {
	const data = notification.data ?? {}
	const createdAt = new Date(notification.createdAt)
	const user = (
		notification.latestActorName ||
		notification.actorInfo?.actorName ||
		data.userName ||
		data.displayName ||
		''
	).trim()

	return {
		id: notification.id,
		type: TYPE_MAP[notification.type] ?? 'generic',
		userId:
			notification.latestActorId ||
			notification.actorInfo?.actorId ||
			data.userId ||
			'',
		user,
		avatar:
			notification.latestActorAvatarUrl ||
			notification.actorInfo?.avatarUrl ||
			data.avatarUrl ||
			'/placeholder-avatar.svg',
		action: withoutRepeatedActor(
			notification.content || notification.body || '',
			user,
		),
		target: data.targetTitle,
		targetEntityId: notification.targetEntityId || data.targetEntityId,
		targetEntityUrl: notification.targetEntityUrl || data.targetEntityUrl,
		time: formatShortTimeAgo(createdAt),
		read: notification.isRead,
		createdAt,
	}
}

export const resolveSocialNotificationPath = (
	notification: SocialNotification,
	currentUserId?: string,
): string | null => {
	if (notification.targetEntityUrl) return notification.targetEntityUrl

	if (notification.type === 'follow' && notification.userId) {
		return `/${encodeURIComponent(notification.userId)}`
	}

	if (
		notification.type === 'story' &&
		currentUserId &&
		notification.targetEntityId
	) {
		return `/story/view/${encodeURIComponent(currentUserId)}?startAt=${encodeURIComponent(notification.targetEntityId)}`
	}

	if (
		['like', 'comment', 'mention'].includes(notification.type) &&
		notification.targetEntityId
	) {
		return `/post/${encodeURIComponent(notification.targetEntityId)}`
	}

	if (notification.type === 'cook' || notification.type === 'achievement') {
		return '/dashboard'
	}

	return null
}

interface TruthfulReadOptions {
	wasUnread: boolean
	request: () => Promise<ApiResponse<unknown>>
	onOptimisticRead: () => void
	onRollback: () => void
}

export const markNotificationReadTruthfully = async ({
	wasUnread,
	request,
	onOptimisticRead,
	onRollback,
}: TruthfulReadOptions): Promise<boolean> => {
	if (!wasUnread) return true

	onOptimisticRead()
	try {
		const response = await request()
		if (response.success) return true
	} catch {
		// The rollback below restores both the row and aggregate badge state.
	}

	onRollback()
	return false
}
