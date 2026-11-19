import { fireEvent, render, screen } from '@testing-library/react'
import { PhotoRecipeMatches } from '@/components/scan/PhotoRecipeMatches'
import { ApiError } from '@/lib/error-utils'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/components/scan/PhotoRecipeMatchCard', () => ({
	PhotoRecipeMatchCard: () => null,
}))

describe('PhotoRecipeMatches error recovery', () => {
	it('routes authentication-required failures to sign-in without a pointless retry', () => {
		const onRetry = jest.fn()
		render(
			<PhotoRecipeMatches
				matches={[]}
				error={new ApiError('unauthorized', 401, 'UNAUTHORIZED')}
				mode='ingredients'
				onRetry={onRetry}
			/>,
		)

		expect(screen.getByRole('alert')).toHaveTextContent(
			'scanMatchingRequiresSignIn',
		)
		expect(
			screen.getByRole('link', { name: 'scanSignInToMatch' }),
		).toHaveAttribute('href', '/auth/sign-in?returnTo=%2Fscan')
		expect(
			screen.queryByRole('button', { name: 'scanRetryIngredientMatching' }),
		).not.toBeInTheDocument()
		expect(onRetry).not.toHaveBeenCalled()
	})

	it('does not offer sign-in or retry for access-denied failures', () => {
		render(
			<PhotoRecipeMatches
				matches={[]}
				error={new ApiError('forbidden', 403, 'FORBIDDEN')}
				mode='ingredients'
				onRetry={jest.fn()}
			/>,
		)

		expect(screen.getByRole('alert')).toHaveTextContent(
			'scanMatchingAccessDenied',
		)
		expect(screen.queryByRole('link')).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'scanRetryIngredientMatching' }),
		).not.toBeInTheDocument()
	})

	it.each([0, 408, 429, 503])(
		'offers retry for retryable HTTP/network status %s',
		status => {
			const onRetry = jest.fn()
			render(
				<PhotoRecipeMatches
					matches={[]}
					error={new ApiError('temporary failure', status)}
					mode='ingredients'
					onRetry={onRetry}
				/>,
			)

			const retry = screen.getByRole('button', {
				name: 'scanRetryIngredientMatching',
			})
			fireEvent.click(retry)
			expect(onRetry).toHaveBeenCalledTimes(1)
		},
	)

	it('does not offer retry for a non-retryable request failure', () => {
		render(
			<PhotoRecipeMatches
				matches={[]}
				error={new ApiError('invalid request', 400)}
				mode='ingredients'
				onRetry={jest.fn()}
			/>,
		)

		expect(
			screen.queryByRole('button', {
				name: 'scanRetryIngredientMatching',
			}),
		).not.toBeInTheDocument()
	})
})
