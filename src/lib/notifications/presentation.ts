import type { GamifiedNotification } from '@/components/notifications/NotificationItemsGamified'
import type { Notification } from '@/services/notification'
import { transformToGamifiedNotification } from './gamified'
import {
	transformToSocialNotification,
	type SocialNotification,
} from './social'

export interface NotificationPresentationGroups {
	gamified: GamifiedNotification[]
	social: SocialNotification[]
}

export const partitionNotifications = (
	notifications: readonly Notification[],
): NotificationPresentationGroups =>
	notifications.reduce<NotificationPresentationGroups>(
		(groups, notification) => {
			const gamified = transformToGamifiedNotification(notification)
			if (gamified) {
				groups.gamified.push(gamified)
			} else {
				groups.social.push(transformToSocialNotification(notification))
			}
			return groups
		},
		{ gamified: [], social: [] },
	)
