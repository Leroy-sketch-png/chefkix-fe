import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CookingSubstitutionButton } from '../CookingSubstitutionButton'
import { suggestSubstitutions } from '@/services/ai'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, values?: { ingredient?: string; count?: number; recipe?: string }) => {
		if (values?.ingredient) return `${key}:${values.ingredient}`
		return key
	},
}))

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({ user: { allergenFlags: [] } }),
}))

jest.mock('@/services/ai', () => ({
	suggestSubstitutions: jest.fn(),
}))

const mockedSuggest = jest.mocked(suggestSubstitutions)

describe('CookingSubstitutionButton engineering contract', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockedSuggest.mockResolvedValue({
			success: true,
			message: 'ok',
			statusCode: 200,
			data: {
				originalIngredient: 'butter',
				reason: 'unavailable',
				substitutions: [
					{
						name: 'coconut oil',
						ratio: '1:1',
						notes: 'Works well for sauteing',
						confidenceScore: 0.88,
						suggestionId: 'sug-456',
						candidateReceipt: 'receipt-sig-789',
					},
				],
			},
		})
	})

	it('passes sessionId to suggestSubstitutions and forwards signed receipt to onChoice on accept', async () => {
		const onChoice = jest.fn().mockResolvedValue(true)
		render(
			<CookingSubstitutionButton
				ingredientName='butter'
				recipeTitle='Weeknight Curry'
				stepContext='Melt the butter in a pan'
				sessionId='sess-xyz'
				onChoice={onChoice}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'findSubstituteForIngredient:butter' }))

		await waitFor(() => {
			expect(mockedSuggest).toHaveBeenCalledWith(
				'butter',
				'unavailable',
				'Recipe: Weeknight Curry\nCurrent step: Melt the butter in a pan',
				undefined,
				[],
				'sess-xyz',
			)
		})

		const useBtn = await screen.findByRole('button', { name: 'useSubstitute' })
		fireEvent.click(useBtn)

		await waitFor(() => {
			expect(onChoice).toHaveBeenCalledWith(
				'accept',
				'coconut oil',
				'receipt-sig-789',
				'sug-456',
			)
		})
	})
})
