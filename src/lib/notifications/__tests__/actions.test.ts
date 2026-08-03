import type { GamifiedNotification } from '@/components/notifications/NotificationItemsGamified'
import { getGamifiedNotificationCallbacks } from '../actions'

const base = {
	id: 'notification-1',
	timestamp: new Date('2026-07-31T08:00:00.000Z'),
	isRead: false,
}

describe('gamified notification action authority', () => {
	it.each([
		[
			{ ...base, type: 'streak_warning', streakCount: 4, hoursRemaining: 2 },
			'onFindRecipe',
			'/explore',
		],
		[
			{ ...base, type: 'streak_lost', lostStreakCount: 4, bestStreak: 7 },
			'onStartNewStreak',
			'/explore',
		],
		[
			{
				...base,
				type: 'badge_unlocked',
				badgeIcon: 'badge',
				badgeName: 'First cook',
				badgeRarity: 'common',
				requirement: 'Cook once',
			},
			'onViewBadge',
			'/profile/badges',
		],
		[
			{
				...base,
				type: 'challenge_reminder',
				challengeTitle: 'Dinner',
				challengeDescription: 'Cook dinner',
				xpBonusPercent: 10,
				hoursRemaining: 3,
			},
			'onSeeRecipes',
			'/challenges',
		],
		[
			{ ...base, type: 'weekend_nudge', content: 'Cook this weekend' },
			'onExplore',
			'/explore',
		],
		[
			{
				...base,
				type: 'pantry_expiring',
				content: 'Basil expires soon',
				daysRemaining: 1,
			},
			'onViewPantry',
			'/pantry',
		],
	] as const)('maps %s through %s', (notification, callbackName, path) => {
		const navigate = jest.fn()
		const callbacks = getGamifiedNotificationCallbacks(
			notification as GamifiedNotification,
			navigate,
		)

		callbacks[callbackName]?.()
		expect(navigate).toHaveBeenCalledWith('notification-1', path)
	})

	it.each(['post_deadline', 'post_deadline_urgent'] as const)(
		'preserves the cooking session when mapping %s',
		type => {
			const navigate = jest.fn()
			const notification = {
				...base,
				type,
				content: 'Share your cook',
				recipeName: 'Pho',
				daysRemaining: 2,
				sessionId: 'session / 1',
			} as GamifiedNotification

			getGamifiedNotificationCallbacks(notification, navigate).onPostNow?.()
			expect(navigate).toHaveBeenCalledWith(
				'notification-1',
				'/post/new?session=session%20%2F%201',
			)
		},
	)

	it('hides Post when no XP remains and maps it when XP is pending', () => {
		const navigate = jest.fn()
		const notification: Extract<GamifiedNotification, { type: 'xp_awarded' }> =
			{
				...base,
				type: 'xp_awarded',
				recipeName: 'Pho',
				xpAmount: 10,
				pendingXp: 0,
			}

		expect(getGamifiedNotificationCallbacks(notification, navigate)).toEqual({})
		expect(
			getGamifiedNotificationCallbacks(
				{ ...notification, pendingXp: 5 },
				navigate,
			),
		).toHaveProperty('onPost')
	})

	it('returns no command for informational variants', () => {
		const navigate = jest.fn()
		const notification = {
			...base,
			type: 'level_up',
			newLevel: 2,
		} as GamifiedNotification

		expect(getGamifiedNotificationCallbacks(notification, navigate)).toEqual({})
	})
})
