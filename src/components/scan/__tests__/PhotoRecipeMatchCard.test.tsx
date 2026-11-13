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
	})
})
