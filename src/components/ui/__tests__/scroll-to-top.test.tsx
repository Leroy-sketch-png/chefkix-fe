import { render, screen } from '@testing-library/react'
import { ScrollToTop } from '../scroll-to-top'
import { useUiStore } from '@/store/uiStore'

jest.mock('next/navigation', () => ({
	usePathname: () => '/settings',
}))

describe('ScrollToTop', () => {
	beforeEach(() => {
		useUiStore.setState({ cookingMode: 'hidden' })
	})

	it('stays below modal surfaces in the shared stacking order', () => {
		render(<ScrollToTop />)

		const button = screen.getByRole('button', { name: 'Scroll to top' })
		expect(button.className).toContain('z-sticky')
		expect(button.className).not.toContain('z-notification')
	})

	it('clears the mobile bottom-navigation action area and keeps its desktop offset', () => {
		render(<ScrollToTop />)

		const button = screen.getByRole('button', { name: 'Scroll to top' })
		expect(button.className).toContain(
			'bottom-[calc(4rem+var(--space-2)+env(safe-area-inset-bottom))]',
		)
		expect(button.className).toContain('md:bottom-6')
	})

	it.each(['mini', 'docked', 'expanded'] as const)(
		'hides while the cooking UI is %s so its controls remain unobstructed',
		cookingMode => {
			useUiStore.setState({ cookingMode })

			render(<ScrollToTop />)

			expect(screen.queryByRole('button', { name: 'Scroll to top' })).toBeNull()
		},
	)
})
