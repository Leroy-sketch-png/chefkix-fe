import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

describe('truthful competition state', () => {
	it('keeps sparse leaderboards as real rows without ghost podium entries', () => {
		const source = readSource('src/components/leaderboard/LeaderboardPage.tsx')

		expect(source).toContain('const showPodium = podiumEntries.length === 3')
		expect(source).toContain(
			'const listEntries = showPodium ? entries.filter(e => e.rank > 3) : entries',
		)
		expect(source).not.toContain('placeholder-${i}')
		expect(source).not.toContain('Array(3 - podiumEntries.length)')
		expect(source.match(/<LeaderboardItem entry=\{userInList\}/g)).toBeNull()
	})

	it('does not turn rank absence or capped entries into user-facing claims', () => {
		const route = readSource('src/app/(main)/leaderboard/page.tsx')
		const page = readSource('src/components/leaderboard/LeaderboardPage.tsx')

		expect(route).toContain('rank && rank.rank > 0')
		expect(route).toContain('isCurrentUser: e.userId === user?.userId')
		expect(route).not.toContain("chipText={t('chefCount'")
		expect(route).not.toContain('xpToNextRank ?? 0')
		expect(route).not.toContain('nextRankPosition ?? 0')
		expect(page).toContain('myRank.rank > 0')
		expect(page).toContain('myRank.xpToNextRank > 0')
		expect(page).toContain('myRank.nextRankPosition > 0')
	})

	it('does not expose a global-identical league mode as a distinct tab', () => {
		const source = readSource('src/components/leaderboard/LeaderboardPage.tsx')

		expect(source).not.toContain(
			"{ type: 'league', label: t('tabLeague'), icon: Trophy }",
		)
	})

	it('renders completed daily challenges without invented recipe or streak data', () => {
		const route = readSource('src/app/(main)/challenges/page.tsx')
		const banner = readSource(
			'src/components/challenges/DailyChallengeBanner.tsx',
		)

		expect(route).toContain('completed: data.completed')
		expect(route).toContain('dailyChallenge.completed ?')
		expect(route).toContain("variant='completed'")
		expect(banner).toContain('completedWith?:')
		expect(banner).toContain('streakCount?: number')
		expect(banner).toContain("t('completedToday')")
	})

	it('uses translation keys for adjacent leaderboard state labels', () => {
		const item = readSource('src/components/leaderboard/LeaderboardItem.tsx')
		const friends = readSource(
			'src/components/leaderboard/FriendsLeaderboard.tsx',
		)

		expect(item).toContain("t('levelN', { n: entry.level })")
		expect(item).toContain("t('leading')")
		expect(friends).toContain("t('globalCompetition')")
		expect(friends).toContain("t('onlyOneInvite')")
		expect(friends).toContain("t('inviteShowdown')")
		expect(friends).not.toContain('Cook to defend')
		expect(friends).not.toContain('Ready to Compete?')
	})
})
