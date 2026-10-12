import fs from 'node:fs'
import path from 'node:path'

import {
	countCompletedDaysThisUtcWeek,
	getChallengeHistory,
	type ChallengeHistoryItem,
} from '@/services/challenge'
import { api } from '@/lib/axios'

jest.mock('@/lib/axios', () => ({
	api: { get: jest.fn() },
}))

const item = (date: string, completed = true): ChallengeHistoryItem => ({
	id: `challenge-${date}`,
	title: 'Daily challenge',
	date,
	completed,
	bonusXpEarned: completed ? 50 : 0,
})

describe('challenge history truth', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('counts distinct completed UTC dates in the current Monday-based week', () => {
		const history = [
			item('2026-07-27'),
			item('2026-07-27'),
			item('2026-07-28'),
			item('2026-07-29', false),
			item('2026-07-20'),
			item('2026-07-30'),
		]

		expect(
			countCompletedDaysThisUtcWeek(history, new Date('2026-07-29T12:00:00Z')),
		).toBe(2)
	})

	it('uses the backend size contract and removes unsupported month controls', () => {
		const root = process.cwd()
		const service = fs.readFileSync(
			path.join(root, 'src/services/challenge.ts'),
			'utf8',
		)
		const route = fs.readFileSync(
			path.join(root, 'src/app/(main)/challenges/history/page.tsx'),
			'utf8',
		)
		const view = fs.readFileSync(
			path.join(root, 'src/components/challenges/ChallengeHistory.tsx'),
			'utf8',
		)

		expect(service).toContain('{ params: { page, size } }')
		expect(service).not.toContain('{ params: { limit } }')
		expect(route).toContain('page: 0,\n\t\t\t\t\tsize: HISTORY_PAGE_SIZE')
		expect(route).toContain('response.data.pagination.hasNext')
		expect(route).toContain('else {\n\t\t\t\t\tsetFetchError(true)')
		expect(route).toContain('setRetryKey(key => key + 1)')
		expect(route).toContain("router.push('/challenges')")
		expect(route).not.toContain('window.location.reload()')
		expect(route).not.toContain('router.back()')
		expect(view).not.toContain('Simple calendar grid placeholder')
		expect(view).not.toContain('onMonthChange')
		expect(view).toContain("t('historyEmptyTitle')")
	})

	it('sends explicit page and size parameters to the history contract', async () => {
		;(api.get as jest.Mock).mockResolvedValue({
			data: {
				success: true,
				data: {
					challenges: [],
					stats: {
						totalCompleted: 0,
						currentStreak: 0,
						longestStreak: 0,
						totalBonusXp: 0,
					},
					pagination: {
						page: 2,
						size: 25,
						totalElements: 60,
						hasNext: false,
					},
				},
			},
		})

		await getChallengeHistory({ page: 2, size: 25 })

		expect(api.get).toHaveBeenCalledWith(expect.any(String), {
			params: { page: 2, size: 25 },
		})
	})
})
