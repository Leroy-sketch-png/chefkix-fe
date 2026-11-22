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

	it('keeps mode and sort controls compact and readable on narrow screens', () => {
		expect(commandDeckSource).toContain('flex flex-row flex-wrap items-center gap-2')
		expect(commandDeckSource).toContain(
			'flex-[1_1_100%] sm:flex-[1_1_11.5rem]',
		)
		expect(commandDeckSource).toContain('[&>button]:whitespace-normal')
		expect(commandDeckSource).toContain('max-[319px]:flex-col')
		expect(commandDeckSource).toContain('max-[319px]:items-stretch')
		expect(commandDeckSource).toContain(
			'w-32 shrink-0 max-[319px]:w-full sm:w-44',
		)
		expect(commandDeckSource).toContain('[&>button]:min-h-11')
		expect(commandDeckSource).toContain(
			"className='explore-command-result-count text-xs font-medium text-text-muted'",
		)
		expect(commandDeckSource).toContain('{labels.subtitle}')
		expect(commandDeckSource).toContain('{labels.commandInput}')
		expect(commandDeckSource).toContain('explore-command-intro sm:mb-4')
		expect(commandDeckSource).toContain('explore-command-input-label')
		expect(messages.explore.commandSubtitle).toBeTruthy()
		expect(messages.explore.commandInput).toBeTruthy()
	})
})
