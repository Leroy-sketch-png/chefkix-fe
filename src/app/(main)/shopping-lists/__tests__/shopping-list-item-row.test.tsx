import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShoppingListItemRow } from '@/app/(main)/shopping-lists/ShoppingListItemRow'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		const messages: Record<string, string> = {
			somethingWentWrong: 'Something went wrong',
			unexpectedError: 'Unexpected error',
			tryAgain: 'Try again',
		}

		return messages[key] ?? key
	},
}))

describe('ShoppingListItemRow', () => {
	it('shows a localized fallback when a recipe tag payload crashes the row', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(
			<ul>
				<ShoppingListItemRow
					item={{
						itemId: 'item-1',
						ingredient: 'Flour',
						quantity: '2 cups',
						unit: null,
						category: 'Baking',
						recipes: [{ broken: true } as unknown as string],
						checked: false,
						addedManually: false,
					}}
					onToggle={jest.fn()}
					onRemove={jest.fn()}
					removeAriaLabel='Remove item'
					mutationDisabled={false}
					togglePending={false}
				/>
			</ul>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain(
			'Objects are not valid as a React child',
		)
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})

	it('blocks toggle and remove commands while an item mutation is settling', () => {
		const onToggle = jest.fn()
		const onRemove = jest.fn()

		render(
			<ul>
				<ShoppingListItemRow
					item={{
						itemId: 'item-1',
						ingredient: 'Flour',
						quantity: '2 cups',
						unit: null,
						category: 'Baking',
						recipes: [],
						checked: false,
						addedManually: false,
					}}
					onToggle={onToggle}
					onRemove={onRemove}
					removeAriaLabel='Remove item'
					mutationDisabled
					togglePending
				/>
			</ul>,
		)

		const toggle = screen.getByRole('checkbox', { name: 'Flour' })
		const remove = screen.getByRole('button', { name: 'Remove item' })
		expect(toggle.hasAttribute('disabled')).toBe(true)
		expect(toggle.getAttribute('aria-busy')).toBe('true')
		expect(remove.hasAttribute('disabled')).toBe(true)

		fireEvent.click(toggle)
		fireEvent.click(remove)
		expect(onToggle).not.toHaveBeenCalled()
		expect(onRemove).not.toHaveBeenCalled()
	})
})
