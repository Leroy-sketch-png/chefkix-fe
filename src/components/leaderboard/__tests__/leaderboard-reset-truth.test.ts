import fs from 'node:fs'
import path from 'node:path'

describe('leaderboard reset authority', () => {
	const route = fs.readFileSync(
		path.join(process.cwd(), 'src/app/(main)/leaderboard/page.tsx'),
		'utf8',
	)
	const page = fs.readFileSync(
		path.join(process.cwd(), 'src/components/leaderboard/LeaderboardPage.tsx'),
		'utf8',
	)
	const barrel = fs.readFileSync(
		path.join(process.cwd(), 'src/components/leaderboard/index.ts'),
		'utf8',
	)

	it('does not invent reset dates or countdowns on the client', () => {
		expect(route).not.toContain('getResetInfo')
		expect(route).not.toContain('nextSunday')
		expect(page).not.toContain('ResetTimer')
		expect(page).not.toContain('resetInfo')
		expect(page).not.toContain("t('resetsIn')")
		expect(barrel).not.toContain('ResetInfo')
	})
})
