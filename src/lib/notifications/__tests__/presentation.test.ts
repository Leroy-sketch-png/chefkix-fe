import fs from 'node:fs'
import path from 'node:path'
import type { Notification, NotificationType } from '@/services/notification'
import { partitionNotifications } from '../presentation'

const NOTIFICATION_TYPE_COVERAGE = {
	FOLLOW: true,
	NEW_FOLLOWER: true,
	POST_LIKE: true,
	POST_COMMENT: true,
	RECIPE_LIKED: true,
	USER_MENTION: true,
	STORY_INTERACTION: true,
	XP_AWARDED: true,
	LEVEL_UP: true,
	BADGE_EARNED: true,
	CREATOR_BONUS: true,
	STREAK_WARNING: true,
	POST_DEADLINE: true,
	CHALLENGE_AVAILABLE: true,
	CHALLENGE_REMINDER: true,
	WEEKEND_NUDGE: true,
	PANTRY_EXPIRING: true,
	ROOM_INVITE: true,
	CO_CHEF_TAGGED: true,
	DUEL_INVITE: true,
	DUEL_ACCEPTED: true,
	DUEL_DECLINED: true,
	DUEL_COMPLETED: true,
	DUEL_EXPIRED: true,
	JOIN_REQUESTED: true,
	MEMBER_JOINED: true,
	JOIN_REQUEST_APPROVED: true,
} satisfies Record<NotificationType, true>

const ALL_NOTIFICATION_TYPES = Object.keys(
	NOTIFICATION_TYPE_COVERAGE,
) as NotificationType[]

const notification = (type: NotificationType, index: number): Notification => ({
	id: `notification-${index}`,
	type,
	isRead: false,
	content: type === 'STREAK_WARNING' ? '2 hours remaining' : `Content ${index}`,
	createdAt: '2026-07-29T10:00:00.000Z',
	count: 1,
})

describe('partitionNotifications', () => {
	it('classifies every current backend notification type exactly once', () => {
		const input = ALL_NOTIFICATION_TYPES.map(notification)
		const result = partitionNotifications(input)
		const ids = [...result.gamified, ...result.social].map(item => item.id)

		expect(ids).toHaveLength(input.length)
		expect(new Set(ids).size).toBe(input.length)
		expect(ids).toEqual(expect.arrayContaining(input.map(item => item.id)))
	})

	it('preserves order within each presentation group', () => {
		const result = partitionNotifications([
			notification('POST_LIKE', 1),
			notification('STORY_INTERACTION', 2),
			notification('XP_AWARDED', 3),
			notification('LEVEL_UP', 4),
		])

		expect(result.social.map(item => item.id)).toEqual([
			'notification-1',
			'notification-2',
		])
		expect(result.gamified.map(item => item.id)).toEqual([
			'notification-3',
			'notification-4',
		])
	})

	it('keeps page, popup, and retry on the shared presentation authority', () => {
		const page = fs.readFileSync(
			path.join(
				process.cwd(),
				'src',
				'app',
				'(main)',
				'notifications',
				'page.tsx',
			),
			'utf8',
		)
		const popup = fs.readFileSync(
			path.join(
				process.cwd(),
				'src',
				'components',
				'layout',
				'NotificationsPopup.tsx',
			),
			'utf8',
		)

		expect(page).not.toContain("from 'next/dynamic'")
		expect(page).not.toContain('transformToGamifiedNotification')
		expect(page).toContain('partitionNotifications(')
		expect(popup).not.toContain('transformToGamifiedNotification')
		expect(popup.match(/partitionNotifications\(/g)).toHaveLength(1)
		expect(popup.match(/getNotifications\(\{ size: 20 \}\)/g)).toHaveLength(1)
		expect(popup).toContain("{t('viewAll')}")
	})
})
