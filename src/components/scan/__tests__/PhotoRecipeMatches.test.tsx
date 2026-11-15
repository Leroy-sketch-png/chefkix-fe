import { fireEvent, render, screen } from '@testing-library/react'
import { PhotoRecipeMatches } from '@/components/scan/PhotoRecipeMatches'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/components/scan/PhotoRecipeMatchCard', () => ({
	PhotoRecipeMatchCard: () => null,
}))

describe('PhotoRecipeMatches retry action', () => {
	it('exposes a labeled user action only when retry is provided', () => {
		const onRetry = jest.fn()
		const { rerender } = render(
			<PhotoRecipeMatches
				matches={[]}
				error='Matching failed'
				mode='ingredients'
				onRetry={onRetry}
			/>,
		)

		const retry = screen.getByRole('button', {
			name: 'scanRetryIngredientMatching',
		})
		expect(screen.getByRole('alert')).toHaveTextContent('Matching failed')
		fireEvent.click(retry)
		expect(onRetry).toHaveBeenCalledTimes(1)

		rerender(
			<PhotoRecipeMatches
				matches={[]}
				error='Dish retrieval failed'
				mode='dish'
			/>,
		)
		expect(
			screen.queryByRole('button', {
				name: 'scanRetryIngredientMatching',
			}),
		).not.toBeInTheDocument()
	})
})
