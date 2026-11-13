import { render, screen, waitFor } from '@testing-library/react'
import { PhotoIntelligencePanel } from '@/components/scan/PhotoIntelligencePanel'
import { findRecipesFromIngredients } from '@/services/photo-intelligence'

jest.mock('next-intl', () => {
	const translate = (key: string) => key
	return { useTranslations: () => translate }
})

jest.mock('@/services/photo-intelligence', () => ({
	findRecipesFromIngredients: jest.fn(),
}))

jest.mock('@/components/scan/PhotoRecipeMatches', () => ({
	PhotoRecipeMatches: ({
		matches,
	}: {
		matches: Array<{ recipeTitle: string }>
	}) => (
		<div data-testid='recipe-matches'>
			{matches.map(match => match.recipeTitle).join(', ')}
		</div>
	),
}))

describe('PhotoIntelligencePanel', () => {
	beforeEach(() => jest.clearAllMocks())

	it('does not request recipes until the user confirms an ingredient', () => {
		render(<PhotoIntelligencePanel ingredients={[]} inputSource='manual' />)

		expect(findRecipesFromIngredients).not.toHaveBeenCalled()
		expect(screen.queryByTestId('recipe-matches')).not.toBeInTheDocument()
	})

	it('matches only the confirmed ingredient list and renders returned recipes', async () => {
		jest.mocked(findRecipesFromIngredients).mockResolvedValue({
			matches: [
				{
					recipeId: 'recipe-1',
					recipeTitle: 'Tofu and greens',
					matchScore: 0.8,
					matchedIngredients: ['Tofu'],
					missingIngredients: [],
				},
			],
			queryIngredients: ['Tofu'],
			source: 'backend',
		})
		const confirmed = ['Tofu']

		render(
			<PhotoIntelligencePanel ingredients={confirmed} inputSource='scan' />,
		)

		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenCalledWith(
				['Tofu'],
				expect.any(AbortSignal),
			),
		)
		expect(await screen.findByText('Tofu and greens')).toBeInTheDocument()
	})

	it('discloses the bounded method and withheld metadata count', async () => {
		jest.mocked(findRecipesFromIngredients).mockResolvedValue({
			matches: [],
			queryIngredients: ['Tofu'],
			source: 'stored-overlap',
			withheldRecipeCount: 4,
		})

		render(
			<PhotoIntelligencePanel ingredients={['Tofu']} inputSource='manual' />,
		)

		expect(
			await screen.findByText('scanStoredOverlapDisclosure'),
		).toBeInTheDocument()
		expect(
			screen.getByText('scanStoredOverlapResultsCount'),
		).toBeInTheDocument()
	})
})
