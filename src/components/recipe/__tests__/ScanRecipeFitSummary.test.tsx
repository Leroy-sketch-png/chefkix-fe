import { render, screen } from '@testing-library/react'
import { ScanRecipeFitSummary } from '@/components/recipe/ScanRecipeFitSummary'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

describe('ScanRecipeFitSummary', () => {
	it('keeps exact match, entered, and missing names together with a return path', () => {
		render(
			<ScanRecipeFitSummary
				providedIngredients={['Garlic', 'Rice', 'Eggs', 'Soy sauce']}
				recipeIngredients={[
					'Day-old rice',
					'Garlic',
					'Eggs',
					'Soy sauce',
					'Oil',
				]}
			/>,
		)

		expect(
			screen.getByText('Garlic, Rice, Eggs, Soy sauce'),
		).toBeInTheDocument()
		expect(screen.getByText('Day-old rice, Oil')).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'scanBackToIngredientResults' }),
		).toHaveAttribute('href', '/scan#ingredient-match-results')
		expect(screen.getByText(/scanDetailFitCounts/)).toBeInTheDocument()
		expect(screen.getByText(/scanDetailFitScope/)).toBeInTheDocument()
	})

	it('shows no exact matches without implying the recipe is covered', () => {
		render(
			<ScanRecipeFitSummary
				providedIngredients={['Tofu']}
				recipeIngredients={['Rice', 'Oil']}
			/>,
		)

		expect(screen.getByText(/scanDetailFitNoMatched/)).toBeInTheDocument()
		expect(screen.getByText('Rice, Oil')).toBeInTheDocument()
		expect(screen.getByText(/scanDetailFitCounts/)).toBeInTheDocument()
	})
})
