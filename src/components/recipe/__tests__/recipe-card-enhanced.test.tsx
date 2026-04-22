import React from 'react'
import { render, screen } from '@testing-library/react'
import { RecipeCardEnhanced } from '@/components/recipe/RecipeCardEnhanced'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		switch (key) {
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
	}
})

jest.mock('@/components/ui/image-with-fallback', () => ({
	ImageWithFallback: () => {
		throw new Error('recipe-card-boom')
	},
}))

describe('RecipeCardEnhanced', () => {
	it('shows a localized fallback when a card variant crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(
			<RecipeCardEnhanced
				variant='grid'
				id='recipe-1'
				title='Saffron Rice'
				imageUrl='/recipe.jpg'
				cookTimeMinutes={25}
				difficulty='Beginner'
				cookCount={42}
				rating={4.8}
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain('recipe-card-boom')
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
