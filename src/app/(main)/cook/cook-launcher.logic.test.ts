import { hasActiveCookSession } from './cook-launcher.logic'

describe('hasActiveCookSession', () => {
	it('returns true when session is in progress and has recipe id', () => {
		expect(
			hasActiveCookSession({ status: 'in_progress', recipeId: 'r-1' }),
		).toBe(true)
	})

	it('returns false when session has no recipe id', () => {
		expect(hasActiveCookSession({ status: 'in_progress', recipeId: '' })).toBe(
			false,
		)
	})

	it('returns false when session is not in progress', () => {
		expect(hasActiveCookSession({ status: 'completed', recipeId: 'r-1' })).toBe(
			false,
		)
	})

	it('returns false for nullish sessions', () => {
		expect(hasActiveCookSession(undefined)).toBe(false)
		expect(hasActiveCookSession(null)).toBe(false)
	})
})
