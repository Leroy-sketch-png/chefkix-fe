import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { SearchCommandDeck } from '@/components/search/SearchCommandDeck'

jest.mock('@/components/shared/FeedTabBar', () => ({
	FeedTabBar: () => null,
}))

jest.mock('framer-motion', () => ({
	motion: new Proxy(
		{},
		{
			get: (_target, element: string) => {
				const Component = ({ children, ...props }: React.PropsWithChildren) => {
					const safeProps = Object.fromEntries(
						Object.entries(props).filter(
							([key]) =>
								!['initial', 'animate', 'transition', 'whileTap'].includes(key),
						),
					)
					return React.createElement(element, safeProps, children)
				}
				return Component
			},
		},
	),
}))

const baseProps = {
	mode: 'discovery' as const,
	eyebrow: 'Discovery',
	heading: 'Find food',
	modeChipLabel: 'Live suggestions',
	searchValue: 'ph',
	onSearchChange: jest.fn(),
	onClear: jest.fn(),
	searchPlaceholder: 'Search',
	clearLabel: 'Clear',
	autocompleteTerms: ['Pho', 'Pho ga'],
	autocompleteLabel: 'Live suggestions',
	autocompleteLoadingLabel: 'Finding suggestions...',
	isAutocompleteLoading: false,
	onAutocompleteSelect: jest.fn(),
	suggestionsLabel: 'Ideas',
	suggestionTerms: [],
	recentSearchesLabel: 'Recent',
	recentSearches: [],
	onSuggestionClick: jest.fn(),
	onRemoveRecent: jest.fn(),
	getRemoveRecentLabel: (term: string) => `Remove ${term}`,
	trendingLabel: 'Trending',
	trendingTerms: [],
}

describe('SearchCommandDeck autocomplete', () => {
	beforeEach(() => jest.clearAllMocks())

	it('selects the active suggestion with the keyboard', () => {
		render(<SearchCommandDeck {...baseProps} />)
		const input = screen.getByRole('combobox', { name: 'Search' })

		fireEvent.focus(input)
		fireEvent.keyDown(input, { key: 'ArrowDown' })
		fireEvent.keyDown(input, { key: 'Enter' })

		expect(baseProps.onAutocompleteSelect).toHaveBeenCalledWith('Pho')
		expect(screen.queryByRole('listbox')).toBeNull()
	})

	it('wraps upward and closes without selecting on Escape', () => {
		const { rerender } = render(<SearchCommandDeck {...baseProps} />)
		const input = screen.getByRole('combobox', { name: 'Search' })

		fireEvent.focus(input)
		fireEvent.keyDown(input, { key: 'ArrowUp' })
		expect(
			screen
				.getByRole('option', { name: 'Pho ga' })
				.getAttribute('aria-selected'),
		).toBe('true')
		fireEvent.keyDown(input, { key: 'Escape' })

		expect(screen.queryByRole('listbox')).toBeNull()
		expect(baseProps.onAutocompleteSelect).not.toHaveBeenCalled()

		fireEvent.change(input, { target: { value: 'pho' } })
		rerender(<SearchCommandDeck {...baseProps} searchValue='pho' />)
		fireEvent.focus(screen.getByRole('combobox', { name: 'Search' }))
		expect(screen.getByRole('listbox')).toBeTruthy()
	})

	it('announces loading only after enough input', () => {
		const { rerender } = render(
			<SearchCommandDeck
				{...baseProps}
				autocompleteTerms={[]}
				isAutocompleteLoading
			/>,
		)
		fireEvent.focus(screen.getByRole('combobox', { name: 'Search' }))
		expect(screen.getByRole('status').textContent).toContain(
			'Finding suggestions...',
		)

		rerender(
			<SearchCommandDeck
				{...baseProps}
				searchValue='p'
				autocompleteTerms={[]}
				isAutocompleteLoading
			/>,
		)
		expect(screen.queryByRole('listbox')).toBeNull()
	})
})
