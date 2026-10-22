import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	CHALLENGE_STREAMS,
	getFailedChallengeStreams,
} from '@/lib/challenge-availability'

describe('challenge stream availability', () => {
	it('returns no failures when every stream succeeds', () => {
		expect(
			getFailedChallengeStreams({
				daily: { success: true },
				weekly: { success: true },
				community: { success: true },
				seasonal: { success: true },
			}),
		).toEqual([])
	})

	it('names only the unavailable streams during a partial outage', () => {
		expect(
			getFailedChallengeStreams({
				daily: null,
				weekly: { success: true },
				community: { success: false },
				seasonal: { success: true },
			}),
		).toEqual(['daily', 'community'])
	})

	it('reports all streams when the challenge surface is unavailable', () => {
		expect(
			getFailedChallengeStreams({
				daily: undefined,
				weekly: undefined,
				community: undefined,
				seasonal: undefined,
			}),
		).toEqual(CHALLENGE_STREAMS)
	})

	it('clears stale stream data when a refresh is unavailable', () => {
		const page = readFileSync(
			join(process.cwd(), 'src/app/(main)/challenges/page.tsx'),
			'utf8',
		)

		expect(page).toContain('setDailyChallenge(null)')
		expect(page).toContain('setWeeklyChallenge(null)')
		expect(page).toContain('setCommunityChallenges([])')
		expect(page).toContain('setSeasonalChallenges([])')
	})
})
