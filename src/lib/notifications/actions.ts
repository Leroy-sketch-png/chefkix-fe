import type { GamifiedNotification } from '@/components/notifications/NotificationItemsGamified'

export type NotificationNavigator = (
	notificationId: string,
	path: string,
) => void

export type GamifiedNotificationCallbacks = Record<string, () => void>

const postComposerPath = (sessionId?: string) =>
	sessionId ? `/post/new?session=${encodeURIComponent(sessionId)}` : '/post/new'

export const getGamifiedNotificationCallbacks = (
	notification: GamifiedNotification,
	navigate: NotificationNavigator,
): GamifiedNotificationCallbacks => {
	const go = (path: string) => () => navigate(notification.id, path)

	switch (notification.type) {
		case 'xp_awarded':
			return notification.pendingXp > 0
				? { onPost: go(postComposerPath(notification.sessionId)) }
				: {}
		case 'badge_unlocked':
			return { onViewBadge: go('/profile/badges') }
		case 'post_deadline':
		case 'post_deadline_urgent':
			return { onPostNow: go(postComposerPath(notification.sessionId)) }
		case 'streak_warning':
			return { onFindRecipe: go('/explore') }
		case 'streak_lost':
			return { onStartNewStreak: go('/explore') }
		case 'challenge_reminder':
			return { onSeeRecipes: go('/challenges') }
		case 'weekend_nudge':
			return { onExplore: go('/explore') }
		case 'pantry_expiring':
			return { onViewPantry: go('/pantry') }
		default:
			return {}
	}
}
