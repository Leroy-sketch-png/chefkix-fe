import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	CHALLENGE_STREAMS,
	getChallengeCommandMetrics,
	getFailedChallengeStreams,
} from '@/lib/challenge-availability'

describe('challenge stream availability', () => {
	it('counts live challenge instances without counting upcoming seasonal events', () => {
		expect(
			getChallengeCommandMetrics({
				failedStreams: [],
				hasDaily: true,
				hasWeekly: false,
				communityCount: 2,
				seasonalStatuses: ['ACTIVE', 'UPCOMING', 'EXPIRED'],
			}),
		).toEqual({
			activeChallengeCount: 4,
			dailyCount: 1,
			weeklyCount: 0,
			communityCount: 2,
			seasonalCount: 3,
		})
	})

	it('keeps failed streams unknown without suppressing successful category counts', () => {
		expect(
			getChallengeCommandMetrics({
				failedStreams: ['daily', 'community'],
				hasDaily: false,
				hasWeekly: true,
				communityCount: 0,
				seasonalStatuses: ['ACTIVE', 'UPCOMING'],
			}),
		).toEqual({
			activeChallengeCount: null,
			dailyCount: null,
			weeklyCount: 1,
			communityCount: null,
			seasonalCount: 2,
		})
	})

	it('keeps the command-deck metric wired to lifecycle status and honest copy', () => {
		const page = readFileSync(
			join(process.cwd(), 'src/app/(main)/challenges/page.tsx'),
			'utf8',
		)
		const deck = readFileSync(
			join(
				process.cwd(),
				'src/components/challenges/ChallengesCommandDeck.tsx',
			),
			'utf8',
		)
		const messages = JSON.parse(
			readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'),
		)

		expect(page).toContain('getChallengeCommandMetrics({')
		expect(deck).toContain("label={t('statActiveChallenges')}")
		expect(deck).toContain('<span aria-label={unavailableLabel}>—</span>')
		expect(messages.challenges.statActiveChallenges).toBe('Active Challenges')
		expect(messages.challenges.countUnavailable).toBe('Count unavailable')
		expect(messages.challenges.statActiveStreams).toBeUndefined()
	})

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
