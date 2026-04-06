/**
 * Shared time-remaining formatters for challenge/battle components.
 *
 * Two styles:
 * - "compact":  "1d", "23h 59m"          (ChallengeCard)
 * - "verbose":  "2 days", "23h 59m"      (DailyChallengeBanner)
 * - "withLeft": "5d left", "23h 59m left" (ActiveBattlesSection, page.tsx)
 *
 * Expired/ended strings go through the i18n translator `t`.
 */

type Translator = (key: string, values?: Record<string, string | number>) => string

/**
 * Compact time remaining -- "1d", "23h 59m", t('expired').
 * Accepts Date. Used by ChallengeCard.
 */
export function formatCompactTimeRemaining(date: Date, t: Translator): string {
	const diffMs = date.getTime() - Date.now()
	if (diffMs <= 0) return t('expired')

	const hours = Math.floor(diffMs / 3600000)
	const mins = Math.floor((diffMs % 3600000) / 60000)

	if (hours >= 24) return t('daysCompact', { days: Math.floor(hours / 24) })
	return t('hoursMinutes', { hours, mins })
}

/**
 * Verbose time remaining -- "1 day", "3 days", "23h 59m", t('expired').
 * Accepts Date. Used by DailyChallengeBanner (caller appends "remaining").
 */
export function formatVerboseTimeRemaining(date: Date, t: Translator): string {
	const diffMs = date.getTime() - Date.now()
	if (diffMs <= 0) return t('expired')

	const hours = Math.floor(diffMs / 3600000)
	const mins = Math.floor((diffMs % 3600000) / 60000)

	if (hours >= 24) {
		const days = Math.floor(hours / 24)
		return t('daysCount', { count: days })
	}
	return t('hoursMinutes', { hours, mins })
}

/**
 * Event/battle time remaining — "5d left", "23h 59m left", t('ended').
 * Accepts ISO string. Used by ActiveBattlesSection, challenges/page.tsx.
 */
export function formatEventTimeRemaining(dateStr: string, t: Translator): string {
	const diffMs = new Date(dateStr).getTime() - Date.now()
	if (diffMs <= 0) return t('ended')

	const hours = Math.floor(diffMs / 3600000)
	const mins = Math.floor((diffMs % 3600000) / 60000)

	if (hours >= 24) return t('daysLeft', { days: Math.floor(hours / 24) })
	return t('hoursLeft', { hours, mins })
}
