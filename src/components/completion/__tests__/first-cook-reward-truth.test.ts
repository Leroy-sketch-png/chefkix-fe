import fs from 'node:fs'
import path from 'node:path'
import {
	getPostDeadlineDays,
	getPostDeadlineHours,
} from '@/lib/cooking-reward-presentation'

const read = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('First Cook reward truth', () => {
	it('derives the displayed deadline duration from the completed session response', () => {
		expect(
			getPostDeadlineDays('2026-10-15T10:00:00Z', '2026-10-29T10:00:00Z'),
		).toBe(14)
		expect(
			getPostDeadlineDays('2026-10-15T10:00:00Z', '2026-10-26T10:00:00Z'),
		).toBe(11)
		expect(
			getPostDeadlineHours('2026-10-15T10:00:00Z', '2026-10-29T10:00:00Z'),
		).toBe(336)
	})

	it('does not turn malformed or elapsed deadlines into a positive promise', () => {
		expect(getPostDeadlineDays('invalid', '2026-10-29T10:00:00Z')).toBeNull()
		expect(getPostDeadlineHours('invalid', '2026-10-29T10:00:00Z')).toBeNull()
		expect(
			getPostDeadlineDays('2026-10-15T10:00:00Z', '2026-10-14T10:00:00Z'),
		).toBe(0)
	})

	it('passes server-returned pending XP and deadline through the First Cook handoff', () => {
		const player = read('src/components/cooking/CookingPlayer.tsx')
		const provider = read('src/components/providers/CelebrationProvider.tsx')

		expect(player).toContain('xpEarned: completionResult.baseXpAwarded')
		expect(player).toContain(
			"xpDeliveryStatus: completionResult.xpDeliveryStatus ?? 'QUEUED'",
		)
		expect(player).toContain('pendingXp: completionResult.pendingXp')
		expect(player).toContain('completionResult.completedAt')
		expect(player).toContain('completionResult.postDeadline')
		expect(player).toContain('postDeadlineHours: getPostDeadlineHours(')
		expect(player).not.toContain('postDeadlineHours: 336')
		expect(provider).toContain('pendingXp={firstCookData.pendingXp}')
		expect(provider).toContain(
			'xpDeliveryStatus={firstCookData.xpDeliveryStatus}',
		)
		expect(provider).toContain(
			'postDeadlineDays={firstCookData.postDeadlineDays}',
		)
		expect(provider).not.toContain('pendingXp={20}')
		expect(provider).not.toContain('postDeadlineDays={2}')
	})
})
