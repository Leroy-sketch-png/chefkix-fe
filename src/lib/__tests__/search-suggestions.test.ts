import { getSearchSuggestionLabels } from '@/lib/search-suggestions'

describe('getSearchSuggestionLabels', () => {
	it('prioritizes recipe, person, and post labels without duplicates', () => {
		expect(
			getSearchSuggestionLabels(
				{
					recipes: {
						found: 2,
						hits: [
							{ document: { title: 'Pho' } },
							{ document: { title: 'Bun cha' } },
						] as never,
					},
					users: {
						found: 1,
						hits: [
							{ document: { displayName: 'Chef Lan', username: 'lan' } },
						] as never,
					},
					posts: {
						found: 2,
						hits: [
							{ document: { recipeTitle: 'pho' } },
							{ document: { recipeTitle: 'Banh xeo' } },
						] as never,
					},
				},
				'noodles',
			),
		).toEqual(['Pho', 'Bun cha', 'Chef Lan', 'lan', 'Banh xeo'])
	})

	it('omits the submitted query, blanks, and labels beyond the limit', () => {
		expect(
			getSearchSuggestionLabels(
				{
					recipes: {
						found: 4,
						hits: [
							{ document: { title: ' PHO ' } },
							{ document: { title: ' ' } },
							{ document: { title: 'Pho ga' } },
							{ document: { title: 'Pho bo' } },
						] as never,
					},
				},
				'pho',
				1,
			),
		).toEqual(['Pho ga'])
	})

	it('returns no labels when the response is unavailable', () => {
		expect(getSearchSuggestionLabels(undefined, 'pho')).toEqual([])
	})
})
