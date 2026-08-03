import type { Statistics } from '@/lib/types/profile'

type ProgressStatistics = Pick<
	Statistics,
	'currentLevel' | 'currentXP' | 'currentXPGoal' | 'streakCount'
>

export interface TopbarProgress {
	level: number
	currentXP: number
	currentXPGoal: number
	streakCount: number
	percent: number
}

export function getTopbarProgress(
	statistics?: ProgressStatistics | null,
): TopbarProgress | null {
	if (!statistics) return null

	const values = [
		statistics.currentLevel,
		statistics.currentXP,
		statistics.currentXPGoal,
		statistics.streakCount,
	]
	if (values.some(value => !Number.isFinite(value))) return null
	if (
		statistics.currentLevel < 1 ||
		statistics.currentXP < 0 ||
		statistics.currentXPGoal <= 0 ||
		statistics.streakCount < 0
	) {
		return null
	}

	return {
		level: statistics.currentLevel,
		currentXP: statistics.currentXP,
		currentXPGoal: statistics.currentXPGoal,
		streakCount: statistics.streakCount,
		percent: Math.min(
			100,
			Math.max(0, (statistics.currentXP / statistics.currentXPGoal) * 100),
		),
	}
}
