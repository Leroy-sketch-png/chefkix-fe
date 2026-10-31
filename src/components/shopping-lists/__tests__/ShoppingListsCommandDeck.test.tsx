import React from 'react'
import { render, screen } from '@testing-library/react'
import { ShoppingListsCommandDeck } from '@/components/shopping-lists/ShoppingListsCommandDeck'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		const messages: Record<string, string> = {
			commandEyebrow: 'Shopping',
			commandHeadingDetail: 'Your shopping list',
			commandHeadingList: 'Your shopping lists',
			statLists: 'Lists',
			statItems: 'Items',
			statChecked: 'Checked',
			statProgress: 'Progress',
		}

		return messages[key] ?? key
	},
}))

const counts = { lists: 2, totalItems: 11, checkedItems: 3, progress: 27 }

describe('ShoppingListsCommandDeck', () => {
	it('identifies the actual saved list on its detail view', () => {
		render(
			<ShoppingListsCommandDeck
				variant='detail'
				heading='Cook Plan - Shopping for today'
				counts={counts}
				onPrimaryAction={jest.fn()}
				primaryActionLabel='Add item'
			/>,
		)

		expect(
			screen.getByRole('heading', {
				name: 'Cook Plan - Shopping for today',
			}),
		).toBeTruthy()
	})

	it('uses plain task language for the list overview', () => {
		render(
			<ShoppingListsCommandDeck
				variant='list'
				counts={counts}
				onPrimaryAction={jest.fn()}
				primaryActionLabel='Create list'
			/>,
		)

		expect(
			screen.getByRole('heading', { name: 'Your shopping lists' }),
		).toBeTruthy()
	})
})
