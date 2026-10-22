import {
	clearLocalRecipeDraft,
	isLocalRecipeDraftStale,
	LOCAL_RECIPE_DRAFT_KEY,
	LOCAL_RECIPE_DRAFT_STALE_DAYS,
	readLocalRecipeDraft,
	saveLocalRecipeDraft,
} from '@/lib/local-recipe-draft'

describe('local recipe draft persistence', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('round-trips a manual draft through the canonical storage key', () => {
		const data = { title: 'Weeknight noodles', steps: [{ id: 'step-1' }] }

		expect(saveLocalRecipeDraft(data)).toBe(true)

		const result = readLocalRecipeDraft<typeof data>()
		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			expect(result.draft.data).toEqual(data)
			expect(Date.parse(result.draft.savedAt)).not.toBeNaN()
		}
	})

	it.each([
		'{not-json',
		JSON.stringify({ type: 'manual', savedAt: 'invalid', data: {} }),
		JSON.stringify({
			type: 'other',
			savedAt: new Date().toISOString(),
			data: {},
		}),
	])('reports malformed recovery data without silently accepting it', raw => {
		window.localStorage.setItem(LOCAL_RECIPE_DRAFT_KEY, raw)

		expect(readLocalRecipeDraft()).toEqual({ status: 'corrupt' })
	})

	it('only removes recovery through the explicit clear operation', () => {
		saveLocalRecipeDraft({ title: 'Keep me' })

		expect(clearLocalRecipeDraft()).toBe(true)
		expect(readLocalRecipeDraft()).toEqual({ status: 'empty' })
	})

	it('classifies older recovery without mutating or deleting it', () => {
		const now = new Date('2026-10-07T12:00:00.000Z')
		const currentDraft = new Date(
			now.getTime() - (LOCAL_RECIPE_DRAFT_STALE_DAYS - 1) * 86_400_000,
		).toISOString()
		const olderDraft = new Date(
			now.getTime() - LOCAL_RECIPE_DRAFT_STALE_DAYS * 86_400_000,
		).toISOString()

		expect(isLocalRecipeDraftStale(currentDraft, now)).toBe(false)
		expect(isLocalRecipeDraftStale(olderDraft, now)).toBe(true)
	})
})
