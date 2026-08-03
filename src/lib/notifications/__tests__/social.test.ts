import type { Notification } from '@/services/notification'
import {
	markNotificationReadTruthfully,
	resolveSocialNotificationPath,
	transformToSocialNotification,
} from '../social'

const notification = (overrides: Partial<Notification> = {}): Notification => ({
	id: 'notification-42',
	type: 'STORY_INTERACTION',
	isRead: false,
	content: 'Mai reacted to your story.',
	targetEntityId: 'story/42',
	createdAt: '2026-07-29T08:00:00.000Z',
	count: 1,
	latestActorId: 'actor one',
	latestActorName: 'Mai',
	latestActorAvatarUrl: '/mai.jpg',
	...overrides,
})

describe('social notification contract', () => {
	it.each([
		['FOLLOW', 'follow'],
		['NEW_FOLLOWER', 'follow'],
		['POST_LIKE', 'like'],
		['RECIPE_LIKED', 'like'],
		['POST_COMMENT', 'comment'],
		['USER_MENTION', 'mention'],
		['CO_CHEF_TAGGED', 'mention'],
		['ROOM_INVITE', 'cook'],
		['DUEL_INVITE', 'cook'],
		['DUEL_ACCEPTED', 'cook'],
		['DUEL_DECLINED', 'cook'],
		['DUEL_COMPLETED', 'achievement'],
		['DUEL_EXPIRED', 'cook'],
		['JOIN_REQUESTED', 'follow'],
		['MEMBER_JOINED', 'follow'],
		['JOIN_REQUEST_APPROVED', 'follow'],
	] as const)('maps %s to %s', (type, expected) => {
		expect(transformToSocialNotification(notification({ type })).type).toBe(
			expected,
		)
	})

	it('maps a story reaction with a stable API identity and no duplicate actor copy', () => {
		const result = transformToSocialNotification(notification())

		expect(result).toMatchObject({
			id: 'notification-42',
			type: 'story',
			user: 'Mai',
			action: 'reacted to your story.',
			targetEntityId: 'story/42',
		})
	})

	it('opens the exact story for its creator and URL-encodes both identifiers', () => {
		const result = transformToSocialNotification(notification())

		expect(resolveSocialNotificationPath(result, 'owner one')).toBe(
			'/story/view/owner%20one?startAt=story%2F42',
		)
	})

	it('honors a backend destination before deriving a local route', () => {
		const result = transformToSocialNotification(
			notification({ targetEntityUrl: '/canonical/story' }),
		)

		expect(resolveSocialNotificationPath(result, 'owner')).toBe(
			'/canonical/story',
		)
	})

	it('keeps an unknown event visible without inventing a destination', () => {
		const result = transformToSocialNotification(
			notification({ type: 'XP_AWARDED', targetEntityId: undefined }),
		)

		expect(result.type).toBe('generic')
		expect(resolveSocialNotificationPath(result, 'owner')).toBeNull()
	})

	it('does not invent a person when actor evidence is absent', () => {
		const result = transformToSocialNotification(
			notification({
				type: 'XP_AWARDED',
				latestActorId: undefined,
				latestActorName: undefined,
				latestActorAvatarUrl: undefined,
				actorInfo: undefined,
				data: undefined,
			}),
		)

		expect(result.user).toBe('')
		expect(result.userId).toBe('')
	})
})

describe('truthful read transition', () => {
	it('keeps the optimistic read when the API succeeds', async () => {
		const optimistic = jest.fn()
		const rollback = jest.fn()

		await expect(
			markNotificationReadTruthfully({
				wasUnread: true,
				request: async () => ({ success: true, statusCode: 200 }),
				onOptimisticRead: optimistic,
				onRollback: rollback,
			}),
		).resolves.toBe(true)
		expect(optimistic).toHaveBeenCalledTimes(1)
		expect(rollback).not.toHaveBeenCalled()
	})

	it.each([
		['structured failure', async () => ({ success: false, statusCode: 500 })],
		['transport failure', async () => Promise.reject(new Error('offline'))],
	])('rolls back after %s', async (_label, request) => {
		const optimistic = jest.fn()
		const rollback = jest.fn()

		await expect(
			markNotificationReadTruthfully({
				wasUnread: true,
				request,
				onOptimisticRead: optimistic,
				onRollback: rollback,
			}),
		).resolves.toBe(false)
		expect(optimistic).toHaveBeenCalledTimes(1)
		expect(rollback).toHaveBeenCalledTimes(1)
	})

	it('does not call the API or mutate an already-read notification', async () => {
		const request = jest.fn(async () => ({ success: true, statusCode: 200 }))
		const optimistic = jest.fn()

		await markNotificationReadTruthfully({
			wasUnread: false,
			request,
			onOptimisticRead: optimistic,
			onRollback: jest.fn(),
		})

		expect(request).not.toHaveBeenCalled()
		expect(optimistic).not.toHaveBeenCalled()
	})
})
