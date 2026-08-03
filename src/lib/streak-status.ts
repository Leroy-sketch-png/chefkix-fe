import type { Statistics } from '@/lib/types/profile'

export const STREAK_RISK_WINDOW_HOURS = 24

type StreakWindowStats = Pick<
	Statistics,
	'streakCount' | 'hoursUntilStreakBreaks'
>

export function isStreakAtRisk(stats?: StreakWindowStats): boolean {
	const hoursRemaining = stats?.hoursUntilStreakBreaks

	return (
		(stats?.streakCount ?? 0) > 0 &&
		typeof hoursRemaining === 'number' &&
		Number.isFinite(hoursRemaining) &&
		hoursRemaining > 0 &&
		hoursRemaining <= STREAK_RISK_WINDOW_HOURS
	)
}
