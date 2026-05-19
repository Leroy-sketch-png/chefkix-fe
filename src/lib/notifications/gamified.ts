import type { GamifiedNotification } from '@/components/notifications/NotificationItemsGamified'
import type { Notification as APINotification } from '@/services/notification'

const getNum = (
	data: Record<string, unknown>,
	key: string,
): number | undefined => {
	const val = data[key]
	if (val == null) return undefined
	const num = Number(val)
	return Number.isNaN(num) ? undefined : num
}

const getStr = (
	data: Record<string, unknown>,
	key: string,
): string | undefined => {
	const val = data[key]
	return typeof val === 'string' && val ? val : undefined
}

function parseXpFromContent(content?: string): { xp: number; recipe: string } {
	if (!content) return { xp: 0, recipe: 'Recipe' }
	const xpMatch = content.match(/(\d+)\s*XP/i)
	const recipeMatch = content.match(/completing\s+(.+?)(?:[!.]|$)/i)
	return {
		xp: xpMatch ? parseInt(xpMatch[1], 10) : 0,
		recipe: recipeMatch ? recipeMatch[1].trim().replace(/!$/, '') : 'Recipe',
	}
}

function parseLevelFromContent(content?: string): number | undefined {
	if (!content) return undefined
	const match = content.match(/Level\s+(\d+)/i)
	return match ? parseInt(match[1], 10) : undefined
}

function parseStreakFromContent(content?: string): number {
	if (!content) return 0
	const match = content.match(/(\d+)[- ]day/i)
	return match ? parseInt(match[1], 10) : 0
}

function parseDaysFromContent(content?: string): number {
	if (!content) return 0
	const match = content.match(/(\d+)\s*days?\s*(?:remaining|left)/i)
	return match ? parseInt(match[1], 10) : 0
}

function parseHoursFromContent(content?: string): number {
	if (!content) return 0
	const hourMatch = content.match(/(\d+)\s*hours?\s*(?:remaining|left)/i)
	if (hourMatch) return parseInt(hourMatch[1], 10)
	const dayMatch = content.match(/(\d+)\s*days?\s*(?:remaining|left)/i)
	if (dayMatch) return parseInt(dayMatch[1], 10) * 24
	if (/tomorrow/i.test(content)) return 24
	return 0
}

function parseChallengeContent(content?: string): {
	title?: string
	description?: string
	timeLabel?: string
} {
	if (!content) return {}

	const withTimeMatch = content.match(
		/^(.*?)\s*[\u2014-]\s*(.*?)\s*[\u2014-]\s*(.*)$/,
	)
	if (withTimeMatch) {
		return {
			title: withTimeMatch[1].trim(),
			description: withTimeMatch[2].trim(),
			timeLabel: withTimeMatch[3].trim(),
		}
	}

	return {
		title: content,
	}
}

