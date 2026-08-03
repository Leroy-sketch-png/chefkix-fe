import fs from 'node:fs'
import path from 'node:path'

import {
	countCompletedDaysThisUtcWeek,
	type ChallengeHistoryItem,
} from '@/services/challenge'

const item = (date: string, completed = true): ChallengeHistoryItem => ({
	id: `challenge-${date}`,
	title: 'Daily challenge',
	date,
	completed,
	bonusXpEarned: completed ? 50 : 0,
})

describe('challenge history truth', () => {
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

		expect(service).toContain('{ params: { size } }')
		expect(service).not.toContain('{ params: { limit } }')
		expect(route).toContain('getChallengeHistory(100)')
		expect(route).toContain('else {\n\t\t\t\t\tsetFetchError(true)')
		expect(view).not.toContain('Simple calendar grid placeholder')
		expect(view).not.toContain('onMonthChange')
		expect(view).toContain("t('historyEmptyTitle')")
	})
})
