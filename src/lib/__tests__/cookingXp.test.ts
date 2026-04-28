import {
	getOrdinalSuffix,
	getRepeatCookXpTier,
	hasClaimablePostXp,
	isNoRecipeXpRun,
} from '@/lib/cookingXp'

describe('cookingXp helpers', () => {
	describe('getOrdinalSuffix', () => {
		it('handles standard ordinals', () => {
			expect(getOrdinalSuffix(1)).toBe('st')
			expect(getOrdinalSuffix(2)).toBe('nd')
			expect(getOrdinalSuffix(3)).toBe('rd')
			expect(getOrdinalSuffix(4)).toBe('th')
		})

		it('handles teen exceptions', () => {
			expect(getOrdinalSuffix(11)).toBe('th')
			expect(getOrdinalSuffix(12)).toBe('th')
			expect(getOrdinalSuffix(13)).toBe('th')
			expect(getOrdinalSuffix(111)).toBe('th')
		})
	})

	describe('getRepeatCookXpTier', () => {
		it('maps repeat counts to backend-aligned tiers', () => {
			expect(getRepeatCookXpTier(1)).toBe('full')
			expect(getRepeatCookXpTier(2)).toBe('half')
			expect(getRepeatCookXpTier(3)).toBe('quarter')
			expect(getRepeatCookXpTier(4)).toBe('exhausted')
			expect(getRepeatCookXpTier(7)).toBe('exhausted')
		})

		it('returns unknown for invalid values', () => {
			expect(getRepeatCookXpTier()).toBe('unknown')
			expect(getRepeatCookXpTier(null)).toBe('unknown')
			expect(getRepeatCookXpTier(0)).toBe('unknown')
			expect(getRepeatCookXpTier(-3)).toBe('unknown')
		})
	})

	describe('XP availability checks', () => {
		it('detects claimable post XP', () => {
			expect(hasClaimablePostXp(0)).toBe(false)
			expect(hasClaimablePostXp(10)).toBe(true)
			expect(hasClaimablePostXp(0, 5)).toBe(true)
		})

		it('detects no-recipe-XP runs', () => {
			expect(isNoRecipeXpRun(0, 0)).toBe(true)
			expect(isNoRecipeXpRun(1, 0)).toBe(false)
			expect(isNoRecipeXpRun(0, 1)).toBe(false)
		})
	})
})
