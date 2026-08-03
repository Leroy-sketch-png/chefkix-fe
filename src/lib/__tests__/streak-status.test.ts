import { isStreakAtRisk, STREAK_RISK_WINDOW_HOURS } from '@/lib/streak-status'

describe('isStreakAtRisk', () => {
	it('uses the backend streak window instead of calendar-day activity', () => {
		expect(
			isStreakAtRisk({
				streakCount: 4,
				hoursUntilStreakBreaks: STREAK_RISK_WINDOW_HOURS,
			}),
		).toBe(true)
		expect(
			isStreakAtRisk({
				streakCount: 4,
				hoursUntilStreakBreaks: STREAK_RISK_WINDOW_HOURS + 0.1,
			}),
		).toBe(false)
	})

	it.each([
		['missing stats', undefined],
		['no streak', { streakCount: 0, hoursUntilStreakBreaks: 12 }],
		['missing window', { streakCount: 4, hoursUntilStreakBreaks: undefined }],
		['already broken', { streakCount: 4, hoursUntilStreakBreaks: 0 }],
		['invalid window', { streakCount: 4, hoursUntilStreakBreaks: Number.NaN }],
	] as const)('does not manufacture urgency for %s', (_label, stats) => {
		expect(isStreakAtRisk(stats)).toBe(false)
	})
})
