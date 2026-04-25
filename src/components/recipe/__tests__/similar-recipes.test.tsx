import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SimilarRecipes } from '@/components/recipe/SimilarRecipes'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		switch (key) {
			case 'youMightAlsoLike':
				return 'You might also like'
			case 'somethingWentWrong':
				return 'Something went wrong'
			case 'tryAgain':
				return 'Try again'
			case 'unexpectedError':
				return 'Unexpected error'
			default:
				return key
		}
	},
}))

jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
		...props
	}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a href={typeof href === 'string' ? href : '#'} {...props}>
			{children}
		</a>
	),
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: () => {
		throw new Error('similar-recipe-boom')
	},
}))

jest.mock('framer-motion', () => {
	const React = require('react')

	return {
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
						React.createElement(tag, props, children),
			},
		),
	}
})

jest.mock('@/services/recipe', () => ({
	getSimilarRecipes: jest.fn().mockResolvedValue({
		success: true,
		data: [
			{
				id: 'recipe-2',
				title: 'Chili Crisp Eggs',
				difficulty: 'Beginner',
				prepTimeMinutes: 5,
				cookTimeMinutes: 10,
				totalTimeMinutes: 15,
				coverImageUrl: ['/recipe.jpg'],
				averageRating: 4.6,
				cookCount: 120,
			},
		],
	}),
}))

describe('SimilarRecipes', () => {
	it('shows a localized fallback when a recommendation card crashes', async () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(<SimilarRecipes recipeId='recipe-1' />)

		await waitFor(() => {
			const alert = screen.getByRole('alert')
			expect(alert.textContent).toContain('Something went wrong')
			expect(alert.textContent).toContain('similar-recipe-boom')
		})

		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