export const transformToGamifiedNotification = (
	notif: APINotification,
): GamifiedNotification | null => {
	const data = (notif.data ?? {}) as Record<string, unknown>
	const timestamp = new Date(notif.createdAt)

	switch (notif.type) {
		case 'XP_AWARDED': {
			const parsed = parseXpFromContent(notif.content)
			return {
				id: notif.id,
				type: 'xp_awarded',
				recipeName:
					getStr(data, 'recipeName') ||
					getStr(data, 'recipeTitle') ||
					parsed.recipe,
				xpAmount: getNum(data, 'xpAmount') ?? parsed.xp,
				pendingXp: getNum(data, 'pendingXp') ?? 0,
				content: notif.content,
				source: getStr(data, 'source'),
				sessionId: getStr(data, 'sessionId') || notif.targetEntityId,
				timestamp,
				isRead: notif.isRead,
			}
		}
		case 'LEVEL_UP': {
			return {
				id: notif.id,
				type: 'level_up',
				newLevel:
					getNum(data, 'newLevel') ?? parseLevelFromContent(notif.content),
				newGoalXp: getNum(data, 'newGoalXp'),
				recipesToNextLevel: getNum(data, 'recipesToNextLevel'),
				timestamp,
				isRead: notif.isRead,
			}
		}
		case 'BADGE_EARNED':
			return {
				id: notif.id,
				type: 'badge_unlocked',
				badgeIcon: getStr(data, 'badgeIcon') || '🏆',
				badgeName:
					getStr(data, 'badgeNames')?.split(',')[0] ||
					getStr(data, 'badgeName') ||
					'Badge',
				badgeRarity:
					(getStr(data, 'badgeRarity') as
						| 'common'
						| 'rare'
						| 'epic'
						| 'legendary') || 'common',
				requirement: getStr(data, 'requirement') || '',
				timestamp,
				isRead: notif.isRead,
			}
		case 'CREATOR_BONUS': {
			const parsed = parseXpFromContent(notif.content)
			return {
				id: notif.id,
				type: 'creator_bonus',
				content: notif.content,
				recipeName: getStr(data, 'recipeName') || getStr(data, 'recipeTitle'),
				xpBonus:
					getNum(data, 'xpBonus') ?? getNum(data, 'xpAmount') ?? parsed.xp,
				totalCookRewards: getNum(data, 'totalCookRewards'),
				timestamp,
				isRead: notif.isRead,
			}
		}
		case 'STREAK_WARNING': {
			const hoursRemaining =
				getNum(data, 'hoursRemaining') ?? parseHoursFromContent(notif.content)
			if (hoursRemaining <= 0) {
				return null
			}
			return {
				id: notif.id,
				type: 'streak_warning',
				streakCount:
					getNum(data, 'streakCount') ?? parseStreakFromContent(notif.content),
				hoursRemaining,
				timestamp,
				isRead: notif.isRead,
			}
		}
		case 'POST_DEADLINE': {
			const days =
				getNum(data, 'daysRemaining') ?? parseDaysFromContent(notif.content)
			const pendingXp = getNum(data, 'pendingXp')
			return {
				id: notif.id,
				type: days <= 1 ? 'post_deadline_urgent' : 'post_deadline',
				content: notif.content,
				recipeName:
					getStr(data, 'recipeName') || getStr(data, 'recipeTitle') || 'Recipe',
				daysRemaining: days,
				sessionId: getStr(data, 'sessionId') || notif.targetEntityId,
				...(pendingXp != null ? { pendingXp } : {}),
				...(days <= 1
					? {
							...(getNum(data, 'originalXp') != null
								? { originalXp: getNum(data, 'originalXp') }
								: {}),
							...(getNum(data, 'decayPercent') != null
								? { decayPercent: getNum(data, 'decayPercent') }
								: {}),
						}
					: {}),
				timestamp,
				isRead: notif.isRead,
			} as GamifiedNotification
		}
		case 'CHALLENGE_AVAILABLE':
		case 'CHALLENGE_REMINDER': {
			const parsed = parseChallengeContent(notif.content)
			return {
				id: notif.id,
				type: 'challenge_reminder',
				challengeTitle: getStr(data, 'challengeTitle') || parsed.title || '',
				challengeDescription:
					getStr(data, 'challengeDescription') || parsed.description || '',
				xpBonusPercent: getNum(data, 'xpBonusPercent') ?? 0,
				hoursRemaining:
					getNum(data, 'hoursRemaining') ??
					parseHoursFromContent(parsed.timeLabel || notif.content),
				timeLabel: parsed.timeLabel,
				timestamp,
				isRead: notif.isRead,
			}
		}
		case 'WEEKEND_NUDGE':
			return {
				id: notif.id,
				type: 'weekend_nudge',
				content:
					notif.content ||
					getStr(data, 'content') ||
					"It's the weekend - perfect time to try a new recipe!",
				timestamp,
				isRead: notif.isRead,
			}
		case 'PANTRY_EXPIRING':
			return {
				id: notif.id,
				type: 'pantry_expiring',
				content:
					notif.content ||
					getStr(data, 'content') ||
					'Some ingredients are expiring soon',
				daysRemaining: getNum(data, 'daysRemaining') ?? 3,
				timestamp,
				isRead: notif.isRead,
			}
		default:
			return null
	}
}
