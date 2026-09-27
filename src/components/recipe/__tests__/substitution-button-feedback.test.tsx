import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SubstitutionButton } from '../SubstitutionButton'
import { suggestSubstitutions } from '@/services/ai'
import { submitSubstitutionFeedback } from '@/services/cookingSession'

const mockedRequireAuth = jest.fn(() => true)

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, values?: { ingredient?: string }) =>
		values?.ingredient ? `${key}:${values.ingredient}` : key,
}))

jest.mock('@/services/ai', () => ({
	suggestSubstitutions: jest.fn(),
}))

jest.mock('@/services/cookingSession', () => ({
	submitSubstitutionFeedback: jest.fn(),
}))

jest.mock('@/hooks/useAuthActionGuard', () => ({
	useAuthActionGuard: () => ({ requireAuth: mockedRequireAuth }),
}))

const mockedSuggest = jest.mocked(suggestSubstitutions)
const mockedSubmit = jest.mocked(submitSubstitutionFeedback)

describe('SubstitutionButton feedback evidence', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockedRequireAuth.mockReturnValue(true)
		mockedSuggest.mockResolvedValue({
			success: true,
			message: 'ok',
			statusCode: 200,
			data: {
				originalIngredient: 'butter',
				reason: 'unavailable',
				substitutions: [
					{
						name: 'olive oil',
						ratio: '3:4',
						notes: 'Reduce other liquids.',
						confidenceScore: 0.82,
						suggestionId: 'suggestion-1',
						candidateReceipt: 'signed-receipt-1',
					},
				],
			},
		})
		mockedSubmit.mockResolvedValue({
			success: true,
			message: 'recorded',
			statusCode: 200,
			data: 'event-1',
		})
	})

	it('opens the auth gate instead of calling the credentialed proxy for a guest', () => {
		mockedRequireAuth.mockReturnValue(false)
		render(<SubstitutionButton ingredientName='butter' />)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		expect(mockedRequireAuth).toHaveBeenCalledWith('findSubstituteFor:butter')
		expect(mockedSuggest).not.toHaveBeenCalled()
		expect(screen.queryByRole('dialog')).toBeNull()
	})

	it('binds the request and accepted feedback to the active session and issued receipt', async () => {
		render(
			<SubstitutionButton
				ingredientName='butter'
				recipeTitle='Pasta'
				sessionId='session-1'
			/>,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		await waitFor(() =>
			expect(mockedSuggest).toHaveBeenCalledWith(
				'butter',
				'unavailable',
				'Recipe: Pasta',
				undefined,
				'session-1',
			),
		)
		expect(screen.queryByRole('button', { name: 'reasonDietary' })).toBeNull()
		fireEvent.click(
			await screen.findByRole('button', { name: 'substitutionWorks' }),
		)

		await waitFor(() =>
			expect(mockedSubmit).toHaveBeenCalledWith('session-1', {
				clientFeedbackId: 'sub:suggestion-1:accepted',
				originalIngredient: 'butter',
				substituteIngredient: 'olive oil',
				candidateReceipt: 'signed-receipt-1',
				accepted: true,
			}),
		)
		expect(
			screen
				.getByRole('button', { name: 'feedbackRecorded' })
				.getAttribute('disabled'),
		).not.toBeNull()
	})

	it('does not expose feedback controls for an unreceipted candidate', async () => {
		mockedSuggest.mockResolvedValueOnce({
			success: true,
			message: 'ok',
			statusCode: 200,
			data: {
				originalIngredient: 'butter',
				reason: 'unavailable',
				substitutions: [
					{
						name: 'olive oil',
						ratio: '3:4',
						notes: '',
						confidenceScore: 0.82,
					},
				],
			},
		})

		render(<SubstitutionButton ingredientName='butter' sessionId='session-1' />)
		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		await screen.findByText('olive oil')
		expect(
			screen.queryByRole('button', { name: 'substitutionWorks' }),
		).toBeNull()
		expect(mockedSubmit).not.toHaveBeenCalled()
	})
})
