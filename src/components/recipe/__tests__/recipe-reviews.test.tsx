import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { RecipeReviews } from '@/components/recipe/RecipeReviews'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		switch (key) {
			case 'reviewsHeading':
				return 'Reviews'
			case 'reviewPlural':
				return 'reviews'
			case 'reviewSingular':
				return 'review'
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
		AnimatePresence: ({ children }: { children: React.ReactNode }) => (
			<>{children}</>
		),
	}
})

jest.mock('@/components/ui/avatar', () => ({
	Avatar: () => {
		throw new Error('recipe-review-boom')
	},
	AvatarImage: () => null,
	AvatarFallback: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))

jest.mock('@/components/ui/star-rating', () => ({
	StarRating: () => <div>stars</div>,
}))

jest.mock('@/services/post', () => ({
	getReviewsForRecipe: jest.fn().mockResolvedValue({
		success: true,
		data: [
			{
				id: 'review-1',
				userId: 'user-2',
				displayName: 'Cook Friend',
				avatarUrl: '/avatar.png',
				createdAt: '2026-04-20T00:00:00.000Z',
				reviewRating: 5,
				content: 'Loved it',
				likes: 1,
				commentCount: 2,
			},
		],
	}),
	getRecipeReviewStats: jest.fn().mockResolvedValue({
		success: true,
		data: {
			averageRating: 4.7,
			totalReviews: 1,
			ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
		},
	}),
}))

describe('RecipeReviews', () => {
	it('shows a localized fallback when a review row crashes', async () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(<RecipeReviews recipeId='recipe-1' />)

		await waitFor(() => {
			const alert = screen.getByRole('alert')
			expect(alert.textContent).toContain('Something went wrong')
			expect(alert.textContent).toContain('recipe-review-boom')
		})

		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
