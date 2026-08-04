import {
	createMentionToken,
	haveSameMentionIds,
	reconcileSelectedMentions,
	type SelectedMention,
} from '@/lib/mentions'

const selected: SelectedMention[] = [
	{ userId: 'user-1', token: '@linhnguyen' },
	{ userId: 'user-2', token: '@minhtran' },
]

describe('mention identity reconciliation', () => {
	it('creates a canonical token from a username', () => {
		expect(createMentionToken(' @linhnguyen ')).toBe('@linhnguyen')
	})

	it('keeps identities whose complete tokens remain visible', () => {
		expect(
			reconcileSelectedMentions(
				'Dinner with @linhnguyen, then ask @minhtran!',
				selected,
			),
		).toEqual(selected)
	})

	it('removes an identity when its visible token is deleted', () => {
		expect(
			reconcileSelectedMentions('Dinner with @minhtran', selected),
		).toEqual([selected[1]])
	})

	it('does not treat a longer username as the selected token', () => {
		expect(
			reconcileSelectedMentions(
				'Dinner with @linhnguyen2 or @minhtran-extra',
				selected,
			),
		).toEqual([])
	})

	it('removes all identities after an external clear', () => {
		expect(reconcileSelectedMentions('', selected)).toEqual([])
	})

	it('compares the emitted identity order without coupling to token text', () => {
		expect(haveSameMentionIds(selected, [...selected])).toBe(true)
		expect(haveSameMentionIds(selected, [selected[1], selected[0]])).toBe(false)
	})
})
