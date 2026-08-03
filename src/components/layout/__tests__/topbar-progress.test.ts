import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getTopbarProgress } from '@/components/layout/topbar-progress'

const validStatistics = {
	currentLevel: 5,
	currentXP: 80,
	currentXPGoal: 100,
	streakCount: 7,
}

describe('Topbar progress authority', () => {
	it('derives bounded progress from valid statistics', () => {
		expect(getTopbarProgress(validStatistics)).toEqual({
			level: 5,
			currentXP: 80,
			currentXPGoal: 100,
			streakCount: 7,
			percent: 80,
		})
		expect(
			getTopbarProgress({ ...validStatistics, currentXP: 140 })?.percent,
		).toBe(100)
	})

	it.each([
		undefined,
		{ ...validStatistics, currentLevel: 0 },
		{ ...validStatistics, currentXP: -1 },
		{ ...validStatistics, currentXPGoal: 0 },
		{ ...validStatistics, streakCount: -1 },
		{ ...validStatistics, currentXP: Number.NaN },
		{ ...validStatistics, currentXPGoal: Number.POSITIVE_INFINITY },
	])('rejects absent or invalid progress %#', statistics => {
		expect(getTopbarProgress(statistics)).toBeNull()
	})

	it('pins responsive, navigable, and accessible shell semantics', () => {
		const source = readFileSync(
			join(process.cwd(), 'src/components/layout/Topbar.tsx'),
			'utf8',
		)

		expect(source).toContain(
			'const progress = getTopbarProgress(user?.statistics)',
		)
		expect(source).toContain('href={PATHS.PROFILE}')
		expect(source).toContain("xl:flex'")
		expect(source).toContain("t('tbProgressSummary'")
		expect(source).toContain("t('tbXpProgress'")
		expect(source).toContain('progress.streakCount > 0')
		expect(source).toContain("t('tbNotificationsUnread'")
		expect(source).toContain("t('tbMessagesUnread'")
		expect(source).not.toContain('Instagram meets Duolingo')
	})
})
