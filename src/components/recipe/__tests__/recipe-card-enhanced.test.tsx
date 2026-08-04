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
	const createMotionValue = (initial = 0) => {
		let current = initial
		return {
			get: () => current,
			set: (next: number) => {
				current = next
			},
		}
	}

	return {
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
						const domProps = { ...props } as Record<string, unknown>
						for (const key of [
							'animate',
							'exit',
							'initial',
							'layout',
							'transition',
							'variants',
							'whileFocus',
							'whileHover',
							'whileInView',
							'whileTap',
						]) {
							delete domProps[key]
						}
						return React.createElement(tag, domProps, children)
					},
			},
		),
		useMotionValue: (value = 0) => createMotionValue(value),
		useMotionTemplate: () => '',
		useSpring: (value: unknown) => {
			if (value && typeof value === 'object' && 'get' in (value as object)) {
				return value
			}
			return createMotionValue(value as number)
		},
	}
})

jest.mock('@/components/ui/image-with-fallback', () => ({
	ImageWithFallback: ({ src, alt }: { src: string; alt: string }) => {
		if (src === '/crash.jpg') throw new Error('recipe-card-boom')
		return <img src={src} alt={alt} />
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
				imageUrl='/crash.jpg'
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

	it('omits metadata rows that a sparse grid result cannot prove', () => {
		render(
			<RecipeCardEnhanced
				variant='grid'
				id='recipe-sparse'
				title='Weeknight noodles'
				imageUrl='/noodles.jpg'
			/>,
		)

		expect(screen.getByText('Weeknight noodles')).toBeTruthy()
		expect(screen.queryByText('0 min')).toBeNull()
		expect(screen.queryByText('Beginner')).toBeNull()
		expect(screen.queryByText('0.0')).toBeNull()
	})

	it('retains supplied grid proof', () => {
		render(
			<RecipeCardEnhanced
				variant='grid'
				id='recipe-rich'
				title='Saffron Rice'
				imageUrl='/rice.jpg'
				cookTimeMinutes={25}
				difficulty='Beginner'
				cookCount={42}
				rating={4.8}
			/>,
		)

		expect(screen.getByText('25 min')).toBeTruthy()
		expect(screen.getByText('diffBeginner')).toBeTruthy()
		expect(screen.getByText(/4.8/)).toBeTruthy()
	})
})
