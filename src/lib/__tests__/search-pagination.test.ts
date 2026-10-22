import {
	hasMoreSearchResults,
	mergeUniqueSearchResults,
} from '@/lib/search-pagination'

describe('search pagination', () => {
	it('appends only unseen results while preserving server order', () => {
		expect(
			mergeUniqueSearchResults(
				[
					{ id: 'one', title: 'One' },
					{ id: 'two', title: 'Two' },
				],
				[
					{ id: 'two', title: 'Two updated' },
					{ id: 'three', title: 'Three' },
					{ id: 'three', title: 'Three duplicate' },
					{ id: 'four', title: 'Four' },
				],
			),
		).toEqual([
			{ id: 'one', title: 'One' },
			{ id: 'two', title: 'Two' },
			{ id: 'three', title: 'Three' },
			{ id: 'four', title: 'Four' },
		])
	})

	it('reports more results only while the loaded count is below authority', () => {
		expect(hasMoreSearchResults(20, 21)).toBe(true)
		expect(hasMoreSearchResults(20, 20)).toBe(false)
		expect(hasMoreSearchResults(21, 20)).toBe(false)
	})
})
