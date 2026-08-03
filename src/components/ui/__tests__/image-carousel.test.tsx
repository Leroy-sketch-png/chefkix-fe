import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ImageCarousel } from '@/components/ui/image-carousel'

jest.mock('next-intl', () => ({
	useTranslations:
		() =>
		(
			key: string,
			values?: { current?: number; total?: number; number?: number },
		) => {
			switch (key) {
				case 'ariaImageCarousel':
					return `Image carousel ${values?.current} of ${values?.total}`
				case 'ariaPreviousImage':
					return 'Previous image'
				case 'ariaNextImage':
					return 'Next image'
				case 'ariaImageIndicators':
					return 'Image indicators'
				case 'ariaGoToImage':
					return `Go to image ${values?.number}`
				default:
					return key
			}
		},
}))

jest.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	motion: {
		div: ({
			children,
			custom: _custom,
			variants: _variants,
			initial: _initial,
			animate: _animate,
			exit: _exit,
			transition: _transition,
			drag: _drag,
			dragConstraints: _dragConstraints,
			dragElastic: _dragElastic,
			onDragEnd: _onDragEnd,
			...props
		}: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
			<div {...props}>{children}</div>
		),
	},
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: ({
		fill: _fill,
		unoptimized: _unoptimized,
		...props
	}: Record<string, unknown>) => <img {...props} />,
}))

describe('ImageCarousel', () => {
	const validUnsplashImage =
		'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&q=60'
	const knownBrokenUnsplashImage =
		'https://images.unsplash.com/photo-1482049016530-d79f7d5e8c6e?w=160'

	it('preserves valid remote food images and preflights only known-broken sources', () => {
		const { rerender } = render(
			<ImageCarousel
				images={[validUnsplashImage]}
				alt='Dish'
				showControls={false}
				showIndicators={false}
			/>,
		)

		expect(
			screen.getByRole('img', { name: 'Dish 1 of 1' }).getAttribute('src'),
		).toBe(validUnsplashImage)

		rerender(
			<ImageCarousel
				images={[knownBrokenUnsplashImage]}
				alt='Dish'
				showControls={false}
				showIndicators={false}
			/>,
		)

		expect(
			screen.getByRole('img', { name: 'Dish 1 of 1' }).getAttribute('src'),
		).toBe('/placeholder-recipe.svg')
	})

	it('renders a fallback frame when the current image fails to load', () => {
		render(
			<ImageCarousel
				images={['https://example.com/broken-image.jpg']}
				alt='Dish'
				showControls={false}
				showIndicators={false}
			/>,
		)

		const image = screen.getByRole('img', { name: 'Dish 1 of 1' })
		expect(image.tagName).toBe('IMG')

		fireEvent.error(image)

		const fallback = screen.getByRole('img', { name: 'Dish 1 of 1' })
		expect(fallback.tagName).toBe('DIV')
	})

	it('restores loading feedback when the image changes at the same index', () => {
		const { container, rerender } = render(
			<ImageCarousel
				images={['https://example.com/first.jpg']}
				alt='Dish'
				showControls={false}
				showIndicators={false}
			/>,
		)
		const firstImage = screen.getByRole('img', { name: 'Dish 1 of 1' })

		expect(container.querySelector('.animate-pulse')).not.toBeNull()
		fireEvent.load(firstImage)
		expect(container.querySelector('.animate-pulse')).toBeNull()

		rerender(
			<ImageCarousel
				images={['https://example.com/second.jpg']}
				alt='Dish'
				showControls={false}
				showIndicators={false}
			/>,
		)

		expect(
			screen.getByRole('img', { name: 'Dish 1 of 1' }).getAttribute('src'),
		).toBe('https://example.com/second.jpg')
		expect(container.querySelector('.animate-pulse')).not.toBeNull()
	})
})
