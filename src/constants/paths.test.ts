import { PATHS } from './paths'

describe('PATHS', () => {
	it('builds encoded Explore searches without empty query noise', () => {
		expect(PATHS.EXPLORE_SEARCH('  Vietnamese family meals  ')).toBe(
			'/explore?q=Vietnamese%20family%20meals',
		)
		expect(PATHS.EXPLORE_SEARCH('   ')).toBe(PATHS.EXPLORE)
	})
})
