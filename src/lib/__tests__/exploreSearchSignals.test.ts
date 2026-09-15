import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/explore/ExploreClient.tsx'),
	'utf8',
)

const messages = JSON.parse(
	fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
) as { explore: Record<string, string> }

const commandDeckSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/explore/ExploreCommandDeck.tsx'),
	'utf8',
)

const emptyStateSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/shared/EmptyStateGamified.tsx'),
	'utf8',
)

describe('Explore search-signal contract', () => {
	it('renders only API-backed terms and does not resurrect animated fake trends', () => {
		expect(source).toContain('getTrendingSearches(8)')
		expect(source).toContain('trendingSearches.slice(0, 5).map(term =>')
		expect(source).toContain('{trendingSearches.length > 0 && (')
		expect(source).not.toContain('TextLoop')
		expect(source).not.toMatch(
			/Italian Pasta|High Protein Wraps|Healthy Bowls|Keto Dinners|Foolproof Desserts|Quick dinner|Healthy breakfast/,
		)
	})

	it('makes each live term an accessible search action', () => {
		expect(source).toContain("type='button'")
		expect(source).toContain('setSearchQuery(term)')
		expect(source).toContain('setDebouncedSearch(term)')
		expect(source).toContain('onSuggestionClick={term => {')
		expect(source).toContain('setShowAutocomplete(false)')
	})

	it('localizes the shared suggestion caption', () => {
		expect(emptyStateSource).toContain("useTranslations('search')")
		expect(emptyStateSource).toContain("{searchT('didYouMean')}:")
		expect(emptyStateSource).not.toContain('Did you mean:')
	})

	it('cannot render active-looking suggestion controls without an action', () => {
		expect(emptyStateSource).toContain('onSuggestionClick && (')
		expect(emptyStateSource).toContain(
			'onClick={() => onSuggestionClick(suggestion)}',
		)
		expect(emptyStateSource).not.toContain('onSuggestionClick?.(suggestion)')
	})

	it('keeps the social trend heading in the translation contract', () => {
		expect(source).toContain("{t('trendingCommunity')}")
		expect(source).not.toContain('Trending in the Community')
		expect(messages.explore.trendingCommunity).toBe('Trending in the community')
	})

	it('stacks mode and sort controls on narrow screens without hardcoded copy', () => {
		expect(commandDeckSource).toContain(
			"className='flex flex-col gap-2 sm:flex-row sm:items-center'",
		)
		expect(commandDeckSource).toContain("className='w-full shrink-0 sm:w-44'")
		expect(commandDeckSource).toContain('{labels.subtitle}')
		expect(commandDeckSource).toContain('{labels.commandInput}')
		expect(messages.explore.commandSubtitle).toBeTruthy()
		expect(messages.explore.commandInput).toBeTruthy()
	})
})
