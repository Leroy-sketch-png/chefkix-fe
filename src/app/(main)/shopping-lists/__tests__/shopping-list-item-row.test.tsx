import React from 'react'
import { render, screen } from '@testing-library/react'
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
})
