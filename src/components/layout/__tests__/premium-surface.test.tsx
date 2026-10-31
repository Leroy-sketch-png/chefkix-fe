import { render, screen } from '@testing-library/react'
import { SurfaceSectionHeader } from '../PremiumSurface'

describe('SurfaceSectionHeader wrapping', () => {
	it('lets a long chip grow and wrap instead of clipping inside a fixed-height pill', () => {
		const { container } = render(
			<SurfaceSectionHeader
				eyebrow='Taste Intelligence'
				chipText='Live Behavioral Profile'
			/>,
		)

		const header = container.firstElementChild
		const eyebrow = screen.getByText('Taste Intelligence')
		const chip = screen.getByText('Live Behavioral Profile')

		expect(header?.className).toContain('flex-wrap')
		expect(eyebrow.className).toContain('min-w-0')
		expect(chip.className).toContain('min-h-6')
		expect(chip.className).toContain('whitespace-normal')
		expect(chip.className).toContain('break-words')
		expect(chip.classList.contains('h-6')).toBe(false)
	})
})
