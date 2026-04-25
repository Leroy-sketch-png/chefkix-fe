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
})
