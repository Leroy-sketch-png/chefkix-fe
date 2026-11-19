import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CookingSubstitutionButton } from '../CookingSubstitutionButton'
import { suggestSubstitutions } from '@/services/ai'

jest.mock('next-intl', () => ({
	useTranslations:
		() =>
		(
			key: string,
			values?: { ingredient?: string; count?: number; recipe?: string },
		) => {
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

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason?: unknown) => void
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise
		reject = rejectPromise
	})
	return { promise, resolve, reject }
}

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

		fireEvent.click(
			screen.getByRole('button', {
				name: 'findSubstituteForIngredient:butter',
			}),
		)

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

	it('does not let a closed cooking request replace the reopened dialog loading state', async () => {
		type SuggestionResponse = Awaited<ReturnType<typeof suggestSubstitutions>>
		const oldRequest = deferred<SuggestionResponse>()
		const currentRequest = deferred<SuggestionResponse>()
		mockedSuggest
			.mockReturnValueOnce(oldRequest.promise)
			.mockReturnValueOnce(currentRequest.promise)
		const onChoice = jest.fn().mockResolvedValue(true)
		render(
			<CookingSubstitutionButton
				ingredientName='butter'
				recipeTitle='Weeknight Curry'
				onChoice={onChoice}
			/>,
		)

		fireEvent.click(
			screen.getByRole('button', {
				name: 'findSubstituteForIngredient:butter',
			}),
		)
		fireEvent.click(screen.getByRole('button', { name: 'closeSubstitution' }))
		fireEvent.click(
			screen.getByRole('button', {
				name: 'findSubstituteForIngredient:butter',
			}),
		)

		await act(async () => {
			oldRequest.resolve({
				success: true,
				message: 'stale',
				statusCode: 200,
				data: {
					originalIngredient: 'butter',
					reason: 'unavailable',
					substitutions: [
						{
							name: 'stale suggestion',
							ratio: '1:1',
							notes: '',
							confidenceScore: 0.5,
						},
					],
				},
			})
			await oldRequest.promise
		})

		expect(screen.getByText('substitutionLoading')).toBeTruthy()
		expect(screen.queryByText('stale suggestion')).toBeNull()

		await act(async () => {
			currentRequest.resolve({
				success: true,
				message: 'current',
				statusCode: 200,
				data: {
					originalIngredient: 'butter',
					reason: 'unavailable',
					substitutions: [
						{
							name: 'current suggestion',
							ratio: '1:1',
							notes: '',
							confidenceScore: 0.5,
						},
					],
				},
			})
			await currentRequest.promise
		})
		expect(await screen.findByText('current suggestion')).toBeTruthy()
	})
})
