import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
		error,
		loading,
		onRetry,
	}: {
		matches: Array<{ recipeTitle: string }>
		error?: string | null
		loading?: boolean
		onRetry?: () => void
	}) => (
		<div data-testid='recipe-matches'>
			{error && !loading && (
				<>
					<p role='alert'>{error}</p>
					{onRetry && (
						<button type='button' onClick={onRetry}>
							scanRetryIngredientMatching
						</button>
					)}
				</>
			)}
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
		expect(
			document.getElementById('ingredient-match-results'),
		).toBeInTheDocument()
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

	it('lets the user retry the same confirmed ingredients after a failure', async () => {
		const success = {
			matches: [
				{
					recipeId: 'recipe-2',
					recipeTitle: 'Tofu and greens',
					matchedIngredients: ['Tofu'],
					missingIngredients: [],
				},
			],
			queryIngredients: ['Tofu'],
			source: 'backend' as const,
		}
		jest
			.mocked(findRecipesFromIngredients)
			.mockRejectedValueOnce(new Error('Temporary matching failure'))
			.mockResolvedValueOnce(success)
		const confirmed = ['Tofu']

		render(
			<PhotoIntelligencePanel ingredients={confirmed} inputSource='scan' />,
		)

		const retry = await screen.findByRole('button', {
			name: 'scanRetryIngredientMatching',
		})
		fireEvent.click(retry)

		await screen.findByText('Tofu and greens')
		expect(findRecipesFromIngredients).toHaveBeenCalledTimes(2)
		expect(jest.mocked(findRecipesFromIngredients).mock.calls[0][0]).toBe(
			confirmed,
		)
		expect(jest.mocked(findRecipesFromIngredients).mock.calls[1][0]).toBe(
			confirmed,
		)
	})

	it('keeps a failed retry visible and recoverable', async () => {
		jest
			.mocked(findRecipesFromIngredients)
			.mockRejectedValueOnce(new Error('First failure'))
			.mockRejectedValueOnce(new Error('Retry failure'))

		render(
			<PhotoIntelligencePanel ingredients={['Tofu']} inputSource='manual' />,
		)
		fireEvent.click(
			await screen.findByRole('button', {
				name: 'scanRetryIngredientMatching',
			}),
		)

		expect(await screen.findByRole('alert')).toHaveTextContent('Retry failure')
		expect(
			screen.getByRole('button', { name: 'scanRetryIngredientMatching' }),
		).toBeEnabled()
		expect(findRecipesFromIngredients).toHaveBeenCalledTimes(2)
	})

	it('aborts an obsolete request and ignores its late result after input changes', async () => {
		let resolveOld!: (value: {
			matches: Array<{
				recipeId: string
				recipeTitle: string
				matchedIngredients: string[]
				missingIngredients: string[]
			}>
			queryIngredients: string[]
			source: 'backend'
		}) => void
		const oldResult = new Promise(resolve => {
			resolveOld = resolve
		})
		jest
			.mocked(findRecipesFromIngredients)
			.mockReturnValueOnce(
				oldResult as ReturnType<typeof findRecipesFromIngredients>,
			)
			.mockResolvedValueOnce({
				matches: [
					{
						recipeId: 'new',
						recipeTitle: 'Kale bowl',
						matchedIngredients: ['Kale'],
						missingIngredients: [],
					},
				],
				queryIngredients: ['Kale'],
				source: 'backend',
			})
		const { rerender } = render(
			<PhotoIntelligencePanel ingredients={['Tofu']} inputSource='manual' />,
		)
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenCalledTimes(1),
		)
		const oldSignal = jest.mocked(findRecipesFromIngredients).mock.calls[0][1]

		rerender(
			<PhotoIntelligencePanel ingredients={['Kale']} inputSource='manual' />,
		)
		expect(oldSignal?.aborted).toBe(true)
		expect(await screen.findByText('Kale bowl')).toBeInTheDocument()

		await act(async () => {
			resolveOld({
				matches: [
					{
						recipeId: 'old',
						recipeTitle: 'Old tofu bowl',
						matchedIngredients: ['Tofu'],
						missingIngredients: [],
					},
				],
				queryIngredients: ['Tofu'],
				source: 'backend',
			})
			await oldResult
		})
		expect(screen.getByText('Kale bowl')).toBeInTheDocument()
		expect(screen.queryByText('Old tofu bowl')).not.toBeInTheDocument()
	})

	it('aborts matching when the panel unmounts', async () => {
		let resolveRequest!: (value: {
			matches: []
			queryIngredients: string[]
			source: 'backend'
		}) => void
		const pending = new Promise(resolve => {
			resolveRequest = resolve
		})
		jest
			.mocked(findRecipesFromIngredients)
			.mockReturnValueOnce(
				pending as ReturnType<typeof findRecipesFromIngredients>,
			)
		const { unmount } = render(
			<PhotoIntelligencePanel ingredients={['Tofu']} inputSource='manual' />,
		)
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenCalledTimes(1),
		)
		const signal = jest.mocked(findRecipesFromIngredients).mock.calls[0][1]

		unmount()
		expect(signal?.aborted).toBe(true)
		await act(async () => {
			resolveRequest({
				matches: [],
				queryIngredients: ['Tofu'],
				source: 'backend',
			})
			await pending
		})
	})
})
