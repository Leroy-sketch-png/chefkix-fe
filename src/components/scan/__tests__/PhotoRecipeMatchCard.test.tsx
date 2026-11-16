import { render, screen } from '@testing-library/react'
import { PhotoRecipeMatchCard } from '@/components/scan/PhotoRecipeMatchCard'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/components/recipe/SubstitutionButton', () => ({
	SubstitutionButton: () => null,
}))

describe('PhotoRecipeMatchCard', () => {
	it('shows overlap counts instead of a model-style percentage', () => {
		render(
			<PhotoRecipeMatchCard
				match={{
					recipeId: 'recipe-1',
					recipeTitle: 'Tofu and greens',
					matchMethod: 'exact-ingredient-overlap',
					inputIngredientCount: 3,
					matchedIngredients: ['Tofu', 'Kale'],
					missingIngredients: ['Garlic'],
				}}
			/>,
		)

		expect(screen.getByText('scanStoredOverlapCount')).toBeInTheDocument()
		expect(screen.queryByText(/%/)).not.toBeInTheDocument()
		expect(screen.getByText('Tofu and greens')).toHaveClass(
			'min-w-0',
			'break-words',
		)
		expect(screen.getByText('Tofu and greens').parentElement).toHaveClass(
			'flex-col',
			'sm:flex-row',
		)
		expect(screen.getByText('scanStoredOverlapCount')).toHaveClass(
			'max-w-full',
			'whitespace-normal',
		)
		expect(
			screen.getByText('scanStoredOverlapMatchedIngredients'),
		).toBeInTheDocument()
		expect(
			screen.getByText('scanStoredOverlapMissingIngredients'),
		).toBeInTheDocument()
		expect(screen.queryByText('scanMatchedIngredients')).not.toBeInTheDocument()
		expect(screen.queryByText('scanMissingIngredients')).not.toBeInTheDocument()
	})

	it('keeps the existing labels for backend-produced matches', () => {
		render(
			<PhotoRecipeMatchCard
				match={{
					recipeId: 'backend-recipe',
					recipeTitle: 'Backend recipe',
					matchMethod: 'backend',
					matchedIngredients: ['Garlic'],
					missingIngredients: ['Rice'],
				}}
			/>,
		)

		expect(screen.getByText('scanMatchedIngredients')).toBeInTheDocument()
		expect(screen.getByText('scanMissingIngredients')).toBeInTheDocument()
		expect(
			screen.queryByText('scanStoredOverlapMatchedIngredients'),
		).not.toBeInTheDocument()
	})
})
