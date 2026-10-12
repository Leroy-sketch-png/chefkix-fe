import fs from 'node:fs'
import path from 'node:path'

describe('leaderboard timeframe labels', () => {
	const page = fs.readFileSync(
		path.join(process.cwd(), 'src/components/leaderboard/LeaderboardPage.tsx'),
		'utf8',
	)

	it('labels rank XP from the active timeframe', () => {
		expect(page).toContain("case 'monthly':")
		expect(page).toContain("return t('xpThisMonth')")
		expect(page).toContain("case 'all_time':")
		expect(page).toContain("return t('xpAllTime')")
		expect(page).toContain("case 'weekly':")
		expect(page).toContain("return t('xpThisWeek')")
		expect(page).toContain('timeframe={timeframe}')
		expect(page).toContain('{xpLabel}')
	})
})
